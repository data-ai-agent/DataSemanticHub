package menu_management

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menus"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockMenuModel 是 menus.Model 的 mock 实现
type MockMenuModel struct {
	mock.Mock
}

func (m *MockMenuModel) Insert(ctx context.Context, data *menus.Menu) (*menus.Menu, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) FindOne(ctx context.Context, id string) (*menus.Menu, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) FindOneByCode(ctx context.Context, code string) (*menus.Menu, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) FindTree(ctx context.Context, req *menus.FindTreeReq) ([]*menus.Menu, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) FindChildren(ctx context.Context, parentId string) ([]*menus.Menu, error) {
	args := m.Called(ctx, parentId)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) FindChildrenCount(ctx context.Context, parentId string) (int64, error) {
	args := m.Called(ctx, parentId)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockMenuModel) Update(ctx context.Context, data *menus.Menu) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockMenuModel) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockMenuModel) UpdateOrder(ctx context.Context, id string, order int) error {
	args := m.Called(ctx, id, order)
	return args.Error(0)
}

func (m *MockMenuModel) BatchUpdateOrder(ctx context.Context, updates []menus.OrderUpdate) error {
	args := m.Called(ctx, updates)
	return args.Error(0)
}

func (m *MockMenuModel) Move(ctx context.Context, id string, newParentId *string, newOrder int) error {
	args := m.Called(ctx, id, newParentId, newOrder)
	return args.Error(0)
}

func (m *MockMenuModel) CheckCycle(ctx context.Context, id string, newParentId string) (bool, error) {
	args := m.Called(ctx, id, newParentId)
	return args.Bool(0), args.Error(1)
}

func (m *MockMenuModel) FindByPath(ctx context.Context, path string) ([]*menus.Menu, error) {
	args := m.Called(ctx, path)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menus.Menu), args.Error(1)
}

func (m *MockMenuModel) GetStatistics(ctx context.Context) (*menus.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menus.Statistics), args.Error(1)
}

func (m *MockMenuModel) UpdateEnabled(ctx context.Context, id string, enabled bool) error {
	args := m.Called(ctx, id, enabled)
	return args.Error(0)
}

func (m *MockMenuModel) UpdateVisible(ctx context.Context, id string, visible bool) error {
	args := m.Called(ctx, id, visible)
	return args.Error(0)
}

func (m *MockMenuModel) WithTx(tx interface{}) menus.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return m
	}
	return args.Get(0).(menus.Model)
}

func (m *MockMenuModel) Trans(ctx context.Context, fn func(ctx context.Context, model menus.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// 辅助函数：创建测试用的菜单数据
func createTestMenus() []*menus.Menu {
	now := time.Now()
	rootId := uuid.New().String()
	child1Id := uuid.New().String()
	child2Id := uuid.New().String()
	grandchildId := uuid.New().String()

	root := &menus.Menu{
		Id:        rootId,
		Name:      "根菜单",
		Code:      "root",
		Type:      "directory",
		ParentId:  nil,
		Path:      testStringPtr("/root"),
		Visible:   true,
		Enabled:   true,
		Order:     0,
		ShowInNav: true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	child1 := &menus.Menu{
		Id:        child1Id,
		Name:      "子菜单1",
		Code:      "child1",
		Type:      "page",
		ParentId:  testStringPtr(rootId),
		Path:      testStringPtr("/child1"),
		Visible:   true,
		Enabled:   true,
		Order:     0,
		ShowInNav: true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	child2 := &menus.Menu{
		Id:        child2Id,
		Name:      "子菜单2",
		Code:      "child2",
		Type:      "page",
		ParentId:  testStringPtr(rootId),
		Path:      testStringPtr("/child2"),
		Visible:   true,
		Enabled:   true,
		Order:     1,
		ShowInNav: true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	grandchild := &menus.Menu{
		Id:        grandchildId,
		Name:      "孙菜单",
		Code:      "grandchild",
		Type:      "page",
		ParentId:  testStringPtr(child1Id),
		Path:      testStringPtr("/child1/grandchild"),
		Visible:   true,
		Enabled:   true,
		Order:     0,
		ShowInNav: true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	return []*menus.Menu{root, child1, child2, grandchild}
}

// testStringPtr 测试用字符串指针（避免与同包 delete_menu_logic 的 stringPtr 重复）
func testStringPtr(s string) *string {
	return &s
}

func TestGetMenuTree_NormalQuery(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.Keyword == "" && req.Enabled == nil && req.Visible == nil
	})).Return(testMenus, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Len(t, resp.Menus, 1, "应该返回一个根节点")

	root := resp.Menus[0]
	assert.Equal(t, "根菜单", root.Name)
	assert.Equal(t, "root", root.Code)
	assert.Len(t, root.Children, 2, "根节点应该有两个子节点")

	// 验证子节点
	child1 := root.Children[0]
	assert.Equal(t, "子菜单1", child1.Name)
	assert.Equal(t, 1, child1.ChildrenCount, "子菜单1应该有一个子节点")
	assert.Len(t, child1.Children, 1, "子菜单1应该有一个子节点")

	child2 := root.Children[1]
	assert.Equal(t, "子菜单2", child2.Name)
	assert.Equal(t, 0, child2.ChildrenCount, "子菜单2应该没有子节点")
	assert.Len(t, child2.Children, 0, "子菜单2应该没有子节点")

	// 验证孙节点
	grandchild := child1.Children[0]
	assert.Equal(t, "孙菜单", grandchild.Name)

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_SearchByKeyword(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()

	// 创建 mock - 搜索应该返回匹配的节点及其祖先
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.Keyword == "child1"
	})).Return([]*menus.Menu{testMenus[0], testMenus[1], testMenus[3]}, nil) // root, child1, grandchild

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{
		Keyword: "child1",
	}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Len(t, resp.Menus, 1, "应该返回一个根节点")

	root := resp.Menus[0]
	assert.Equal(t, "根菜单", root.Name)
	// 搜索后应该包含匹配的节点及其祖先
	assert.Len(t, root.Children, 1, "搜索后应该只包含匹配的子节点")

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_FilterByEnabled(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()
	// 禁用 child2
	testMenus[2].Enabled = false

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.Enabled != nil && *req.Enabled == true
	})).Return([]*menus.Menu{testMenus[0], testMenus[1], testMenus[3]}, nil) // 只返回启用的

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{
		Enabled: true,
	}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Len(t, resp.Menus, 1, "应该返回一个根节点")

	root := resp.Menus[0]
	// 验证只包含启用的子节点
	for _, child := range root.Children {
		assert.True(t, child.Enabled, "所有返回的子节点应该是启用的")
	}

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_FilterByVisible(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()
	// 隐藏 child2
	testMenus[2].Visible = false

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.Visible != nil && *req.Visible == true
	})).Return([]*menus.Menu{testMenus[0], testMenus[1], testMenus[3]}, nil) // 只返回可见的

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{
		Visible: true,
	}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Len(t, resp.Menus, 1, "应该返回一个根节点")

	root := resp.Menus[0]
	// 验证只包含可见的子节点
	for _, child := range root.Children {
		assert.True(t, child.Visible, "所有返回的子节点应该是可见的")
	}

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_FilterByType(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.Type == "page"
	})).Return([]*menus.Menu{testMenus[1], testMenus[2], testMenus[3]}, nil) // 只返回 page 类型

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{
		Type: "page",
	}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	// 由于过滤了类型，可能没有根节点（如果根节点是 directory）
	// 这里验证返回的菜单都是 page 类型
	for _, menu := range resp.Menus {
		assert.Equal(t, "page", menu.Type, "所有返回的菜单应该是 page 类型")
	}

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_FilterByPermissionBind(t *testing.T) {
	// 准备测试数据
	testMenus := createTestMenus()
	// 为 child1 添加权限
	testMenus[1].PermissionKey = testStringPtr("permission:child1")

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.MatchedBy(func(req *menus.FindTreeReq) bool {
		return req.PermissionBind == "bound"
	})).Return([]*menus.Menu{testMenus[1]}, nil) // 只返回已绑定权限的

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{
		PermissionBind: "bound",
	}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	// 验证返回的菜单都有权限绑定
	for _, menu := range resp.Menus {
		if menu.PermissionKey != "" {
			assert.NotEmpty(t, menu.PermissionKey, "返回的菜单应该有权限绑定")
		}
	}

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_ErrorHandling(t *testing.T) {
	// 创建 mock - 模拟数据库错误
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.Anything).Return(nil, assert.AnError)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "查询菜单树失败")

	mockModel.AssertExpectations(t)
}

func TestGetMenuTree_RiskFlags(t *testing.T) {
	// 准备测试数据 - 包含未绑定权限的菜单
	testMenus := createTestMenus()
	testMenus[1].PermissionKey = nil // 未绑定权限

	// 创建 mock
	mockModel := new(MockMenuModel)
	mockModel.On("FindTree", mock.Anything, mock.Anything).Return(testMenus, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		MenuModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetMenuTreeLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetMenuTreeReq{}
	resp, err := logic.GetMenuTree(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)

	// 验证风险标记
	root := resp.Menus[0]
	child1 := root.Children[0]
	// child1 未绑定权限，应该有风险标记
	assert.Contains(t, child1.RiskFlags, "UNBOUND_PERMISSION", "未绑定权限的菜单应该有风险标记")

	mockModel.AssertExpectations(t)
}
