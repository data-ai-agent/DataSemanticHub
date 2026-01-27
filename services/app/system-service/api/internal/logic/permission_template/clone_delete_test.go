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

func TestClonePermissionTemplate_NormalClone(t *testing.T) {
	sourceId := "source-template-id"
	desc := "源模板描述"
	scope := permissiontemplatemodel.ScopeGlobal
	sourceTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:              sourceId,
		Name:            "源模板",
		Code:            "source",
		Description:     &desc,
		Status:          permissiontemplatemodel.StatusPublished,
		ScopeSuggestion: &scope,
		Version:         2,
	}

	req := &types.ClonePermissionTemplateReq{
		Id:   sourceId,
		Name: "克隆模板",
		Code: "cloned_template",
	}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, sourceId).Return(sourceTemplate, nil)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "cloned_template").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(template *permissiontemplatemodel.PermissionTemplate) bool {
		return template.Name == "克隆模板" &&
			template.Code == "cloned_template" &&
			template.Status == permissiontemplatemodel.StatusDraft &&
			template.Version == 1
	})).Return(&permissiontemplatemodel.PermissionTemplate{Id: "new-uuid-v7"}, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewClonePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.ClonePermissionTemplate(req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, "new-uuid-v7", resp.Id)

	mockModel.AssertExpectations(t)
}

func TestClonePermissionTemplate_CodeConflict(t *testing.T) {
	sourceId := "source-template-id"
	sourceTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      sourceId,
		Name:    "源模板",
		Code:    "source",
		Status:  permissiontemplatemodel.StatusPublished,
		Version: 1,
	}

	existingTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      "existing-id",
		Name:    "已存在模板",
		Code:    "existing_code",
		Status:  permissiontemplatemodel.StatusDraft,
		Version: 1,
	}

	req := &types.ClonePermissionTemplateReq{
		Id:   sourceId,
		Name: "克隆模板",
		Code: "existing_code", // 编码冲突
	}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, sourceId).Return(sourceTemplate, nil)
	mockModel.On("FindOneByCodeIncludingDeleted", mock.Anything, "existing_code").Return(existingTemplate, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewClonePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.ClonePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateCodeExists, err)

	mockModel.AssertExpectations(t)
}

func TestClonePermissionTemplate_SourceNotFound(t *testing.T) {
	req := &types.ClonePermissionTemplateReq{
		Id:   "non-existent-id",
		Name: "克隆模板",
		Code: "cloned",
	}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, "non-existent-id").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewClonePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.ClonePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotFound, err)

	mockModel.AssertExpectations(t)
}

func TestDeletePermissionTemplate_NormalDelete(t *testing.T) {
	templateId := "template-id"

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 0,
		LastAppliedAt:   nil,
	}

	req := &types.DeletePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)
	mockModel.On("Delete", mock.Anything, templateId).Return(nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewDeletePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.DeletePermissionTemplate(req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.True(t, resp.Success)

	mockModel.AssertExpectations(t)
}

func TestDeletePermissionTemplate_TemplateInUse(t *testing.T) {
	templateId := "template-id"

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 3, // 被3个角色引用
		LastAppliedAt:   nil,
	}

	req := &types.DeletePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewDeletePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.DeletePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateInUse, err)

	mockModel.AssertExpectations(t)
}

func TestDeletePermissionTemplate_TemplateNotFound(t *testing.T) {
	templateId := "non-existent-id"

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 0,
		LastAppliedAt:   nil,
	}

	req := &types.DeletePermissionTemplateReq{Id: templateId}

	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)
	mockModel.On("Delete", mock.Anything, templateId).Return(permissiontemplatemodel.ErrPermissionTemplateNotFound)

	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()
	logic := NewDeletePermissionTemplateLogic(ctx, svcCtx)

	resp, err := logic.DeletePermissionTemplate(req)

	require.Error(t, err)
	assert.Nil(t, resp)

	mockModel.AssertExpectations(t)
}
