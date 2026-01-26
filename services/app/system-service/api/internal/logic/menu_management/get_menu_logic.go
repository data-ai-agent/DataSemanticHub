// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"context"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menus"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMenuLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMenuLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMenuLogic {
	return &GetMenuLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMenuLogic) GetMenu(req *types.GetMenuReq) (resp *types.GetMenuResp, err error) {
	// 1. 参数校验
	if req.Id == "" {
		return nil, fmt.Errorf("菜单ID不能为空")
	}

	// 2. 查询菜单详情
	menu, err := l.svcCtx.MenuModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询菜单详情失败: %v", err)
		return nil, fmt.Errorf("查询菜单详情失败: %w", err)
	}

	if menu == nil {
		return nil, fmt.Errorf("菜单不存在")
	}

	// 3. 转换菜单类型
	menuType := l.convertMenuToType(menu)

	// 4. 查询最近一次操作摘要
	auditLog, err := l.svcCtx.MenuAuditLogModel.FindLatestByMenuId(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询审计日志失败: %v", err)
		// 审计日志查询失败不影响主流程，返回空的审计摘要
		auditLog = nil
	}

	// 5. 构建审计摘要
	var auditSummary types.AuditSummary
	if auditLog != nil {
		auditSummary = types.AuditSummary{
			LastOperatorId:   "",
			LastOperatorName: "",
			LastOperationAt:  auditLog.CreatedAt.Format("2006-01-02 15:04:05.000"),
		}
		if auditLog.OperatorId != nil {
			auditSummary.LastOperatorId = *auditLog.OperatorId
		}
		if auditLog.OperatorName != nil {
			auditSummary.LastOperatorName = *auditLog.OperatorName
		}
	}

	resp = &types.GetMenuResp{
		Menu: menuType,
	}
	if auditLog != nil {
		resp.AuditSummary = auditSummary
	}
	return
}

// convertMenuToType 将 Model 层的 Menu 转换为 types.Menu
func (l *GetMenuLogic) convertMenuToType(menu *menus.Menu) types.Menu {
	// 计算子节点数量
	childrenCount, _ := l.svcCtx.MenuModel.FindChildrenCount(l.ctx, menu.Id)

	// 计算风险标记（需要获取所有菜单来计算冲突）
	allMenus, _ := l.svcCtx.MenuModel.FindTree(l.ctx, &menus.FindTreeReq{})
	menuMap := make(map[string]*menus.Menu)
	for _, m := range allMenus {
		menuMap[m.Id] = m
	}
	riskFlags := l.calculateRiskFlags(menu, menuMap)

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
		RiskFlags:     riskFlags,
		CreatedAt:     menu.CreatedAt.Format("2006-01-02 15:04:05.000"),
		UpdatedAt:     menu.UpdatedAt.Format("2006-01-02 15:04:05.000"),
		Children:      []types.Menu{}, // 详情不需要子节点
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

// calculateRiskFlags 计算风险标记（复用 get_menu_tree_logic.go 中的逻辑）
func (l *GetMenuLogic) calculateRiskFlags(menu *menus.Menu, menuMap map[string]*menus.Menu) []string {
	var risks []string

	// UNBOUND_PERMISSION: 未绑定权限
	if menu.PermissionKey == nil || *menu.PermissionKey == "" {
		risks = append(risks, "UNBOUND_PERMISSION")
	}

	// ROUTE_CONFLICT: 路由冲突（检查 path 和 route_name）
	if menu.Path != nil && *menu.Path != "" {
		for _, m := range menuMap {
			if m.Id != menu.Id && m.Path != nil && *m.Path == *menu.Path {
				risks = append(risks, "ROUTE_CONFLICT")
				break
			}
		}
	}
	if menu.RouteName != nil && *menu.RouteName != "" {
		for _, m := range menuMap {
			if m.Id != menu.Id && m.RouteName != nil && *m.RouteName == *menu.RouteName {
				risks = append(risks, "ROUTE_CONFLICT")
				break
			}
		}
	}

	// ORDER_CONFLICT: 顺序冲突（检查同级 order）
	if menu.ParentId != nil {
		parentId := *menu.ParentId
		for _, m := range menuMap {
			if m.Id != menu.Id && m.ParentId != nil && *m.ParentId == parentId && m.Order == menu.Order {
				risks = append(risks, "ORDER_CONFLICT")
				break
			}
		}
	} else {
		// 根节点
		for _, m := range menuMap {
			if m.Id != menu.Id && m.ParentId == nil && m.Order == menu.Order {
				risks = append(risks, "ORDER_CONFLICT")
				break
			}
		}
	}

	return risks
}
