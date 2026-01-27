package permission_template

import (
	"context"
	"testing"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// 辅助函数：创建返回插入数据的mock响应
func mockInsertReturn(data *permissiontemplatemodel.PermissionTemplate) (*permissiontemplatemodel.PermissionTemplate, error) {
	return data, nil
}

func TestCreatePermissionTemplate_NormalCreation(t *testing.T) {
	// 准备测试数据
	req := &types.CreatePermissionTemplateReq{
		Name:            "测试模板",
		Code:            "test_template",
		Description:     "这是一个测试模板",
		ScopeSuggestion: permissiontemplatemodel.ScopeOrganization,
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {
				Actions: []string{"create", "read"},
				Scope:   "organization",
			},
		},
		AdvancedPerms: map[string]types.AdvancedPermEntry{
			"data_export": {
				Enabled: true,
				Config:  map[string]interface{}{"max_rows": 1000},
			},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "test_template").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(template *permissiontemplatemodel.PermissionTemplate) bool {
		return template.Name == "测试模板" &&
			template.Code == "test_template" &&
			template.Status == permissiontemplatemodel.StatusDraft &&
			template.Version == 1
	})).Return(&permissiontemplatemodel.PermissionTemplate{
		Id:      "test-uuid-v7",
		Name:    "测试模板",
		Code:    "test_template",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "test-uuid-v7", resp.Id) // 应该返回 UUID

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_CodeConflict(t *testing.T) {
	// 准备测试数据 - 编码冲突
	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:     "existing-id",
		Name:   "已存在的模板",
		Code:   "existing_code",
		Status: permissiontemplatemodel.StatusPublished,
	}

	req := &types.CreatePermissionTemplateReq{
		Name:        "新模板",
		Code:        "existing_code", // 编码冲突
		Description: "描述",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "existing_code").Return(existingTemplate, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateCodeExists, err)

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_EmptyPolicyMatrix(t *testing.T) {
	// 注意：策略矩阵在 validator 层已经校验为 required
	// 这里测试的是策略矩阵为空 map 的情况（虽然通过 validator 校验不太可能）
	req := &types.CreatePermissionTemplateReq{
		Name:            "测试模板",
		Code:            "test_empty",
		Description:     "空策略矩阵",
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		PolicyMatrix:    map[string]types.PolicyMatrixEntry{}, // 空 map
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "test_empty").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
	mockModel.On("Insert", mock.Anything, mock.Anything).Return(&permissiontemplatemodel.PermissionTemplate{Id: "test-id"}, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果 - 空 map 也可以创建（validator 层负责校验 required）
	// 这里我们允许创建，因为逻辑层不重复校验 validator 已校验的内容
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.NotEmpty(t, resp.Id)

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_WithoutAdvancedPerms(t *testing.T) {
	// 准备测试数据 - 没有高级权限点
	req := &types.CreatePermissionTemplateReq{
		Name:            "简单模板",
		Code:            "simple_template",
		Description:     "没有高级权限点的模板",
		ScopeSuggestion: permissiontemplatemodel.ScopeProject,
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "project"},
		},
		AdvancedPerms: nil, // 没有高级权限点
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "simple_template").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(template *permissiontemplatemodel.PermissionTemplate) bool {
		return len(template.AdvancedPerms) == 0 // AdvancedPerms 应该为空
	})).Return(&permissiontemplatemodel.PermissionTemplate{Id: "simple-id"}, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.NotEmpty(t, resp.Id)

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_DatabaseError(t *testing.T) {
	// 准备测试数据
	req := &types.CreatePermissionTemplateReq{
		Name:        "测试模板",
		Code:        "test_error",
		Description: "测试数据库错误",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock - 编码查询成功，但插入失败
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "test_error").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
	mockModel.On("Insert", mock.Anything, mock.Anything).Return(nil, assert.AnError)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_CodeQueryError(t *testing.T) {
	// 准备测试数据
	req := &types.CreatePermissionTemplateReq{
		Name:        "测试模板",
		Code:        "test_query_error",
		Description: "测试查询错误",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock - 编码查询失败
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "test_query_error").Return(nil, assert.AnError)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.CreatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)

	mockModel.AssertExpectations(t)
}

func TestCreatePermissionTemplate_WithAllScopes(t *testing.T) {
	// 测试所有适用范围
	scopes := []string{
		permissiontemplatemodel.ScopeGlobal,
		permissiontemplatemodel.ScopeOrganization,
		permissiontemplatemodel.ScopeDomain,
		permissiontemplatemodel.ScopeProject,
	}

	for _, scope := range scopes {
		t.Run(scope, func(t *testing.T) {
			req := &types.CreatePermissionTemplateReq{
				Name:            scope + "模板",
				Code:            scope + "_template",
				ScopeSuggestion: scope,
				PolicyMatrix: map[string]types.PolicyMatrixEntry{
					"user": {Actions: []string{"read"}, Scope: scope},
				},
			}

			// 创建 mock
			mockModel := new(MockPermissionTemplateModel)
			mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, scope+"_template").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
			mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(template *permissiontemplatemodel.PermissionTemplate) bool {
				return template.ScopeSuggestion != nil && *template.ScopeSuggestion == scope
			})).Return(&permissiontemplatemodel.PermissionTemplate{Id: "scope-id"}, nil)

			// 创建 ServiceContext
			svcCtx := &svc.ServiceContext{
				Config:                  config.Config{},
				PermissionTemplateModel: mockModel,
			}

			// 创建 Logic
			ctx := context.Background()
			logic := NewCreatePermissionTemplateLogic(ctx, svcCtx)

			// 执行测试
			resp, err := logic.CreatePermissionTemplate(req)

			// 验证结果
			require.NoError(t, err)
			require.NotNil(t, resp)
			assert.NotEmpty(t, resp.Id)

			mockModel.AssertExpectations(t)
		})
	}
}
