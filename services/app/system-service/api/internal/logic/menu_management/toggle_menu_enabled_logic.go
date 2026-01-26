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

type ToggleMenuEnabledLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewToggleMenuEnabledLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ToggleMenuEnabledLogic {
	return &ToggleMenuEnabledLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ToggleMenuEnabledLogic) ToggleMenuEnabled(req *types.ToggleMenuEnabledReq) (resp *types.ToggleMenuEnabledResp, err error) {
	// 1. 查询现有菜单
	existingMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询菜单失败: %v", err)
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	if existingMenu == nil {
		return nil, menus.ErrMenuNotFound
	}

	// 2. 如果状态没有变化，直接返回
	if existingMenu.Enabled == req.Enabled {
		menuType := l.convertMenuToType(existingMenu)
		return &types.ToggleMenuEnabledResp{
			Menu: menuType,
		}, nil
	}

	// 3. 保存旧值用于审计日志
	oldEnabled := existingMenu.Enabled

	// 4. 更新启用状态
	err = l.svcCtx.MenuModel.UpdateEnabled(l.ctx, req.Id, req.Enabled)
	if err != nil {
		logx.Errorf("更新菜单启用状态失败: %v", err)
		return nil, fmt.Errorf("更新菜单启用状态失败: %w", err)
	}

	// 5. 重新查询菜单以获取最新数据
	updatedMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询更新后的菜单失败: %v", err)
		return nil, fmt.Errorf("查询更新后的菜单失败: %w", err)
	}

	// 6. 记录启用/禁用审计日志
	if err := l.recordToggleEnabledAuditLog(updatedMenu, oldEnabled, req.Enabled); err != nil {
		logx.Errorf("记录启用/禁用审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 7. 转换为响应类型
	menuType := l.convertMenuToType(updatedMenu)

	resp = &types.ToggleMenuEnabledResp{
		Menu: menuType,
	}
	return
}

// recordToggleEnabledAuditLog 记录启用/禁用审计日志
func (l *ToggleMenuEnabledLogic) recordToggleEnabledAuditLog(menu *menus.Menu, oldEnabled, newEnabled bool) error {
	auditLogId, _ := uuid.NewV7()

	// 构建变更字段
	changedFields := []string{"enabled"}
	oldValueMap := map[string]interface{}{
		"enabled": oldEnabled,
	}
	newValueMap := map[string]interface{}{
		"enabled": newEnabled,
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

	operationType := "enable"
	if !newEnabled {
		operationType = "disable"
	}

	auditLog := &menu_audit_logs.MenuAuditLog{
		Id:            auditLogId.String(),
		MenuId:        menu.Id,
		OperationType: operationType,
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
func (l *ToggleMenuEnabledLogic) convertMenuToType(menu *menus.Menu) types.Menu {
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
		RiskFlags:     []string{}, // 切换状态时暂时不计算风险标记
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
	if menu.Icon != nil {
		menuType.Icon = *menu.Icon
	}
	if menu.CreatedBy != nil {
		menuType.CreatedBy = *menu.CreatedBy
	}
	if menu.UpdatedBy != nil {
		menuType.UpdatedBy = *menu.UpdatedBy
	}

	return menuType
}
