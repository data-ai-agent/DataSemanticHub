package permission_template

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
)

// MockPermissionTemplateModel 是 permissiontemplatemodel.Model 的 mock 实现
type MockPermissionTemplateModel struct {
	mock.Mock
}

func (m *MockPermissionTemplateModel) Insert(ctx context.Context, data *permissiontemplatemodel.PermissionTemplate) (*permissiontemplatemodel.PermissionTemplate, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*permissiontemplatemodel.PermissionTemplate), args.Error(1)
}

func (m *MockPermissionTemplateModel) FindOne(ctx context.Context, id string) (*permissiontemplatemodel.PermissionTemplate, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*permissiontemplatemodel.PermissionTemplate), args.Error(1)
}

func (m *MockPermissionTemplateModel) FindOneByCode(ctx context.Context, code string) (*permissiontemplatemodel.PermissionTemplate, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*permissiontemplatemodel.PermissionTemplate), args.Error(1)
}

func (m *MockPermissionTemplateModel) FindOneByCodeIncludingDeleted(ctx context.Context, code string) (*permissiontemplatemodel.PermissionTemplate, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*permissiontemplatemodel.PermissionTemplate), args.Error(1)
}

func (m *MockPermissionTemplateModel) List(ctx context.Context, filter *permissiontemplatemodel.ListFilter) ([]*permissiontemplatemodel.PermissionTemplate, int64, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*permissiontemplatemodel.PermissionTemplate), args.Get(1).(int64), args.Error(2)
}

func (m *MockPermissionTemplateModel) Count(ctx context.Context, filter *permissiontemplatemodel.ListFilter) (int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockPermissionTemplateModel) Update(ctx context.Context, data *permissiontemplatemodel.PermissionTemplate) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockPermissionTemplateModel) UpdateStatus(ctx context.Context, id string, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockPermissionTemplateModel) UpdateVersionWithStatus(ctx context.Context, id string, version int, status string) error {
	args := m.Called(ctx, id, version, status)
	return args.Error(0)
}

func (m *MockPermissionTemplateModel) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPermissionTemplateModel) GetUsageStats(ctx context.Context, id string) (*permissiontemplatemodel.UsageStats, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*permissiontemplatemodel.UsageStats), args.Error(1)
}

func (m *MockPermissionTemplateModel) WithTx(tx interface{}) permissiontemplatemodel.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return m
	}
	return args.Get(0).(permissiontemplatemodel.Model)
}

func (m *MockPermissionTemplateModel) Trans(ctx context.Context, fn func(ctx context.Context, model permissiontemplatemodel.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// 辅助函数：创建测试用的权限模板数据
func createTestPermissionTemplates() []*permissiontemplatemodel.PermissionTemplate {
	now := time.Now()
	policyMatrixJSON := `{"user": {"actions": ["create", "read"], "scope": "organization"}}`

	template1 := &permissiontemplatemodel.PermissionTemplate{
		Id:              uuid.New().String(),
		Name:            "系统管理员模板",
		Code:            "system_admin",
		Description:     "系统管理员权限模板",
		Status:          permissiontemplatemodel.StatusPublished,
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		PolicyMatrix:    datatypes.JSON([]byte(policyMatrixJSON)),
		Version:         1,
		CreatedBy:       "admin-user-id",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	template2 := &permissiontemplatemodel.PermissionTemplate{
		Id:              uuid.New().String(),
		Name:            "组织管理员模板",
		Code:            "org_admin",
		Description:     "组织管理员权限模板",
		Status:          permissiontemplatemodel.StatusDraft,
		ScopeSuggestion: permissiontemplatemodel.ScopeOrganization,
		PolicyMatrix:    datatypes.JSON([]byte(policyMatrixJSON)),
		Version:         1,
		CreatedBy:       "admin-user-id",
		CreatedAt:       now.Add(-1 * time.Hour),
		UpdatedAt:       now.Add(-1 * time.Hour),
	}

	template3 := &permissiontemplatemodel.PermissionTemplate{
		Id:              uuid.New().String(),
		Name:            "域管理员模板",
		Code:            "domain_admin",
		Description:     "域管理员权限模板",
		Status:          permissiontemplatemodel.StatusDisabled,
		ScopeSuggestion: permissiontemplatemodel.ScopeDomain,
		PolicyMatrix:    datatypes.JSON([]byte(policyMatrixJSON)),
		Version:         2,
		CreatedBy:       "admin-user-id",
		CreatedAt:       now.Add(-2 * time.Hour),
		UpdatedAt:       now.Add(-2 * time.Hour),
	}

	return []*permissiontemplatemodel.PermissionTemplate{template1, template2, template3}
}

func TestListPermissionTemplates_NormalQuery(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.Keyword == "" && filter.Status == "" && filter.ScopeSuggestion == "" && filter.Page == 1 && filter.PageSize == 10
	})).Return(testTemplates, int64(3), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(3), resp.Total)
	assert.Len(t, resp.Data, 3)

	// 验证第一个模板
	firstTemplate := resp.Data[0]
	assert.Equal(t, "系统管理员模板", firstTemplate.Name)
	assert.Equal(t, "system_admin", firstTemplate.Code)
	assert.Equal(t, permissiontemplatemodel.StatusPublished, firstTemplate.Status)
	assert.Equal(t, permissiontemplatemodel.ScopeGlobal, firstTemplate.ScopeSuggestion)
	assert.Equal(t, 1, firstTemplate.Version)

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_SearchByKeyword(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock - 搜索应该返回匹配的模板
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.Keyword == "admin" && filter.Page == 1 && filter.PageSize == 10
	})).Return([]*permissiontemplatemodel.PermissionTemplate{testTemplates[0], testTemplates[1]}, int64(2), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Keyword:  "admin",
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(2), resp.Total)
	assert.Len(t, resp.Data, 2)

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_FilterByStatus(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock - 筛选草稿状态
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.Status == permissiontemplatemodel.StatusDraft && filter.Page == 1 && filter.PageSize == 10
	})).Return([]*permissiontemplatemodel.PermissionTemplate{testTemplates[1]}, int64(1), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Status:   permissiontemplatemodel.StatusDraft,
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.Total)
	assert.Len(t, resp.Data, 1)

	// 验证返回的模板都是草稿状态
	for _, template := range resp.Data {
		assert.Equal(t, permissiontemplatemodel.StatusDraft, template.Status)
	}

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_FilterByScopeSuggestion(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock - 筛选组织范围
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.ScopeSuggestion == permissiontemplatemodel.ScopeOrganization && filter.Page == 1 && filter.PageSize == 10
	})).Return([]*permissiontemplatemodel.PermissionTemplate{testTemplates[1]}, int64(1), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		ScopeSuggestion: permissiontemplatemodel.ScopeOrganization,
		Page:            1,
		PageSize:        10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.Total)
	assert.Len(t, resp.Data, 1)

	// 验证返回的模板都是组织范围
	for _, template := range resp.Data {
		assert.Equal(t, permissiontemplatemodel.ScopeOrganization, template.ScopeSuggestion)
	}

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_Pagination(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock - 第二页，每页2条
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.Page == 2 && filter.PageSize == 2
	})).Return([]*permissiontemplatemodel.PermissionTemplate{testTemplates[2]}, int64(3), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Page:     2,
		PageSize: 2,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(3), resp.Total)
	assert.Len(t, resp.Data, 1)

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_EmptyResult(t *testing.T) {
	// 创建 mock - 返回空结果
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.Anything).Return([]*permissiontemplatemodel.PermissionTemplate{}, int64(0), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(0), resp.Total)
	assert.Len(t, resp.Data, 0)

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_ErrorHandling(t *testing.T) {
	// 创建 mock - 模拟数据库错误
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.Anything).Return(nil, int64(0), assert.AnError)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)

	mockModel.AssertExpectations(t)
}

func TestListPermissionTemplates_MultipleFilters(t *testing.T) {
	// 准备测试数据
	testTemplates := createTestPermissionTemplates()

	// 创建 mock - 多个条件组合筛选
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("List", mock.Anything, mock.MatchedBy(func(filter *permissiontemplatemodel.ListFilter) bool {
		return filter.Keyword == "admin" &&
			filter.Status == permissiontemplatemodel.StatusPublished &&
			filter.ScopeSuggestion == permissiontemplatemodel.ScopeGlobal &&
			filter.Page == 1 &&
			filter.PageSize == 10
	})).Return([]*permissiontemplatemodel.PermissionTemplate{testTemplates[0]}, int64(1), nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewListPermissionTemplatesLogic(ctx, svcCtx)

	// 执行测试
	req := &types.ListPermissionTemplatesReq{
		Keyword:         "admin",
		Status:          permissiontemplatemodel.StatusPublished,
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		Page:            1,
		PageSize:        10,
	}
	resp, err := logic.ListPermissionTemplates(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.Total)
	assert.Len(t, resp.Data, 1)

	// 验证返回的模板符合所有筛选条件
	template := resp.Data[0]
	// 关键字搜索匹配 name 或 code
	assert.True(t, strings.Contains(template.Name, "admin") || strings.Contains(template.Code, "admin"))
	assert.Equal(t, permissiontemplatemodel.StatusPublished, template.Status)
	assert.Equal(t, permissiontemplatemodel.ScopeGlobal, template.ScopeSuggestion)

	mockModel.AssertExpectations(t)
}
