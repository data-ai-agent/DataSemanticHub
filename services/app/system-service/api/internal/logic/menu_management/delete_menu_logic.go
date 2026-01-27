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

type DeleteMenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteMenuLogic {
	return &DeleteMenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteMenuLogic) DeleteMenu(req *types.DeleteMenuReq) (resp *types.DeleteMenuResp, err error) {
	// 1. 查询现有菜单
	existingMenu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询菜单失败: %v", err)
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	if existingMenu == nil {
		return nil, menus.ErrMenuNotFound
	}

	// 2. 查询子节点数量
	childrenCount, err := l.svcCtx.MenuModel.FindChildrenCount(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询子菜单数量失败: %v", err)
		return nil, fmt.Errorf("查询子菜单数量失败: %w", err)
	}

	// 3. 子节点检查（如有子节点且未允许级联则拒绝）
	if childrenCount > 0 && !req.Cascade {
		return nil, menus.ErrMenuHasChildren
	}

	// 4. 级联删除（如 cascade=true）
	if req.Cascade && childrenCount > 0 {
		children, err := l.svcCtx.MenuModel.FindChildren(l.ctx, req.Id)
		if err != nil {
			logx.Errorf("查询子菜单失败: %v", err)
			return nil, fmt.Errorf("查询子菜单失败: %w", err)
		}
		// 递归删除子菜单
		for _, child := range children {
			err := l.svcCtx.MenuModel.Delete(l.ctx, child.Id)
			if err != nil {
				logx.Errorf("删除子菜单失败: %v", err)
				return nil, fmt.Errorf("删除子菜单失败: %w", err)
			}
			// 记录子菜单删除审计日志
			if err := l.recordDeleteAuditLog(child); err != nil {
				logx.Errorf("记录子菜单删除审计日志失败: %v", err)
			}
		}
	}

	// 5. 保存旧值用于审计日志
	oldValueMap := l.menuToMap(existingMenu)
	oldValueJSON, _ := json.Marshal(oldValueMap)

	// 6. 软删除菜单
	err = l.svcCtx.MenuModel.Delete(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("删除菜单失败: %v", err)
		return nil, fmt.Errorf("删除菜单失败: %w", err)
	}

	// 7. 记录删除审计日志
	if err := l.recordDeleteAuditLogWithOldValue(existingMenu, oldValueJSON); err != nil {
		logx.Errorf("记录删除审计日志失败: %v", err)
		// 审计日志失败不影响主流程，只记录错误
	}

	// 8. 构建影响面信息
	impactInfo := types.ImpactInfo{
		ChildrenCount: int(childrenCount),
	}

	resp = &types.DeleteMenuResp{
		ImpactInfo: impactInfo,
	}
	return
}

// recordDeleteAuditLog 记录删除审计日志（简单版本，用于级联删除）
func (l *DeleteMenuLogic) recordDeleteAuditLog(menu *menus.Menu) error {
	auditLogId, _ := uuid.NewV7()

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
		OperationType: "delete",
		OperatorId:    operatorIdPtr,
		OperatorName:  operatorNamePtr,
		Remark:        stringPtr("级联删除"),
	}

	_, err := l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
	return err
}

// recordDeleteAuditLogWithOldValue 记录删除审计日志（带旧值）
func (l *DeleteMenuLogic) recordDeleteAuditLogWithOldValue(menu *menus.Menu, oldValueJSON []byte) error {
	auditLogId, _ := uuid.NewV7()

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
		OperationType: "delete",
		OperatorId:    operatorIdPtr,
		OperatorName:  operatorNamePtr,
		OldValue:      datatypes.JSON(oldValueJSON),
	}

	_, err := l.svcCtx.MenuAuditLogModel.Insert(l.ctx, auditLog)
	return err
}

// menuToMap 将 Menu 转换为 map（用于审计日志）
func (l *DeleteMenuLogic) menuToMap(menu *menus.Menu) map[string]interface{} {
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

// stringPtr 返回字符串指针
func stringPtr(s string) *string {
	return &s
}
