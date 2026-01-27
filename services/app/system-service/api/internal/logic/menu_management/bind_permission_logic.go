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

type BindPermissionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewBindPermissionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BindPermissionLogic {
	return &BindPermissionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *BindPermissionLogic) BindPermission(req *types.BindPermissionReq) (resp *types.BindPermissionResp, err error) {
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
	oldPermissionKey := existingMenu.PermissionKey
	var oldPermissionKeyStr string
	if oldPermissionKey != nil {
		oldPermissionKeyStr = *oldPermissionKey
	}

	// 3. 确定新的权限标识
	var newPermissionKey string
	if req.CreatePermission {
		// 创建新权限并绑定（需与权限服务联动）
		if req.PermissionName == "" {
			return nil, fmt.Errorf("创建新权限时，权限名称不能为空")
		}
		// TODO: 调用权限服务创建权限
		// 这里暂时使用菜单 code 生成权限标识
		newPermissionKey = fmt.Sprintf("menu:%s", existingMenu.Code)
		logx.Infof("创建新权限: %s (名称: %s)", newPermissionKey, req.PermissionName)
	} else if req.PermissionKey != "" {
		// 绑定已有权限
		newPermissionKey = req.PermissionKey
	} else {
		return nil, fmt.Errorf("必须提供已有权限标识或创建新权限")
	}

	// 4. 更新菜单的 permission_key 字段
	existingMenu.PermissionKey = &newPermissionKey
	err = l.svcCtx.MenuModel.Update(l.ctx, existingMenu)
	if err != nil {
		logx.Errorf("更新菜单权限标识失败: %v", err)
		return nil, fmt.Errorf("更新菜单权限标识失败: %w", err)
	}

	// 5. 重新查询菜单以获取最新数据
	updatedMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询更新后的菜单失败: %v", err)
		return nil, fmt.Errorf("查询更新后的菜单失败: %w", err)
	}

	// 6. 记录权限绑定审计日志
	if err := l.recordBindPermissionAuditLog(updatedMenu, oldPermissionKeyStr, newPermissionKey); err != nil {
		logx.Errorf("记录权限绑定审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 7. 转换为响应类型
	menuType := l.convertMenuToType(updatedMenu)

	resp = &types.BindPermissionResp{
		Menu: menuType,
	}
	return
}

// recordBindPermissionAuditLog 记录权限绑定审计日志
func (l *BindPermissionLogic) recordBindPermissionAuditLog(menu *menus.Menu, oldPermissionKey, newPermissionKey string) error {
	auditLogId, _ := uuid.NewV7()

	// 构建变更字段
	changedFields := []string{"permission_key"}
	oldValueMap := map[string]interface{}{
		"permission_key": oldPermissionKey,
	}
	newValueMap := map[string]interface{}{
		"permission_key": newPermissionKey,
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
		OperationType: "bind_permission",
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
func (l *BindPermissionLogic) convertMenuToType(menu *menus.Menu) types.Menu {
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
		RiskFlags:     []string{}, // 绑定权限后暂时不计算风险标记
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
