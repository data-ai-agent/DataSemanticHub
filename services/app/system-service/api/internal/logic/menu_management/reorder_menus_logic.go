// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menu_audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menus"
	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/datatypes"
)

type ReorderMenusLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewReorderMenusLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ReorderMenusLogic {
	return &ReorderMenusLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ReorderMenusLogic) ReorderMenus(req *types.ReorderMenusReq) (resp *types.ReorderMenusResp, err error) {
	// 1. 参数校验
	if len(req.Updates) == 0 {
		return nil, fmt.Errorf("更新列表不能为空")
	}

	// 2. 同级 order 唯一性检查
	if err := l.checkOrderUniqueness(req.Updates); err != nil {
		return nil, err
	}

	// 3. 验证所有菜单是否存在且属于同一父级
	if err := l.validateMenus(req.Updates); err != nil {
		return nil, err
	}

	// 4. 保存旧值用于审计日志
	oldValues := l.getOldValues(req.Updates)

	// 5. 事务保证原子性 - 批量更新排序
	orderUpdates := make([]menus.OrderUpdate, len(req.Updates))
	for i, update := range req.Updates {
		orderUpdates[i] = menus.OrderUpdate{
			Id:    update.Id,
			Order: update.Order,
		}
	}

	err = l.svcCtx.MenuModel.BatchUpdateOrder(l.ctx, orderUpdates)
	if err != nil {
		logx.Errorf("批量更新排序失败: %v", err)
		return nil, fmt.Errorf("批量更新排序失败: %w", err)
	}

	// 6. 记录排序审计日志
	if err := l.recordReorderAuditLog(req.Updates, oldValues); err != nil {
		logx.Errorf("记录排序审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 7. 构建响应
	resp = &types.ReorderMenusResp{
		SuccessCount: len(req.Updates),
		FailedCount:  0,
		Errors:       []types.MenuOperationError{},
	}

	return
}

// checkOrderUniqueness 检查同级 order 唯一性
func (l *ReorderMenusLogic) checkOrderUniqueness(updates []types.OrderUpdate) error {
	// 按菜单ID分组，检查同一父级下的 order 是否唯一
	menuMap := make(map[string]*menus.Menu)
	parentOrderMap := make(map[string]map[int]string) // parentId -> order -> menuId

	for _, update := range updates {
		menu, err := l.svcCtx.MenuModel.FindOne(l.ctx, update.Id)
		if err != nil {
			return fmt.Errorf("查询菜单失败: %w", err)
		}
		menuMap[update.Id] = menu

		// 确定父级ID（用于分组）
		parentKey := ""
		if menu.ParentId != nil {
			parentKey = *menu.ParentId
		}

		// 检查同一父级下是否有重复的 order
		if parentOrderMap[parentKey] == nil {
			parentOrderMap[parentKey] = make(map[int]string)
		}
		if existingMenuId, exists := parentOrderMap[parentKey][update.Order]; exists && existingMenuId != update.Id {
			return menus.ErrMenuOrderConflict
		}
		parentOrderMap[parentKey][update.Order] = update.Id
	}

	return nil
}

// validateMenus 验证所有菜单是否存在
func (l *ReorderMenusLogic) validateMenus(updates []types.OrderUpdate) error {
	// 验证所有菜单是否存在
	var firstParentId *string
	for _, update := range updates {
		menu, err := l.svcCtx.MenuModel.FindOne(l.ctx, update.Id)
		if err != nil {
			return fmt.Errorf("菜单 %s 不存在: %w", update.Id, err)
		}

		// 检查是否属于同一父级（第一个菜单的父级作为基准）
		if firstParentId == nil {
			firstParentId = menu.ParentId
		} else {
			// 比较父级ID
			if (firstParentId == nil) != (menu.ParentId == nil) {
				return fmt.Errorf("菜单必须属于同一父级")
			}
			if firstParentId != nil && menu.ParentId != nil && *firstParentId != *menu.ParentId {
				return fmt.Errorf("菜单必须属于同一父级")
			}
		}
	}

	return nil
}

// getOldValues 获取旧值用于审计日志
func (l *ReorderMenusLogic) getOldValues(updates []types.OrderUpdate) map[string]int {
	oldValues := make(map[string]int)
	for _, update := range updates {
		menu, err := l.svcCtx.MenuModel.FindOne(l.ctx, update.Id)
		if err == nil && menu != nil {
			oldValues[update.Id] = menu.Order
		}
	}
	return oldValues
}

// recordReorderAuditLog 记录排序审计日志
func (l *ReorderMenusLogic) recordReorderAuditLog(updates []types.OrderUpdate, oldValues map[string]int) error {
	// 获取操作人信息（从 context 中）
	operatorId := ""
	operatorName := ""
	if userIDValue := l.ctx.Value(contextkeys.UserIDKey); userIDValue != nil {
		if userID, ok := userIDValue.(string); ok {
			operatorId = userID
			// TODO: 可以从 UserModel 查询操作人姓名
		}
	}

	var operatorIdPtr *string
	var operatorNamePtr *string
	if operatorId != "" {
		operatorIdPtr = &operatorId
	}
	if operatorName != "" {
		operatorNamePtr = &operatorName
	}

	// 为每个菜单记录一条审计日志
	for _, update := range updates {
		oldOrder, hasOldValue := oldValues[update.Id]
		if !hasOldValue {
			continue // 跳过没有旧值的记录
		}

		// 如果 order 没有变化，不记录审计日志
		if oldOrder == update.Order {
			continue
		}

		auditLogId, _ := uuid.NewV7()

		changedFields := []string{"order"}
		oldValueMap := map[string]interface{}{
			"order": oldOrder,
		}
		newValueMap := map[string]interface{}{
			"order": update.Order,
		}

		oldValueJSON, _ := json.Marshal(oldValueMap)
		newValueJSON, _ := json.Marshal(newValueMap)
		changedFieldsJSON, _ := json.Marshal(changedFields)

		auditLog := &menu_audit_logs.MenuAuditLog{
			Id:            auditLogId.String(),
			MenuId:        update.Id,
			OperationType: "reorder",
			OperatorId:    operatorIdPtr,
			OperatorName:  operatorNamePtr,
			ChangedFields: datatypes.JSON(changedFieldsJSON),
			OldValue:      datatypes.JSON(oldValueJSON),
			NewValue:      datatypes.JSON(newValueJSON),
		}

		_, err := l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
		if err != nil {
			logx.Errorf("记录菜单 %s 排序审计日志失败: %v", update.Id, err)
			// 继续处理其他菜单
		}
	}

	return nil
}
