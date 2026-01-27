package permission_template

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestPublishPermissionTemplate_NormalPublish(t *testing.T) {
	templateId := "template-id"
	policyMatrixJSON, _ := json.Marshal(map[string]interface{}{
		"user": map[string]interface{}{"actions": []string{"create", "read"}, "scope": "organization"},
	})

	template := &permissiontemplatemodel.PermissionTemplate{
		Id:           templateId,
		Name:         "草稿模板",
		Code:         "draft_template",
		Status:       permissiontemplatemodel.StatusDraft,
		PolicyMatrix: policyMatrixJSON,
		Version:      1,
	}

	req := &types.PublishPermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("UpdateVersionWithStatus", mock.Anything, templateId, 2, permissiontemplatemodel.StatusPublished).Return(nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewPublishPermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.PublishPermissionTemplate(req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)
	assert.Equal(t, 2, resp.Version)

	mockModel.AssertExpectations(t)
}

func TestPublishPermissionTemplate_NonDraftTemplate(t *testing.T) {
	templateId := "published-template-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "已发布模板",
		Code:    "published",
		Status:  permissiontemplatemodel.StatusPublished,
		Version: 1,
	}

	req := &types.PublishPermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewPublishPermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.PublishPermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateStatusTransitionInvalid, err)

	mockModel.AssertExpectations(t)
}

func TestPublishPermissionTemplate_EmptyPolicyMatrix(t *testing.T) {
	templateId := "template-id"
	emptyPolicyMatrix, _ := json.Marshal(map[string]interface{}{})
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:           templateId,
		Name:         "草稿模板",
		Code:         "draft",
		Status:       permissiontemplatemodel.StatusDraft,
		PolicyMatrix: emptyPolicyMatrix,
		Version:      1,
	}

	req := &types.PublishPermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewPublishPermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.PublishPermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateEmptyPolicyMatrix, err)

	mockModel.AssertExpectations(t)
}

func TestDisablePermissionTemplate_NormalDisable(t *testing.T) {
	templateId := "template-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "已发布模板",
		Code:    "published",
		Status:  permissiontemplatemodel.StatusPublished,
		Version: 1,
	}

	req := &types.DisablePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusDisabled).Return(nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewDisablePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.DisablePermissionTemplate(req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)

	mockModel.AssertExpectations(t)
}

func TestDisablePermissionTemplate_NonPublishedTemplate(t *testing.T) {
	templateId := "draft-template-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "草稿模板",
		Code:    "draft",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}

	req := &types.DisablePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewDisablePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.DisablePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotPublished, err)

	mockModel.AssertExpectations(t)
}

func TestEnablePermissionTemplate_NormalEnable(t *testing.T) {
	templateId := "template-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "已停用模板",
		Code:    "disabled",
		Status:  permissiontemplatemodel.StatusDisabled,
		Version: 2,
	}

	req := &types.EnablePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusPublished).Return(nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewEnablePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.EnablePermissionTemplate(req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)

	mockModel.AssertExpectations(t)
}

func TestEnablePermissionTemplate_NonDisabledTemplate(t *testing.T) {
	templateId := "published-template-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:      templateId,
		Name:    "已发布模板",
		Code:    "published",
		Status:  permissiontemplatemodel.StatusPublished,
		Version: 1,
	}

	req := &types.EnablePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewEnablePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.EnablePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotDisabled, err)

	mockModel.AssertExpectations(t)
}

func TestStateTransitions_CompleteLifecycle(t *testing.T) {
	// 测试完整状态流转：draft → published → disabled → published
	templateId := "template-id"
	policyMatrixJSON, _ := json.Marshal(map[string]interface{}{
		"user": map[string]interface{}{"actions": []string{"create", "read"}, "scope": "organization"},
	})

	template := &permissiontemplatemodel.PermissionTemplate{
		Id:           templateId,
		Name:         "模板",
		Code:         "template",
		Status:       permissiontemplatemodel.StatusDraft,
		PolicyMatrix: policyMatrixJSON,
		Version:      1,
	}

	mockModel := new(MockPermissionTemplateModel)

	// Step 1: Publish (draft → published)
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateVersionWithStatus", mock.Anything, templateId, 2, permissiontemplatemodel.StatusPublished).Once().Return(nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	publishLogic := NewPublishPermissionTemplateLogic(ctx, svcCtx)
	publishResp, err := publishLogic.PublishPermissionTemplate(&types.PublishPermissionTemplateReq{Id: templateId})
	require.NoError(t, err)
	assert.True(t, publishResp.Success)
	assert.Equal(t, 2, publishResp.Version)

	// Update template status
	template.Status = permissiontemplatemodel.StatusPublished
	template.Version = 2

	// Step 2: Disable (published → disabled)
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusDisabled).Once().Return(nil)

	disableLogic := NewDisablePermissionTemplateLogic(ctx, svcCtx)
	disableResp, err := disableLogic.DisablePermissionTemplate(&types.DisablePermissionTemplateReq{Id: templateId})
	require.NoError(t, err)
	assert.True(t, disableResp.Success)

	// Update template status
	template.Status = permissiontemplatemodel.StatusDisabled

	// Step 3: Enable (disabled → published)
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusPublished).Once().Return(nil)

	enableLogic := NewEnablePermissionTemplateLogic(ctx, svcCtx)
	enableResp, err := enableLogic.EnablePermissionTemplate(&types.EnablePermissionTemplateReq{Id: templateId})
	require.NoError(t, err)
	assert.True(t, enableResp.Success)

	mockModel.AssertExpectations(t)
}
