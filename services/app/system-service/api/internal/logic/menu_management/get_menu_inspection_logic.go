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

type GetMenuInspectionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMenuInspectionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMenuInspectionLogic {
	return &GetMenuInspectionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMenuInspectionLogic) GetMenuInspection() (resp *types.GetMenuInspectionResp, err error) {
	// 1. 查询所有菜单
	allMenus, err := l.svcCtx.MenuModel.FindTree(l.ctx, &menus.FindTreeReq{})
	if err != nil {
		logx.Errorf("查询菜单树失败: %v", err)
		return nil, fmt.Errorf("查询菜单树失败: %w", err)
	}

	// 2. 构建菜单映射
	menuMap := make(map[string]*menus.Menu)
	for _, menu := range allMenus {
		menuMap[menu.Id] = menu
	}

	// 3. 检测各种风险
	var risks []types.RiskItem

	// 3.1 未绑定权限检测（UNBOUND_PERMISSION）
	for _, menu := range allMenus {
		if menu.PermissionKey == nil || *menu.PermissionKey == "" {
			risks = append(risks, types.RiskItem{
				MenuId:      menu.Id,
				MenuName:    menu.Name,
				MenuCode:    menu.Code,
				RiskType:    "UNBOUND_PERMISSION",
				Description: fmt.Sprintf("菜单 %s (%s) 未绑定权限", menu.Name, menu.Code),
			})
		}
	}

	// 3.2 路由冲突检测（ROUTE_CONFLICT）- 检查 path 重复
	pathMap := make(map[string][]*menus.Menu)
	for _, menu := range allMenus {
		if menu.Path != nil && *menu.Path != "" {
			pathMap[*menu.Path] = append(pathMap[*menu.Path], menu)
		}
	}
	for path, menusWithPath := range pathMap {
		if len(menusWithPath) > 1 {
			for _, menu := range menusWithPath {
				risks = append(risks, types.RiskItem{
					MenuId:      menu.Id,
					MenuName:    menu.Name,
					MenuCode:    menu.Code,
					RiskType:    "ROUTE_CONFLICT",
					Description: fmt.Sprintf("菜单 %s (%s) 的路由路径 %s 与其他菜单冲突", menu.Name, menu.Code, path),
				})
			}
		}
	}

	// 3.3 路由冲突检测（ROUTE_CONFLICT）- 检查 route_name 重复
	routeNameMap := make(map[string][]*menus.Menu)
	for _, menu := range allMenus {
		if menu.RouteName != nil && *menu.RouteName != "" {
			routeNameMap[*menu.RouteName] = append(routeNameMap[*menu.RouteName], menu)
		}
	}
	for routeName, menusWithRouteName := range routeNameMap {
		if len(menusWithRouteName) > 1 {
			for _, menu := range menusWithRouteName {
				risks = append(risks, types.RiskItem{
					MenuId:      menu.Id,
					MenuName:    menu.Name,
					MenuCode:    menu.Code,
					RiskType:    "ROUTE_CONFLICT",
					Description: fmt.Sprintf("菜单 %s (%s) 的路由名称 %s 与其他菜单冲突", menu.Name, menu.Code, routeName),
				})
			}
		}
	}

	// 3.4 顺序冲突检测（ORDER_CONFLICT）- 检查同级 order 重复
	// 按父级分组
	parentOrderMap := make(map[string]map[int][]*menus.Menu) // parentId -> order -> menus
	for _, menu := range allMenus {
		parentKey := ""
		if menu.ParentId != nil {
			parentKey = *menu.ParentId
		}
		if parentOrderMap[parentKey] == nil {
			parentOrderMap[parentKey] = make(map[int][]*menus.Menu)
		}
		parentOrderMap[parentKey][menu.Order] = append(parentOrderMap[parentKey][menu.Order], menu)
	}

	// 检查每个父级下的 order 冲突
	for parentKey, orderMap := range parentOrderMap {
		for order, menusWithOrder := range orderMap {
			if len(menusWithOrder) > 1 {
				parentDesc := "根节点"
				if parentKey != "" {
					if parentMenu, exists := menuMap[parentKey]; exists {
						parentDesc = fmt.Sprintf("父菜单 %s", parentMenu.Name)
					}
				}
				for _, menu := range menusWithOrder {
					risks = append(risks, types.RiskItem{
						MenuId:      menu.Id,
						MenuName:    menu.Name,
						MenuCode:    menu.Code,
						RiskType:    "ORDER_CONFLICT",
						Description: fmt.Sprintf("菜单 %s (%s) 在 %s 下的排序值 %d 与其他菜单冲突", menu.Name, menu.Code, parentDesc, order),
					})
				}
			}
		}
	}

	resp = &types.GetMenuInspectionResp{
		Risks: risks,
	}

	return
}
