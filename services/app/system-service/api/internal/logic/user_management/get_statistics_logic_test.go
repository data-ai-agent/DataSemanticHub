package user_management

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockUserModelForGetStatistics 是 users.Model 的 mock 实现
type MockUserModelForGetStatistics struct {
	mock.Mock
}

func (m *MockUserModelForGetStatistics) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForGetStatistics) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForGetStatistics) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForGetStatistics) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForGetStatistics) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForGetStatistics) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForGetStatistics) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForGetStatistics) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForGetStatistics) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
	args := m.Called(ctx, userIds, status, lockReason, lockBy)
	if args.Get(0) == nil {
		return nil, nil, args.Error(2)
	}
	successIds := args.Get(0).([]string)
	var errors []users.BatchUpdateError
	if args.Get(1) != nil {
		errors = args.Get(1).([]users.BatchUpdateError)
	}
	return successIds, errors, args.Error(2)
}

func (m *MockUserModelForGetStatistics) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModelForGetStatistics) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForGetStatistics) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForGetStatistics) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// setupTestLogicForGetStatistics 创建测试用的 Logic 实例
func setupTestLogicForGetStatistics() (*GetStatisticsLogic, *MockUserModelForGetStatistics) {
	mockUserModel := new(MockUserModelForGetStatistics)
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		UserModel: mockUserModel,
	}
	logic := NewGetStatisticsLogic(context.Background(), svcCtx)
	return logic, mockUserModel
}

// TestGetStatistics_ValidData_ReturnsStatistics 测试正常统计场景
func TestGetStatistics_ValidData_ReturnsStatistics(t *testing.T) {
	logic, mockUserModel := setupTestLogicForGetStatistics()

	// 准备测试数据
	stats := &users.Statistics{
		Total:            100,
		Active:           60,
		Locked:           5,
		Inactive:         20,
		NoOrgBinding:     15,
		NoPermissionRole: 10,
		RecentActiveRate: 45.5,
	}

	// 设置 mock 期望
	mockUserModel.On("GetStatistics", mock.Anything).Return(stats, nil)

	// 执行统计
	resp, err := logic.GetStatistics()

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(100), resp.Total)
	assert.Equal(t, int64(60), resp.Active)
	assert.Equal(t, int64(5), resp.Locked)
	assert.Equal(t, int64(20), resp.Inactive)
	assert.Equal(t, int64(15), resp.NoOrgBinding)
	assert.Equal(t, int64(10), resp.NoPermissionRole)
	assert.InDelta(t, 45.5, resp.RecentActiveRate, 0.1)

	mockUserModel.AssertExpectations(t)
}

// TestGetStatistics_EmptyDatabase_ReturnsZero 测试空数据库场景
func TestGetStatistics_EmptyDatabase_ReturnsZero(t *testing.T) {
	logic, mockUserModel := setupTestLogicForGetStatistics()

	// 准备测试数据
	stats := &users.Statistics{
		Total:            0,
		Active:           0,
		Locked:           0,
		Inactive:         0,
		NoOrgBinding:     0,
		NoPermissionRole: 0,
		RecentActiveRate: 0.0,
	}

	// 设置 mock 期望
	mockUserModel.On("GetStatistics", mock.Anything).Return(stats, nil)

	// 执行统计
	resp, err := logic.GetStatistics()

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(0), resp.Total)
	assert.Equal(t, int64(0), resp.Active)
	assert.Equal(t, int64(0), resp.Locked)
	assert.Equal(t, int64(0), resp.Inactive)
	assert.Equal(t, int64(0), resp.NoOrgBinding)
	assert.Equal(t, int64(0), resp.NoPermissionRole)
	assert.Equal(t, 0.0, resp.RecentActiveRate)

	mockUserModel.AssertExpectations(t)
}

// TestGetStatistics_VariousDataDistribution_ReturnsCorrectStats 测试各种数据分布场景
func TestGetStatistics_VariousDataDistribution_ReturnsCorrectStats(t *testing.T) {
	logic, mockUserModel := setupTestLogicForGetStatistics()

	testCases := []struct {
		name  string
		stats *users.Statistics
	}{
		{
			"全部启用状态",
			&users.Statistics{
				Total:            50,
				Active:           50,
				Locked:           0,
				Inactive:         0,
				NoOrgBinding:     5,
				NoPermissionRole: 3,
				RecentActiveRate: 80.0,
			},
		},
		{
			"全部锁定状态",
			&users.Statistics{
				Total:            30,
				Active:           0,
				Locked:           30,
				Inactive:         0,
				NoOrgBinding:     2,
				NoPermissionRole: 1,
				RecentActiveRate: 0.0,
			},
		},
		{
			"混合状态",
			&users.Statistics{
				Total:            200,
				Active:           120,
				Locked:           10,
				Inactive:         50,
				NoOrgBinding:     30,
				NoPermissionRole: 20,
				RecentActiveRate: 65.5,
			},
		},
		{
			"高活跃率",
			&users.Statistics{
				Total:            1000,
				Active:           800,
				Locked:           10,
				Inactive:         100,
				NoOrgBinding:     50,
				NoPermissionRole: 30,
				RecentActiveRate: 95.5,
			},
		},
		{
			"低活跃率",
			&users.Statistics{
				Total:            500,
				Active:           200,
				Locked:           50,
				Inactive:         200,
				NoOrgBinding:     100,
				NoPermissionRole: 80,
				RecentActiveRate: 10.2,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// 设置 mock 期望
			mockUserModel.On("GetStatistics", mock.Anything).Return(tc.stats, nil)

			// 执行统计
			resp, err := logic.GetStatistics()

			// 验证结果
			require.NoError(t, err)
			assert.NotNil(t, resp)
			assert.Equal(t, tc.stats.Total, resp.Total)
			assert.Equal(t, tc.stats.Active, resp.Active)
			assert.Equal(t, tc.stats.Locked, resp.Locked)
			assert.Equal(t, tc.stats.Inactive, resp.Inactive)
			assert.Equal(t, tc.stats.NoOrgBinding, resp.NoOrgBinding)
			assert.Equal(t, tc.stats.NoPermissionRole, resp.NoPermissionRole)
			assert.InDelta(t, tc.stats.RecentActiveRate, resp.RecentActiveRate, 0.1)
		})
	}

	mockUserModel.AssertExpectations(t)
}

// TestGetStatistics_ModelError_ReturnsError 测试 Model 层错误场景
func TestGetStatistics_ModelError_ReturnsError(t *testing.T) {
	logic, mockUserModel := setupTestLogicForGetStatistics()

	// 设置 mock 期望 - 返回错误
	mockUserModel.On("GetStatistics", mock.Anything).Return(nil, assert.AnError)

	// 执行统计
	resp, err := logic.GetStatistics()

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)

	mockUserModel.AssertExpectations(t)
}
