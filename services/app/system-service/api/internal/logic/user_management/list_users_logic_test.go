package user_management

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// MockUserModelForList 是 users.Model 的 mock 实现
type MockUserModelForList struct {
	mock.Mock
}

func (m *MockUserModelForList) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForList) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForList) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForList) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForList) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForList) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForList) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForList) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForList) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModelForList) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModelForList) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForList) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForList) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// setupTestLogicForList 创建测试用的 Logic 实例
func setupTestLogicForList() (*ListUsersLogic, *MockUserModelForList) {
	mockModel := new(MockUserModelForList)
	svcCtx := &svc.ServiceContext{
		Config:    config.Config{},
		UserModel: mockModel,
	}
	logic := NewListUsersLogic(context.Background(), svcCtx)
	return logic, mockModel
}

// TestListUsers_ValidParams_ReturnsUserList 测试正常查询场景
func TestListUsers_ValidParams_ReturnsUserList(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userID1, _ := uuid.NewV7()
	userID2, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	userList := []*users.User{
		{
			Id:            userID1.String(),
			FirstName:     "John",
			LastName:      "Doe",
			Name:          "John Doe",
			Email:         "john.doe@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
		{
			Id:            userID2.String(),
			FirstName:     "Jane",
			LastName:      "Smith",
			Name:          "Jane Smith",
			Email:         "jane.smith@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}

	// 设置 mock 期望
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.Page == 1 && req.PageSize == 10
	})).Return(userList, int64(2), nil)

	// 执行查询
	req := &types.ListUsersReq{
		Page:     1,
		PageSize: 10,
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(2), resp.Total)
	assert.Equal(t, 1, resp.Page)
	assert.Equal(t, 10, resp.PageSize)
	assert.Len(t, resp.Users, 2)
	assert.Equal(t, userID1.String(), resp.Users[0].Id)
	assert.Equal(t, "John Doe", resp.Users[0].Name)
	assert.Equal(t, "john.doe@example.com", resp.Users[0].Email)

	mockModel.AssertExpectations(t)
}

// TestListUsers_Pagination_ReturnsCorrectPage 测试分页功能
func TestListUsers_Pagination_ReturnsCorrectPage(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	userList := []*users.User{
		{
			Id:            userID.String(),
			FirstName:     "User",
			LastName:      "Test",
			Name:          "User Test",
			Email:         "user@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}

	// 设置 mock 期望
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.Page == 2 && req.PageSize == 3
	})).Return(userList, int64(10), nil)

	// 执行查询
	req := &types.ListUsersReq{
		Page:     2,
		PageSize: 3,
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(10), resp.Total)
	assert.Equal(t, 2, resp.Page)
	assert.Equal(t, 3, resp.PageSize)
	assert.Len(t, resp.Users, 1)

	mockModel.AssertExpectations(t)
}

// TestListUsers_KeywordSearch_ReturnsFilteredResults 测试关键词搜索
func TestListUsers_KeywordSearch_ReturnsFilteredResults(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	userList := []*users.User{
		{
			Id:            userID.String(),
			FirstName:     "John",
			LastName:      "Doe",
			Name:          "John Doe",
			Email:         "john.doe@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}

	// 设置 mock 期望
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.Keyword == "John"
	})).Return(userList, int64(1), nil)

	// 执行查询
	req := &types.ListUsersReq{
		Page:     1,
		PageSize: 10,
		Keyword:  "John",
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.Total)
	assert.Len(t, resp.Users, 1)
	assert.Equal(t, "John Doe", resp.Users[0].Name)

	mockModel.AssertExpectations(t)
}

// TestListUsers_MultiDimensionFilter_ReturnsFilteredResults 测试多维度筛选
func TestListUsers_MultiDimensionFilter_ReturnsFilteredResults(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()
	deptId := "dept-001"
	status := int8(1)

	userList := []*users.User{
		{
			Id:            userID.String(),
			FirstName:     "John",
			LastName:      "Doe",
			Name:          "John Doe",
			Email:         "john.doe@example.com",
			DeptId:        &deptId,
			PasswordHash:  string(passwordHash),
			Status:        status,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}

	// 设置 mock 期望 - 按部门筛选
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.DeptId == "dept-001" && req.Status != nil && *req.Status == 1
	})).Return(userList, int64(1), nil)

	// 执行查询
	req := &types.ListUsersReq{
		Page:     1,
		PageSize: 10,
		DeptId:   "dept-001",
		Status:   1,
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.Total)
	assert.Len(t, resp.Users, 1)
	assert.Equal(t, "dept-001", resp.Users[0].DeptId)

	mockModel.AssertExpectations(t)
}

// TestListUsers_SortFunction_ReturnsSortedResults 测试排序功能
func TestListUsers_SortFunction_ReturnsSortedResults(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userID1, _ := uuid.NewV7()
	userID2, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	userList := []*users.User{
		{
			Id:            userID1.String(),
			FirstName:     "Alice",
			LastName:      "Doe",
			Name:          "Alice Doe",
			Email:         "alice@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
		{
			Id:            userID2.String(),
			FirstName:     "Bob",
			LastName:      "Smith",
			Name:          "Bob Smith",
			Email:         "bob@example.com",
			PasswordHash:  string(passwordHash),
			Status:        1,
			AccountSource: "local",
			CreatedAt:     now,
			UpdatedAt:     now,
		},
	}

	// 设置 mock 期望
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.SortField == "name" && req.SortOrder == "asc"
	})).Return(userList, int64(2), nil)

	// 执行查询
	req := &types.ListUsersReq{
		Page:      1,
		PageSize:  10,
		SortField: "name",
		SortOrder: "asc",
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(2), resp.Total)
	assert.Len(t, resp.Users, 2)

	mockModel.AssertExpectations(t)
}

// TestListUsers_InvalidPageParams_UsesDefaults 测试无效分页参数使用默认值
func TestListUsers_InvalidPageParams_UsesDefaults(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userList := []*users.User{}

	// 设置 mock 期望 - 使用默认值
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.Page == 1 && req.PageSize == 10
	})).Return(userList, int64(0), nil)

	// 执行查询 - 无效参数
	req := &types.ListUsersReq{
		Page:     0, // 无效，应该使用默认值 1
		PageSize: 0, // 无效，应该使用默认值 10
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 1, resp.Page)
	assert.Equal(t, 10, resp.PageSize)

	mockModel.AssertExpectations(t)
}

// TestListUsers_ExceedsMaxPageSize_LimitsToMax 测试超过最大分页大小限制
func TestListUsers_ExceedsMaxPageSize_LimitsToMax(t *testing.T) {
	logic, mockModel := setupTestLogicForList()

	// 准备测试数据
	userList := []*users.User{}

	// 设置 mock 期望 - 限制为最大 100
	mockModel.On("FindList", mock.Anything, mock.MatchedBy(func(req *users.FindListReq) bool {
		return req.PageSize == 100
	})).Return(userList, int64(0), nil)

	// 执行查询 - 超过最大限制
	req := &types.ListUsersReq{
		Page:     1,
		PageSize: 200, // 超过最大限制 100
	}
	resp, err := logic.ListUsers(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 100, resp.PageSize)

	mockModel.AssertExpectations(t)
}
