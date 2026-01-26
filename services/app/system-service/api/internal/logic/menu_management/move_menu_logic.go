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

type MoveMenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMoveMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MoveMenuLogic {
	return &MoveMenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MoveMenuLogic) MoveMenu(req *types.MoveMenuReq) (resp *types.MoveMenuResp, err error) {
	// 1. 查询现有菜单
	existingMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询菜单失败: %v", err)
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	if existingMenu == nil {
		return nil, menus.ErrMenuNotFound
	}

	// 2. 保存旧值用于审计日志
	oldParentId := existingMenu.ParentId
	oldOrder := existingMenu.Order

	// 3. 确定新父级ID
	var newParentId *string
	if req.NewParentId != "" {
		newParentId = &req.NewParentId
	}

	// 4. 循环检测（使用 CheckCycle 方法）
	if newParentId != nil {
		hasCycle, err := l.svcCtx.MenuModel.CheckCycle(l.ctx, req.Id, *newParentId)
		if err != nil {
			logx.Errorf("检查循环引用失败: %v", err)
			return nil, fmt.Errorf("检查循环引用失败: %w", err)
		}
		if hasCycle {
			return nil, menus.ErrMenuCycleDetected
		}
	}

	// 5. 分组约束检查（如启用分组）
	if newParentId != nil {
		// 如果菜单有 group_id，检查新父级是否同组
		if existingMenu.GroupId != nil {
			parentMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, *newParentId)
			if err != nil {
				logx.Errorf("查询新父级菜单失败: %v", err)
				return nil, fmt.Errorf("查询新父级菜单失败: %w", err)
			}
			if parentMenu == nil {
				return nil, menus.ErrMenuNotFound
			}
			if parentMenu.GroupId == nil || *parentMenu.GroupId != *existingMenu.GroupId {
				return nil, menus.ErrMenuGroupConstraint
			}
		}
	}

	// 6. 新位置 order 计算（如果提供的 order 与现有同级菜单冲突，需要调整）
	newOrder := req.NewOrder
	if newParentId != nil {
		// 查询新父级下的所有子菜单
		children, err := l.svcCtx.MenuModel.FindChildren(l.ctx, *newParentId)
		if err != nil {
			logx.Errorf("查询子菜单失败: %v", err)
			return nil, fmt.Errorf("查询子菜单失败: %w", err)
		}
		// 检查 order 是否冲突
		for _, child := range children {
			if child.Id != req.Id && child.Order == newOrder {
				// 如果冲突，将新 order 设置为最大值+1
				maxOrder := 0
				for _, c := range children {
					if c.Order > maxOrder {
						maxOrder = c.Order
					}
				}
				newOrder = maxOrder + 1
				break
			}
		}
	} else {
		// 移到根节点，检查根节点的 order 是否冲突
		allMenus, err := l.svcCtx.MenuModel.FindTree(l.ctx, &menus.FindTreeReq{})
		if err != nil {
			logx.Errorf("查询菜单树失败: %v", err)
			return nil, fmt.Errorf("查询菜单树失败: %w", err)
		}
		for _, menu := range allMenus {
			if menu.Id != req.Id && menu.ParentId == nil && menu.Order == newOrder {
				// 如果冲突，将新 order 设置为最大值+1
				maxOrder := 0
				for _, m := range allMenus {
					if m.ParentId == nil && m.Order > maxOrder {
						maxOrder = m.Order
					}
				}
				newOrder = maxOrder + 1
				break
			}
		}
	}

	// 7. 事务保证原子性 - 移动菜单
	err = l.svcCtx.MenuModel.Move(l.ctx, req.Id, newParentId, newOrder)
	if err != nil {
		logx.Errorf("移动菜单失败: %v", err)
		return nil, fmt.Errorf("移动菜单失败: %w", err)
	}

	// 8. 重新查询菜单以获取最新数据
	updatedMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询更新后的菜单失败: %v", err)
		return nil, fmt.Errorf("查询更新后的菜单失败: %w", err)
	}

	// 9. 记录移动审计日志
	if err := l.recordMoveAuditLog(updatedMenu, oldParentId, oldOrder, newParentId, newOrder); err != nil {
		logx.Errorf("记录移动审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 10. 转换为响应类型
	menuType := l.convertMenuToType(updatedMenu)

	resp = &types.MoveMenuResp{
		Menu: menuType,
	}
	return
}

// recordMoveAuditLog 记录移动审计日志
func (l *MoveMenuLogic) recordMoveAuditLog(menu *menus.Menu, oldParentId *string, oldOrder int, newParentId *string, newOrder int) error {
	auditLogId, _ := uuid.NewV7()

	// 构建变更字段
	changedFields := []string{"parent_id", "order"}
	oldValueMap := map[string]interface{}{
		"order": oldOrder,
	}
	newValueMap := map[string]interface{}{
		"order": newOrder,
	}

	if oldParentId != nil {
		oldValueMap["parent_id"] = *oldParentId
	} else {
		oldValueMap["parent_id"] = nil
	}

	if newParentId != nil {
		newValueMap["parent_id"] = *newParentId
	} else {
		newValueMap["parent_id"] = nil
	}

	oldValueJSON, _ := json.Marshal(oldValueMap)
	newValueJSON, _ := json.Marshal(newValueMap)
	changedFieldsJSON, _ := json.Marshal(changedFields)

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

	auditLog := &menu_audit_logs.MenuAuditLog{
		Id:            auditLogId.String(),
		MenuId:        menu.Id,
		OperationType: "move",
		OperatorId:    operatorIdPtr,
		OperatorName:  operatorNamePtr,
		ChangedFields: datatypes.JSON(changedFieldsJSON),
		OldValue:      datatypes.JSON(oldValueJSON),
		NewValue:      datatypes.JSON(newValueJSON),
	}

	_, err := l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
	return err
}

// convertMenuToType 将 Model 层的 Menu 转换为 types.Menu
func (l *MoveMenuLogic) convertMenuToType(menu *menus.Menu) types.Menu {
	// 计算子节点数量
	childrenCount, _ := l.svcCtx.MenuModel.FindChildrenCount(l.ctx, menu.Id)

	menuType := types.Menu{
		Id:            menu.Id,
		Name:          menu.Name,
		Code:          menu.Code,
		Type:          menu.Type,
		Visible:       menu.Visible,
		Enabled:       menu.Enabled,
		Order:         menu.Order,
		ShowInNav:     menu.ShowInNav,
		Cacheable:     menu.Cacheable,
		ChildrenCount: int(childrenCount),
		RiskFlags:     []string{}, // 移动时暂时不计算风险标记
		CreatedAt:     menu.CreatedAt.Format("2006-01-02 15:04:05.000"),
		UpdatedAt:     menu.UpdatedAt.Format("2006-01-02 15:04:05.000"),
		Children:      []types.Menu{},
	}

	// 处理可选字段
	if menu.GroupId != nil {
		menuType.GroupId = *menu.GroupId
	}
	if menu.ParentId != nil {
		menuType.ParentId = *menu.ParentId
	}
	if menu.Path != nil {
		menuType.Path = *menu.Path
	}
	if menu.RouteName != nil {
		menuType.RouteName = *menu.RouteName
	}
	if menu.ComponentKey != nil {
		menuType.ComponentKey = *menu.ComponentKey
	}
	if menu.ExternalUrl != nil {
		menuType.ExternalUrl = *menu.ExternalUrl
	}
	if menu.OpenMode != nil {
		menuType.OpenMode = *menu.OpenMode
	}
	if menu.PermissionKey != nil {
		menuType.PermissionKey = *menu.PermissionKey
	}
	if menu.CreatedBy != nil {
		menuType.CreatedBy = *menu.CreatedBy
	}
	if menu.UpdatedBy != nil {
		menuType.UpdatedBy = *menu.UpdatedBy
	}

	return menuType
}
