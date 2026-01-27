package permission_template

import (
	"context"
	"encoding/json"
	"sync"
	"testing"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// TestConcurrentCreateSameCode 测试并发创建相同编码的模板
// 场景：多个 goroutine 同时创建相同 code 的模板
// 预期：只有一个成功，其他返回编码冲突错误
func TestConcurrentCreateSameCode(t *testing.T) {
	code := "concurrent_template"

	// 模拟并发场景：第一次查询返回不存在，后续查询返回已存在
	callCount := 0
	var mu sync.Mutex

	ctx := context.Background()

	// 并发创建 10 个相同 code 的模板
	numGoroutines := 10
	var wg sync.WaitGroup
	successCount := 0
	conflictCount := 0
	var errors []error

	wg.Add(numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(index int) {
			defer wg.Done()

			// 每个 goroutine 创建自己的 mock 实例
			localMock := new(MockPermissionTemplateModel)
			localMockCtx := &svc.ServiceContext{
				Config:                  config.Config{},
				PermissionTemplateModel: localMock,
			}

			// 设置 mock 期望
			mu.Lock()
			currentCount := callCount
			callCount++
			mu.Unlock()

			if currentCount == 0 {
				// 第一个调用：编码不存在
				localMock.On("FindOneByCodeIncludingDeleted", mock.Anything, code).Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
				localMock.On("Insert", mock.Anything, mock.Anything).Return(&permissiontemplatemodel.PermissionTemplate{Id: "uuid-v7-" + string(rune(index))}, nil)
			} else {
				// 后续调用：编码已存在
				localMock.On("FindOneByCodeIncludingDeleted", mock.Anything, code).Return(&permissiontemplatemodel.PermissionTemplate{Id: "existing"}, nil)
			}

			logic := NewCreatePermissionTemplateLogic(ctx, localMockCtx)
			req := &types.CreatePermissionTemplateReq{
				Name:            "并发测试模板",
				Code:            code,
				Description:     "测试并发创建",
				ScopeSuggestion: permissiontemplatemodel.ScopeGlobal,
				PolicyMatrix: map[string]types.PolicyMatrixEntry{
					"user": {Actions: []string{"create", "read"}, Scope: "organization"},
				},
			}

			resp, err := logic.CreatePermissionTemplate(req)

			mu.Lock()
			if err != nil {
				if err == permissiontemplatemodel.ErrPermissionTemplateCodeExists {
					conflictCount++
				} else {
					errors = append(errors, err)
				}
			} else if resp != nil {
				successCount++
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// 验证结果
	assert.Equal(t, 1, successCount, "应该只有一个创建成功")
	assert.Equal(t, numGoroutines-1, conflictCount, "其他应该返回编码冲突错误")
	assert.Empty(t, errors, "不应该有其他错误")
}

// TestConcurrentEditConflict 测试并发编辑冲突
// 场景：多个 goroutine 同时编辑同一个模板
// 预期：最后一次更新成功（后写覆盖），或者实现乐观锁（版本号校验）
func TestConcurrentEditConflict(t *testing.T) {
	templateId := "concurrent-edit-template-id"
	desc := "原始描述"
	originalTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:          templateId,
		Name:        "原始模板名称",
		Code:        "concurrent_edit",
		Description: &desc,
		Status:      permissiontemplatemodel.StatusDraft,
		Version:     1,
	}

	ctx := context.Background()

	// 并发更新 5 次
	numGoroutines := 5
	var wg sync.WaitGroup
	successCount := 0
	var mu sync.Mutex

	wg.Add(numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(index int) {
			defer wg.Done()

			localMock := new(MockPermissionTemplateModel)
			localMockCtx := &svc.ServiceContext{
				Config:                  config.Config{},
				PermissionTemplateModel: localMock,
			}

			// 每次更新都返回原始模板（模拟未加锁的情况）
			localMock.On("FindOne", mock.Anything, templateId).Return(originalTemplate, nil).Once()
			localMock.On("FindOneByCodeIncludingDeleted", mock.Anything, "concurrent_edit").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound).Once()
			localMock.On("Update", mock.Anything, mock.MatchedBy(func(tpl *permissiontemplatemodel.PermissionTemplate) bool {
				return tpl.Id == templateId
			})).Return(nil).Once()

			logic := NewUpdatePermissionTemplateLogic(ctx, localMockCtx)
			req := &types.UpdatePermissionTemplateReq{
				Id:          templateId,
				Name:        "并发更新名称-" + string(rune('A'+index)),
				Code:        "concurrent_edit",
				Description: "并发更新描述",
				PolicyMatrix: map[string]types.PolicyMatrixEntry{
					"user": {Actions: []string{"update"}, Scope: "organization"},
				},
			}

			resp, err := logic.UpdatePermissionTemplate(req)

			mu.Lock()
			if err == nil && resp != nil {
				successCount++
			}
			mu.Unlock()
		}(i)
	}

	wg.Wait()

	// 在当前实现中（无乐观锁），所有更新都应该成功（后写覆盖）
	// 如果实现了乐观锁，应该只有一个成功，其他返回版本冲突
	assert.Equal(t, numGoroutines, successCount, "所有更新都应该成功（无乐观锁）")
}

// TestCompleteLifecycleWithStateTransitions 测试完整生命周期状态流转
// 场景：draft → published → disabled → published
func TestCompleteLifecycleWithStateTransitions(t *testing.T) {
	templateId := "lifecycle-template-id"
	policyMatrixJSON, _ := json.Marshal(map[string]interface{}{
		"user": map[string]interface{}{"actions": []string{"create", "read"}, "scope": "organization"},
	})

	template := &permissiontemplatemodel.PermissionTemplate{
		Id:           templateId,
		Name:         "生命周期测试模板",
		Code:         "lifecycle_test",
		Status:       permissiontemplatemodel.StatusDraft,
		PolicyMatrix: policyMatrixJSON,
		Version:      1,
	}

	mockModel := new(MockPermissionTemplateModel)
	svcCtx := &svc.ServiceContext{
		Config:                  config.Config{},
		PermissionTemplateModel: mockModel,
	}

	ctx := context.Background()

	// Stage 1: Draft → Published
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateVersionWithStatus", mock.Anything, templateId, 2, permissiontemplatemodel.StatusPublished).Once().Return(nil)

	publishLogic := NewPublishPermissionTemplateLogic(ctx, svcCtx)
	publishResp, err := publishLogic.PublishPermissionTemplate(&types.PublishPermissionTemplateReq{Id: templateId})

	require.NoError(t, err)
	require.NotNil(t, publishResp)
	assert.True(t, publishResp.Success)
	assert.Equal(t, 2, publishResp.Version)

	// 更新模板状态
	template.Status = permissiontemplatemodel.StatusPublished
	template.Version = 2

	// Stage 2: Published → Disabled
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusDisabled).Once().Return(nil)

	disableLogic := NewDisablePermissionTemplateLogic(ctx, svcCtx)
	disableResp, err := disableLogic.DisablePermissionTemplate(&types.DisablePermissionTemplateReq{Id: templateId})

	require.NoError(t, err)
	require.NotNil(t, disableResp)
	assert.True(t, disableResp.Success)

	// 更新模板状态
	template.Status = permissiontemplatemodel.StatusDisabled

	// Stage 3: Disabled → Published (Re-enable)
	mockModel.On("FindOne", mock.Anything, templateId).Once().Return(template, nil)
	mockModel.On("UpdateStatus", mock.Anything, templateId, permissiontemplatemodel.StatusPublished).Once().Return(nil)

	enableLogic := NewEnablePermissionTemplateLogic(ctx, svcCtx)
	enableResp, err := enableLogic.EnablePermissionTemplate(&types.EnablePermissionTemplateReq{Id: templateId})

	require.NoError(t, err)
	require.NotNil(t, enableResp)
	assert.True(t, enableResp.Success)

	mockModel.AssertExpectations(t)
}

// TestConcurrentCloneAndDelete 测试并发克隆和删除操作
// 场景：同时进行克隆和删除操作
// 预期：操作按顺序执行，无数据竞争
func TestConcurrentCloneAndDelete(t *testing.T) {
	sourceId := "source-template-id"
	sourceTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:      sourceId,
		Name:    "源模板",
		Code:    "source",
		Status:  permissiontemplatemodel.StatusPublished,
		Version: 1,
	}

	ctx := context.Background()
	var wg sync.WaitGroup
	var mu sync.Mutex

	// 模拟克隆操作
	wg.Add(1)
	go func() {
		defer wg.Done()

		localMock := new(MockPermissionTemplateModel)
		localMockCtx := &svc.ServiceContext{
			Config:                  config.Config{},
			PermissionTemplateModel: localMock,
		}

		localMock.On("FindOne", mock.Anything, sourceId).Return(sourceTemplate, nil)
		localMock.On("FindOneByCodeIncludingDeleted", mock.Anything, "cloned").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
		localMock.On("Insert", mock.Anything, mock.Anything).Return(&permissiontemplatemodel.PermissionTemplate{Id: "cloned-id"}, nil)

		logic := NewClonePermissionTemplateLogic(ctx, localMockCtx)
		_, err := logic.ClonePermissionTemplate(&types.ClonePermissionTemplateReq{
			Id:   sourceId,
			Name: "克隆模板",
			Code: "cloned",
		})

		mu.Lock()
		assert.NoError(t, err, "克隆应该成功")
		mu.Unlock()
	}()

	// 模拟删除操作（对另一个模板）
	wg.Add(1)
	go func() {
		defer wg.Done()

		deleteTargetId := "delete-target-id"
		usageStats := &permissiontemplatemodel.UsageStats{
			UsedByRoleCount: 0,
			LastAppliedAt:   nil,
		}

		localMock := new(MockPermissionTemplateModel)
		localMockCtx := &svc.ServiceContext{
			Config:                  config.Config{},
			PermissionTemplateModel: localMock,
		}

		localMock.On("GetUsageStats", mock.Anything, deleteTargetId).Return(usageStats, nil)
		localMock.On("Delete", mock.Anything, deleteTargetId).Return(nil)

		logic := NewDeletePermissionTemplateLogic(ctx, localMockCtx)
		_, err := logic.DeletePermissionTemplate(&types.DeletePermissionTemplateReq{Id: deleteTargetId})

		mu.Lock()
		assert.NoError(t, err, "删除应该成功")
		mu.Unlock()
	}()

	wg.Wait()
}

// TestConcurrentListAndUpdate 测试并发查询列表和更新操作
// 场景：一个 goroutine 查询列表，另一个更新模板
// 预期：两个操作互不影响，都成功
func TestConcurrentListAndUpdate(t *testing.T) {
	templateId := "list-update-template-id"
	templates := []*permissiontemplatemodel.PermissionTemplate{
		{
			Id:      templateId,
			Name:    "测试模板",
			Code:    "test",
			Status:  permissiontemplatemodel.StatusDraft,
			Version: 1,
		},
	}

	ctx := context.Background()
	var wg sync.WaitGroup

	// 并发列表查询
	wg.Add(1)
	go func() {
		defer wg.Done()

		localMock := new(MockPermissionTemplateModel)
		localMockCtx := &svc.ServiceContext{
			Config:                  config.Config{},
			PermissionTemplateModel: localMock,
		}

		localMock.On("Count", mock.Anything, mock.Anything).Return(int64(1), nil)
		localMock.On("List", mock.Anything, mock.MatchedBy(func(f *permissiontemplatemodel.ListFilter) bool {
			return f != nil && f.Page == 1 && f.PageSize == 10
		})).Return(templates, int64(1), nil)

		logic := NewListPermissionTemplatesLogic(ctx, localMockCtx)
		resp, err := logic.ListPermissionTemplates(&types.ListPermissionTemplatesReq{
			Page:     1,
			PageSize: 10,
		})

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.Total)
	}()

	// 并发更新操作
	wg.Add(1)
	go func() {
		defer wg.Done()

		localMock := new(MockPermissionTemplateModel)
		localMockCtx := &svc.ServiceContext{
			Config:                  config.Config{},
			PermissionTemplateModel: localMock,
		}

		localMock.On("FindOne", mock.Anything, templateId).Return(templates[0], nil)
		localMock.On("FindOneByCodeIncludingDeleted", mock.Anything, "test").Return(nil, permissiontemplatemodel.ErrPermissionTemplateNotFound)
		localMock.On("Update", mock.Anything, mock.Anything).Return(nil)

		logic := NewUpdatePermissionTemplateLogic(ctx, localMockCtx)
		_, err := logic.UpdatePermissionTemplate(&types.UpdatePermissionTemplateReq{
			Id:          templateId,
			Name:        "更新的模板名称",
			Code:        "test",
			Description: "更新的描述",
			PolicyMatrix: map[string]types.PolicyMatrixEntry{
				"user": {Actions: []string{"update"}, Scope: "organization"},
			},
		})

		assert.NoError(t, err)
	}()

	wg.Wait()
}
