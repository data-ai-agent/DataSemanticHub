package permission_template

import (
	"context"
	"encoding/json"
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

func TestGetPermissionTemplate_NormalQuery(t *testing.T) {
	// 准备测试数据
	now := time.Now()
	templateId := uuid.New().String()
	policyMatrixJSON, _ := json.Marshal(map[string]types.PolicyMatrixEntry{
		"user": {
			Actions: []string{"create", "read", "update", "delete"},
			Scope:   "organization",
		},
	})
	advancedPermsJSON, _ := json.Marshal(map[string]types.AdvancedPermEntry{
		"data_export": {
			Enabled: true,
			Config: map[string]interface{}{
				"max_rows": 10000,
			},
		},
	})

	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "系统管理员模板",
		Code:            "system_admin",
		Description:     "系统管理员权限模板",
		Status:          permissiontemplatemodel.StatusPublished,
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		PolicyMatrix:    datatypes.JSON(policyMatrixJSON),
		AdvancedPerms:   datatypes.JSON(advancedPermsJSON),
		Version:         2,
		CreatedBy:       "admin-user-id",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 5,
		LastAppliedAt:   &now,
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, templateId, resp.Data.Id)
	assert.Equal(t, "系统管理员模板", resp.Data.Name)
	assert.Equal(t, "system_admin", resp.Data.Code)
	assert.Equal(t, "系统管理员权限模板", resp.Data.Description)
	assert.Equal(t, permissiontemplatemodel.StatusPublished, resp.Data.Status)
	assert.Equal(t, permissiontemplatemodel.ScopeGlobal, resp.Data.ScopeSuggestion)
	assert.Equal(t, 2, resp.Data.Version)
	assert.Equal(t, int64(5), resp.Data.UsedByRoleCount)
	assert.Equal(t, "admin-user-id", resp.Data.CreatedBy)

	// 验证策略矩阵
	assert.NotNil(t, resp.Data.PolicyMatrix)
	assert.Contains(t, resp.Data.PolicyMatrix, "user")
	userPolicy := resp.Data.PolicyMatrix["user"]
	assert.Equal(t, []string{"create", "read", "update", "delete"}, userPolicy.Actions)
	assert.Equal(t, "organization", userPolicy.Scope)

	// 验证高级权限点
	assert.NotNil(t, resp.Data.AdvancedPerms)
	assert.Contains(t, resp.Data.AdvancedPerms, "data_export")
	dataExport := resp.Data.AdvancedPerms["data_export"]
	assert.True(t, dataExport.Enabled)
	assert.Equal(t, 10000., dataExport.Config["max_rows"])

	mockModel.AssertExpectations(t)
}

func TestGetPermissionTemplate_TemplateNotFound(t *testing.T) {
	// 创建 mock - 模板不存在
	templateId := uuid.New().String()
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotFound, err)

	mockModel.AssertExpectations(t)
}

func TestGetPermissionTemplate_EmptyId(t *testing.T) {
	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: new(MockPermissionTemplateModel),
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: "",
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, permissiontemplatemodel.ErrPermissionTemplateNotFound, err)
}

func TestGetPermissionTemplate_UsageStatsError(t *testing.T) {
	// 准备测试数据
	now := time.Now()
	templateId := uuid.New().String()
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "测试模板",
		Code:            "test",
		Description:     "测试模板描述",
		Status:          permissiontemplatemodel.StatusDraft,
		ScopeSuggestion: permissiontemplatemodel.ScopeOrganization,
		PolicyMatrix:    datatypes.JSON([]byte(`{}`)),
		Version:         1,
		CreatedBy:       "admin-user-id",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// 创建 mock - 使用统计查询失败
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(nil, assert.AnError)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果 - 使用统计失败不应该影响主流程
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, templateId, resp.Data.Id)
	assert.Equal(t, int64(0), resp.Data.UsedByRoleCount) // 默认值
	assert.Equal(t, "", resp.Data.LastAppliedAt)         // 默认值

	mockModel.AssertExpectations(t)
}

func TestGetPermissionTemplate_DraftTemplate(t *testing.T) {
	// 准备测试数据 - 草稿状态模板
	now := time.Now()
	templateId := uuid.New().String()
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "草稿模板",
		Code:            "draft_template",
		Description:     "这是一个草稿模板",
		Status:          permissiontemplatemodel.StatusDraft,
		ScopeSuggestion: permissiontemplatemodel.ScopeProject,
		PolicyMatrix:    datatypes.JSON([]byte(`{}`)),
		Version:         1,
		CreatedBy:       "creator-id",
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 0,
		LastAppliedAt:   nil,
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, templateId, resp.Data.Id)
	assert.Equal(t, "草稿模板", resp.Data.Name)
	assert.Equal(t, permissiontemplatemodel.StatusDraft, resp.Data.Status)
	assert.Equal(t, permissiontemplatemodel.ScopeProject, resp.Data.ScopeSuggestion)
	assert.Equal(t, int64(0), resp.Data.UsedByRoleCount)

	mockModel.AssertExpectations(t)
}

func TestGetPermissionTemplate_DisabledTemplate(t *testing.T) {
	// 准备测试数据 - 已停用模板
	now := time.Now()
	templateId := uuid.New().String()
	updatedBy := "updater-id"
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "已停用模板",
		Code:            "disabled_template",
		Description:     "这是一个已停用的模板",
		Status:          permissiontemplatemodel.StatusDisabled,
		ScopeSuggestion: permissiontemplatemodel.ScopeDomain,
		PolicyMatrix:    datatypes.JSON([]byte(`{}`)),
		Version:         3,
		CreatedBy:       "creator-id",
		CreatedAt:       now.Add(-24 * time.Hour),
		UpdatedBy:       &updatedBy,
		UpdatedAt:       now,
	}

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 2,
		LastAppliedAt:   nil,
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, templateId, resp.Data.Id)
	assert.Equal(t, "已停用模板", resp.Data.Name)
	assert.Equal(t, permissiontemplatemodel.StatusDisabled, resp.Data.Status)
	assert.Equal(t, "updater-id", resp.Data.UpdatedBy)
	assert.Equal(t, 3, resp.Data.Version)

	mockModel.AssertExpectations(t)
}

func TestGetPermissionTemplate_WithNilUpdatedBy(t *testing.T) {
	// 准备测试数据 - UpdatedBy 为 nil
	now := time.Now()
	templateId := uuid.New().String()
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              templateId,
		Name:            "模板",
		Code:            "template",
		Description:     "模板描述",
		Status:          permissiontemplatemodel.StatusPublished,
		ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
		PolicyMatrix:    datatypes.JSON([]byte(`{}`)),
		Version:         1,
		CreatedBy:       "creator-id",
		CreatedAt:       now,
		UpdatedBy:       nil, // 没有更新人
		UpdatedAt:       now,
	}

	usageStats := &permissiontemplatemodel.UsageStats{
		UsedByRoleCount: 1,
		LastAppliedAt:   nil,
	}

	// 创建 mock
	mockModel := new(MockPermissionTemplateModel)
	mockModel.On("FindOne", mock.Anything, templateId).Return(template, nil)
	mockModel.On("GetUsageStats", mock.Anything, templateId).Return(usageStats, nil)

	// 创建 ServiceContext
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	// 创建 Logic
	ctx := context.Background()
	logic := NewGetPermissionTemplateLogic(ctx, svcCtx)

	// 执行测试
	req := &types.GetPermissionTemplateReq{
		Id: templateId,
	}
	resp, err := logic.GetPermissionTemplate(req)

	// 验证结果
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, templateId, resp.Data.Id)
	assert.Equal(t, "", resp.Data.UpdatedBy) // 应该是空字符串

	mockModel.AssertExpectations(t)
}
