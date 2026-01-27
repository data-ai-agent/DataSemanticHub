package permission_template

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestUpdatePermissionTemplate_NormalUpdate(t *testing.T) {
	// 准备测试数据
	templateId := "template-id"
	desc := "原始描述"
	scope := permissiontemplatemodel.ScopeOrganization
	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "原始模板",
		Code:            "original_code",
		Description:     &desc,
		Status:          permissiontemplatemodel.StatusDraft,
		ScopeSuggestion: &scope,
		Version:         1,
		CreatedBy:       "creator-id",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	req := &types.UpdatePermissionTemplateReq{
		Id:              templateId,
		Name:            "更新后的模板",
		Code:            "original_code", // 编码不变
		Description:     "更新后的描述",
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"create", "read", "update"}, Scope: "global"},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(existingTemplate, nil)
	mockModel.On("Update", mock.Anything, mock.MatchedBy(func(template *permissiontemplatemodel.PermissionTemplate) bool {
		return template.Name == "更新后的模板" && template.Status == permissiontemplatemodel.StatusDraft
	})).Return(nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewUpdatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.UpdatePermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)

	mockModel.AssertExpectations(t)
}

func TestUpdatePermissionTemplate_NonDraftTemplate(t *testing.T) {
	// 准备测试数据 - 已发布的模板
	templateId := "published-template-id"
	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "已发布模板",
		Code:    "published_code",
		Status:  permissiontemplatemodel.StatusPublished, // 已发布状态
		Version: 1,
	}

	req := &types.UpdatePermissionTemplateReq{
		Id:          templateId,
		Name:        "尝试修改",
		Code:        "published_code",
		Description: "描述",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(existingTemplate, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewUpdatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.UpdatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotDraft, err)

	mockModel.AssertExpectations(t)
}

func TestUpdatePermissionTemplate_CodeConflict(t *testing.T) {
	// 准备测试数据 - 编码冲突
	templateId := "template-id"
	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "模板",
		Code:    "old_code",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}

	anotherTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      "another-id",
		Name:    "另一个模板",
		Code:    "another_code",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}

	req := &types.UpdatePermissionTemplateReq{
		Id:          templateId,
		Name:        "模板",
		Code:        "another_code", // 尝试修改为已存在的编码
		Description: "描述",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(existingTemplate, nil)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "another_code").Return(anotherTemplate, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewUpdatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.UpdatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateCodeExists, err)

	mockModel.AssertExpectations(t)
}

func TestUpdatePermissionTemplate_TemplateNotFound(t *testing.T) {
	// 准备测试数据
	req := &types.UpdatePermissionTemplateReq{
		Id:          "non-existent-id",
		Name:        "不存在",
		Code:        "code",
		Description: "描述",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, "non-existent-id").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewUpdatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.UpdatePermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotFound, err)

	mockModel.AssertExpectations(t)
}

func TestUpdatePermissionTemplate_WithSameCode(t *testing.T) {
	// 准备测试数据 - 编码不变
	templateId := "template-id"
	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "模板",
		Code:    "same_code",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}

	req := &types.UpdatePermissionTemplateReq{
		Id:          templateId,
		Name:        "更新名称",
		Code:        "same_code", // 编码不变
		Description: "更新描述",
		PolicyMatrix: map[string]types.PolicyMatrixEntry{
			"user": {Actions: []string{"read"}, Scope: "global"},
		},
	}

	// 创建 mock - 编码相同时不需要调用 FindOneByCodeIncludingDeleted
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(existingTemplate, nil)
	mockModel.On("Update", mock.Anything, mock.Anything).Return(nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewUpdatePermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	resp, err := logic.UpdatePermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)

	mockModel.AssertExpectations(t)
}
