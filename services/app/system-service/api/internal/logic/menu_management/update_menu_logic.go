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

type UpdateMenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateMenuLogic {
	return &UpdateMenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateMenuLogic) UpdateMenu(req *types.UpdateMenuReq) (resp *types.UpdateMenuResp, err error) {
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
	oldValueMap := l.menuToMap(existingMenu)

	// 3. 类型变更时的重新验证（如果 type 被修改）
	if req.Type != "" && req.Type != existingMenu.Type {
		if err := l.validateTypeFieldsForUpdate(req, existingMenu); err != nil {
			return nil, err
		}
		existingMenu.Type = req.Type
	}

	// 4. code 唯一性检查（如变更）
	if req.Code != "" && req.Code != existingMenu.Code {
		existingByCode, err := l.svcCtx.MenuModel.FindOneByCode(l.ctx, req.Code)
		if err != nil && err != menus.ErrMenuNotFound {
			logx.Errorf("检查菜单编码唯一性失败: %v", err)
			return nil, fmt.Errorf("检查菜单编码唯一性失败: %w", err)
		}
		if existingByCode != nil {
			return nil, menus.ErrMenuCodeExists
		}
		existingMenu.Code = req.Code
	}

	// 5. path/route_name 冲突检测（如变更）
	if req.Path != "" && (existingMenu.Path == nil || *existingMenu.Path != req.Path) {
		conflictingMenus, err := l.svcCtx.MenuModel.FindByPath(l.ctx, req.Path)
		if err != nil {
			logx.Errorf("检查路径冲突失败: %v", err)
			return nil, fmt.Errorf("检查路径冲突失败: %w", err)
		}
		// 排除自身
		for _, m := range conflictingMenus {
			if m.Id != existingMenu.Id {
				return nil, menus.ErrMenuRouteConflict
			}
		}
		existingMenu.Path = &req.Path
	}

	// 6. 循环检测（如变更 parent_id）
	if req.ParentId != "" {
		var oldParentId *string
		if existingMenu.ParentId != nil {
			oldParentId = existingMenu.ParentId
		}
		newParentId := req.ParentId
		if oldParentId == nil || *oldParentId != newParentId {
			hasCycle, err := l.svcCtx.MenuModel.CheckCycle(l.ctx, existingMenu.Id, newParentId)
			if err != nil {
				logx.Errorf("检查循环引用失败: %v", err)
				return nil, fmt.Errorf("检查循环引用失败: %w", err)
			}
			if hasCycle {
				return nil, menus.ErrMenuCycleDetected
			}
			existingMenu.ParentId = &newParentId
		}
	} else if req.ParentId == "" && existingMenu.ParentId != nil {
		// 移到根节点
		existingMenu.ParentId = nil
	}

	// 7. 分组约束检查（如变更 group_id 或 parent_id）
	if req.GroupId != "" {
		if existingMenu.ParentId != nil {
			parentMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, *existingMenu.ParentId)
			if err != nil {
				logx.Errorf("查询父菜单失败: %v", err)
				return nil, fmt.Errorf("查询父菜单失败: %w", err)
			}
			if parentMenu != nil && parentMenu.GroupId != nil && *parentMenu.GroupId != req.GroupId {
				return nil, menus.ErrMenuGroupConstraint
			}
		}
		existingMenu.GroupId = &req.GroupId
	}

	// 8. 更新其他字段
	if req.Name != "" {
		existingMenu.Name = req.Name
	}
	if req.RouteName != "" {
		existingMenu.RouteName = &req.RouteName
	}
	if req.ComponentKey != "" {
		existingMenu.ComponentKey = &req.ComponentKey
	}
	if req.ExternalUrl != "" {
		existingMenu.ExternalUrl = &req.ExternalUrl
	}
	if req.OpenMode != "" {
		existingMenu.OpenMode = &req.OpenMode
	}
	if req.PermissionKey != "" {
		existingMenu.PermissionKey = &req.PermissionKey
	}
	// 布尔值和整数直接更新（即使为 false 或 0）
	existingMenu.Visible = req.Visible
	existingMenu.Enabled = req.Enabled
	if req.Order >= 0 {
		existingMenu.Order = req.Order
	}
	existingMenu.ShowInNav = req.ShowInNav
	existingMenu.Cacheable = req.Cacheable

	// 9. 更新菜单
	err = l.svcCtx.MenuModel.Update(l.ctx, existingMenu)
	if err != nil {
		logx.Errorf("更新菜单失败: %v", err)
		return nil, fmt.Errorf("更新菜单失败: %w", err)
	}

	// 10. 记录更新审计日志
	if err := l.recordUpdateAuditLog(existingMenu, oldValueMap); err != nil {
		logx.Errorf("记录更新审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 11. 转换为响应类型
	menuType := l.convertMenuToType(existingMenu)

	resp = &types.UpdateMenuResp{
		Menu: menuType,
	}
	return
}

// validateTypeFieldsForUpdate 验证类型相关必填字段（更新时）
func (l *UpdateMenuLogic) validateTypeFieldsForUpdate(req *types.UpdateMenuReq, existingMenu *menus.Menu) error {
	switch req.Type {
	case "directory":
		// directory 类型：name, code, type 必填
		if req.Name == "" && existingMenu.Name == "" {
			return menus.ErrMenuNameRequired
		}
	case "page":
		// page 类型：name, code, type, path 必填
		if req.Name == "" && existingMenu.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.Path == "" && (existingMenu.Path == nil || *existingMenu.Path == "") {
			return menus.ErrMenuPathRequired
		}
	case "external":
		// external 类型：name, code, type, external_url, open_mode 必填
		if req.Name == "" && existingMenu.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.ExternalUrl == "" && (existingMenu.ExternalUrl == nil || *existingMenu.ExternalUrl == "") {
			return menus.ErrMenuExternalUrlRequired
		}
		if req.OpenMode == "" && (existingMenu.OpenMode == nil || *existingMenu.OpenMode == "") {
			return menus.ErrMenuOpenModeRequired
		}
		if req.OpenMode != "" && req.OpenMode != "new" && req.OpenMode != "iframe" && req.OpenMode != "same" {
			return fmt.Errorf("打开方式必须是 new/iframe/same 之一")
		}
	case "button":
		// button 类型：name, code, type 必填
		if req.Name == "" && existingMenu.Name == "" {
			return menus.ErrMenuNameRequired
		}
	default:
		return menus.ErrMenuTypeInvalid
	}
	return nil
}

// recordUpdateAuditLog 记录更新审计日志
func (l *UpdateMenuLogic) recordUpdateAuditLog(menu *menus.Menu, oldValueMap map[string]interface{}) error {
	auditLogId, _ := uuid.NewV7()

	// 构建新值
	newValueMap := l.menuToMap(menu)

	// 计算变更字段
	changedFields := []string{}
	oldValueJSONMap := make(map[string]interface{})
	newValueJSONMap := make(map[string]interface{})

	for key, oldVal := range oldValueMap {
		newVal := newValueMap[key]
		if oldVal != newVal {
			changedFields = append(changedFields, key)
			oldValueJSONMap[key] = oldVal
			newValueJSONMap[key] = newVal
		}
	}

	// 如果没有变更，不记录审计日志
	if len(changedFields) == 0 {
		return nil
	}

	oldValueJSON, _ := json.Marshal(oldValueJSONMap)
	newValueJSON, _ := json.Marshal(newValueJSONMap)
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
		OperationType: "update",
		OperatorId:    operatorIdPtr,
		OperatorName:  operatorNamePtr,
		ChangedFields: datatypes.JSON(changedFieldsJSON),
		OldValue:      datatypes.JSON(oldValueJSON),
		NewValue:      datatypes.JSON(newValueJSON),
	}

	_, err := l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
	return err
}

// menuToMap 将 Menu 转换为 map（用于审计日志）
func (l *UpdateMenuLogic) menuToMap(menu *menus.Menu) map[string]interface{} {
	m := map[string]interface{}{
		"id":          menu.Id,
		"name":        menu.Name,
		"code":        menu.Code,
		"type":        menu.Type,
		"visible":     menu.Visible,
		"enabled":     menu.Enabled,
		"order":       menu.Order,
		"show_in_nav": menu.ShowInNav,
		"cacheable":   menu.Cacheable,
	}
	if menu.GroupId != nil {
		m["group_id"] = *menu.GroupId
	}
	if menu.ParentId != nil {
		m["parent_id"] = *menu.ParentId
	}
	if menu.Path != nil {
		m["path"] = *menu.Path
	}
	if menu.RouteName != nil {
		m["route_name"] = *menu.RouteName
	}
	if menu.ComponentKey != nil {
		m["component_key"] = *menu.ComponentKey
	}
	if menu.ExternalUrl != nil {
		m["external_url"] = *menu.ExternalUrl
	}
	if menu.OpenMode != nil {
		m["open_mode"] = *menu.OpenMode
	}
	if menu.PermissionKey != nil {
		m["permission_key"] = *menu.PermissionKey
	}
	return m
}

// convertMenuToType 将 Model 层的 Menu 转换为 types.Menu
func (l *UpdateMenuLogic) convertMenuToType(menu *menus.Menu) types.Menu {
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
		RiskFlags:     []string{}, // 更新时暂时不计算风险标记
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
