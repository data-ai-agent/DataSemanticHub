// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menu_audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menus"
	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/datatypes"
)

type CreateMenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateMenuLogic {
	return &CreateMenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateMenuLogic) CreateMenu(req *types.CreateMenuReq) (resp *types.CreateMenuResp, err error) {
	// 1. 类型相关必填字段验证
	if err := l.validateTypeFields(req); err != nil {
		return nil, err
	}

	// 2. code 唯一性检查
	existingMenu, err := l.svcCtx.MenuModel.FindOneByCode(l.ctx, req.Code)
	if err != nil && err != menus.ErrMenuNotFound {
		logx.Errorf("检查菜单编码唯一性失败: %v", err)
		return nil, fmt.Errorf("检查菜单编码唯一性失败: %w", err)
	}
	if existingMenu != nil {
		return nil, menus.ErrMenuCodeExists
	}

	// 3. path/route_name 冲突检测（如提供）
	if req.Path != "" {
		conflictingMenus, err := l.svcCtx.MenuModel.FindByPath(l.ctx, req.Path)
		if err != nil {
			logx.Errorf("检查路径冲突失败: %v", err)
			return nil, fmt.Errorf("检查路径冲突失败: %w", err)
		}
		if len(conflictingMenus) > 0 {
			return nil, menus.ErrMenuRouteConflict
		}
	}

	// 4. parent_id 循环检查（如提供）
	if req.ParentId != "" {
		// 生成新菜单ID用于循环检查
		newMenuId, _ := uuid.NewV7()
		hasCycle, err := l.svcCtx.MenuModel.CheckCycle(l.ctx, newMenuId.String(), req.ParentId)
		if err != nil {
			logx.Errorf("检查循环引用失败: %v", err)
			return nil, fmt.Errorf("检查循环引用失败: %w", err)
		}
		if hasCycle {
			return nil, menus.ErrMenuCycleDetected
		}

		// 5. 分组约束检查（如提供 group_id 或 parent_id）
		if req.GroupId != "" {
			parentMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.ParentId)
			if err != nil {
				logx.Errorf("查询父菜单失败: %v", err)
				return nil, fmt.Errorf("查询父菜单失败: %w", err)
			}
			if parentMenu != nil && parentMenu.GroupId != nil && *parentMenu.GroupId != req.GroupId {
				return nil, menus.ErrMenuGroupConstraint
			}
		}
	}

	// 6. 默认 order 计算（插入同级末尾）
	order := req.Order
	if order == 0 {
		// 查询同级菜单的最大 order
		parentIdForQuery := ""
		if req.ParentId != "" {
			parentIdForQuery = req.ParentId
		}
		children, err := l.svcCtx.MenuModel.FindChildren(l.ctx, parentIdForQuery)
		if err != nil {
			logx.Errorf("查询子菜单失败: %v", err)
			return nil, fmt.Errorf("查询子菜单失败: %w", err)
		}
		maxOrder := 0
		for _, child := range children {
			if child.Order > maxOrder {
				maxOrder = child.Order
			}
		}
		order = maxOrder + 1
	}

	// 7. 生成菜单ID
	menuId, _ := uuid.NewV7()

	// 8. 构建菜单实体
	menu := &menus.Menu{
		Id:        menuId.String(),
		Name:      req.Name,
		Code:      req.Code,
		Type:      req.Type,
		Visible:   req.Visible,
		Enabled:   req.Enabled,
		Order:     order,
		ShowInNav: req.ShowInNav,
		Cacheable: req.Cacheable,
	}

	// 处理可选字段
	if req.GroupId != "" {
		menu.GroupId = &req.GroupId
	}
	if req.ParentId != "" {
		menu.ParentId = &req.ParentId
	}
	if req.Path != "" {
		menu.Path = &req.Path
	}
	if req.RouteName != "" {
		menu.RouteName = &req.RouteName
	}
	if req.ComponentKey != "" {
		menu.ComponentKey = &req.ComponentKey
	}
	if req.ExternalUrl != "" {
		menu.ExternalUrl = &req.ExternalUrl
	}
	if req.OpenMode != "" {
		menu.OpenMode = &req.OpenMode
	}
	if req.PermissionKey != "" {
		menu.PermissionKey = &req.PermissionKey
	}
	if req.Icon != "" {
		menu.Icon = &req.Icon
	}

	// 9. 权限创建联动（如 create_permission=true）
	// 注意：这里需要与权限服务联动，暂时跳过，后续可以扩展
	if req.CreatePermission && req.PermissionName != "" {
		// TODO: 调用权限服务创建权限
		// 这里暂时使用 permission_name 作为 permission_key
		permissionKey := fmt.Sprintf("menu:%s", req.Code)
		menu.PermissionKey = &permissionKey
	}

	// 10. 插入菜单
	createdMenu, err := l.svcCtx.MenuModel.Insert(l.ctx, menu)
	if err != nil {
		logx.Errorf("创建菜单失败: %v", err)
		return nil, fmt.Errorf("创建菜单失败: %w", err)
	}

	// 11. 记录创建审计日志
	if err := l.recordCreateAuditLog(createdMenu); err != nil {
		logx.Errorf("记录创建审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 12. 转换为响应类型
	menuType := l.convertMenuToType(createdMenu)

	resp = &types.CreateMenuResp{
		Menu: menuType,
	}
	return
}

// validateTypeFields 验证类型相关必填字段
func (l *CreateMenuLogic) validateTypeFields(req *types.CreateMenuReq) error {
	switch req.Type {
	case "directory":
		// directory 类型：name, code, type 必填
		if req.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.Code == "" {
			return fmt.Errorf("菜单编码必填")
		}
	case "page":
		// page 类型：name, code, type, path 必填
		if req.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.Code == "" {
			return fmt.Errorf("菜单编码必填")
		}
		if req.Path == "" {
			return menus.ErrMenuPathRequired
		}
	case "external":
		// external 类型：name, code, type, external_url, open_mode 必填
		if req.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.Code == "" {
			return fmt.Errorf("菜单编码必填")
		}
		if req.ExternalUrl == "" {
			return menus.ErrMenuExternalUrlRequired
		}
		if req.OpenMode == "" {
			return menus.ErrMenuOpenModeRequired
		}
		if req.OpenMode != "new" && req.OpenMode != "iframe" && req.OpenMode != "same" {
			return fmt.Errorf("打开方式必须是 new/iframe/same 之一")
		}
	case "button":
		// button 类型：name, code, type 必填
		if req.Name == "" {
			return menus.ErrMenuNameRequired
		}
		if req.Code == "" {
			return fmt.Errorf("菜单编码必填")
		}
	default:
		return menus.ErrMenuTypeInvalid
	}
	return nil
}

// recordCreateAuditLog 记录创建审计日志
func (l *CreateMenuLogic) recordCreateAuditLog(menu *menus.Menu) error {
	auditLogId, _ := uuid.NewV7()

	// 构建新值 JSON
	newValueMap := map[string]interface{}{
		"id":    menu.Id,
		"name":  menu.Name,
		"code":  menu.Code,
		"type":  menu.Type,
		"order": menu.Order,
	}
	if menu.GroupId != nil {
		newValueMap["group_id"] = *menu.GroupId
	}
	if menu.ParentId != nil {
		newValueMap["parent_id"] = *menu.ParentId
	}
	if menu.Path != nil {
		newValueMap["path"] = *menu.Path
	}
	if menu.RouteName != nil {
		newValueMap["route_name"] = *menu.RouteName
	}
	if menu.ExternalUrl != nil {
		newValueMap["external_url"] = *menu.ExternalUrl
	}
	if menu.OpenMode != nil {
		newValueMap["open_mode"] = *menu.OpenMode
	}
	if menu.PermissionKey != nil {
		newValueMap["permission_key"] = *menu.PermissionKey
	}
	if menu.Icon != nil {
		newValueMap["icon"] = *menu.Icon
	}

	newValueJSON, err := json.Marshal(newValueMap)
	if err != nil {
		return fmt.Errorf("序列化新值失败: %w", err)
	}

	auditLog := &menu_audit_logs.MenuAuditLog{
		Id:            auditLogId.String(),
		MenuId:        menu.Id,
		OperationType: "create",
		NewValue:      datatypes.JSON(newValueJSON),
		// OperatorId 和 OperatorName 可以从 context 中获取，这里暂时留空
	}

	_, err = l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
	return err
}

// convertMenuToType 将 Model 层的 Menu 转换为 types.Menu
func (l *CreateMenuLogic) convertMenuToType(menu *menus.Menu) types.Menu {
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
		RiskFlags:     []string{}, // 新建菜单暂时没有风险标记
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
