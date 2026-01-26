package menu_management

import (
	"context"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menus"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMenuTreeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMenuTreeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMenuTreeLogic {
	return &GetMenuTreeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMenuTreeLogic) GetMenuTree(req *types.GetMenuTreeReq) (resp *types.GetMenuTreeResp, err error) {
	// 构建查询请求
	findReq := &menus.FindTreeReq{
		Keyword:        req.Keyword,
		PermissionBind: req.PermissionBind,
		Type:           req.Type,
		GroupId:        req.GroupId,
	}

	// 处理 enabled 和 visible 的指针转换
	if req.Enabled {
		enabled := true
		findReq.Enabled = &enabled
	}
	if req.Visible {
		visible := true
		findReq.Visible = &visible
	}

	// 查询菜单列表
	menuList, err := l.svcCtx.MenuModel.FindTree(l.ctx, findReq)
	if err != nil {
		logx.Errorf("查询菜单树失败: %v", err)
		return nil, fmt.Errorf("查询菜单树失败: %w", err)
	}

	// 构建树形结构并计算子节点数量和风险标记
	treeMenus := l.buildMenuTree(menuList)

	return &types.GetMenuTreeResp{
		Menus: treeMenus,
	}, nil
}

// buildMenuTree 构建菜单树形结构
func (l *GetMenuTreeLogic) buildMenuTree(allMenus []*menus.Menu) []types.Menu {
	if len(allMenus) == 0 {
		return []types.Menu{}
	}

	// 创建菜单映射表（ID -> Menu）
	menuMap := make(map[string]*menus.Menu)
	for _, menu := range allMenus {
		menuMap[menu.Id] = menu
	}

	// 构建树形结构
	var rootMenus []types.Menu
	menuTypeMap := make(map[string]*types.Menu)

	// 第一遍：创建所有菜单的类型对象
	for _, menu := range allMenus {
		menuType := l.convertToTypeMenu(menu, menuMap)
		menuTypeMap[menu.Id] = &menuType
	}

	// 第二遍：构建父子关系（按深度从深到浅处理，确保子节点的 Children 已填充）
	// 计算每个节点的深度
	depthMap := make(map[string]int)
	var calculateDepth func(menuId string) int
	calculateDepth = func(menuId string) int {
		if depth, exists := depthMap[menuId]; exists {
			return depth
		}
		menu, exists := menuMap[menuId]
		if !exists {
			// 如果菜单不存在，返回 0
			depthMap[menuId] = 0
			return 0
		}
		if menu.ParentId == nil {
			depthMap[menuId] = 0
			return 0
		}
		depth := calculateDepth(*menu.ParentId) + 1
		depthMap[menuId] = depth
		return depth
	}

	// 计算所有节点的深度
	for _, menu := range allMenus {
		calculateDepth(menu.Id)
	}

	// 按深度从深到浅排序
	sortedMenus := make([]*menus.Menu, len(allMenus))
	copy(sortedMenus, allMenus)
	for i := 0; i < len(sortedMenus)-1; i++ {
		for j := i + 1; j < len(sortedMenus); j++ {
			if depthMap[sortedMenus[i].Id] < depthMap[sortedMenus[j].Id] {
				sortedMenus[i], sortedMenus[j] = sortedMenus[j], sortedMenus[i]
			}
		}
	}

	// 按深度从深到浅构建父子关系
	for _, menu := range sortedMenus {
		menuType := menuTypeMap[menu.Id]
		if menu.ParentId == nil {
			// 根节点，先跳过，最后再添加
			continue
		} else {
			// 子节点，添加到父节点的 Children 中
			if parent, exists := menuTypeMap[*menu.ParentId]; exists {
				parent.Children = append(parent.Children, *menuType)
			}
		}
	}

	// 第三遍：对每个节点的 Children 按 order 排序
	for _, menuType := range menuTypeMap {
		if len(menuType.Children) > 1 {
			// 按 order 排序
			for i := 0; i < len(menuType.Children)-1; i++ {
				for j := i + 1; j < len(menuType.Children); j++ {
					if menuType.Children[i].Order > menuType.Children[j].Order {
						menuType.Children[i], menuType.Children[j] = menuType.Children[j], menuType.Children[i]
					}
				}
			}
		}
	}

	// 第四遍：收集根节点（在构建完所有父子关系后）
	for _, menu := range allMenus {
		if menu.ParentId == nil {
			rootMenus = append(rootMenus, *menuTypeMap[menu.Id])
		}
	}

	// 对根节点按 order 排序
	if len(rootMenus) > 1 {
		for i := 0; i < len(rootMenus)-1; i++ {
			for j := i + 1; j < len(rootMenus); j++ {
				if rootMenus[i].Order > rootMenus[j].Order {
					rootMenus[i], rootMenus[j] = rootMenus[j], rootMenus[i]
				}
			}
		}
	}

	return rootMenus
}

// convertToTypeMenu 将 Model 层的 Menu 转换为 types.Menu
func (l *GetMenuTreeLogic) convertToTypeMenu(menu *menus.Menu, menuMap map[string]*menus.Menu) types.Menu {
	// 计算子节点数量
	childrenCount := int64(0)
	for _, m := range menuMap {
		if m.ParentId != nil && *m.ParentId == menu.Id {
			childrenCount++
		}
	}

	// 计算风险标记
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
		Children:      []types.Menu{}, // 初始化为空，由 buildMenuTree 填充
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

// calculateRiskFlags 计算风险标记
func (l *GetMenuTreeLogic) calculateRiskFlags(menu *menus.Menu, menuMap map[string]*menus.Menu) []string {
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
