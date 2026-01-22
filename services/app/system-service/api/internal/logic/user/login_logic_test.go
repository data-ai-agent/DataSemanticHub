package user

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

// MockUserModel 是 users.Model 的 mock 实现
type MockUserModel struct {
	mock.Mock
}

func (m *MockUserModel) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModel) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModel) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModel) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModel) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModel) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModel) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModel) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModel) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModel) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModel) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModel) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	return args.Get(0).(users.Model)
}

func (m *MockUserModel) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// setupTestLogic 创建测试用的 LoginLogic
func setupTestLogic(mockModel *MockUserModel) (*LoginLogic, *svc.ServiceContext) {
	cfg := config.Config{
		Auth: struct {
			AccessSecret string
			AccessExpire int64
		}{
			AccessSecret: "test-secret-key-for-jwt-token-generation",
			AccessExpire: 7200,
		},
	}

	svcCtx := &svc.ServiceContext{
		Config:    cfg,
		UserModel: mockModel,
	}

	logic := NewLoginLogic(context.Background(), svcCtx)
	return logic, svcCtx
}

// TestLogin_ValidCredentials_ReturnsToken 测试正常登录（AC-02）
func TestLogin_ValidCredentials_ReturnsToken(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		Organization: "Test Org",
		PasswordHash: string(passwordHash),
		Status:       1, // 启用
		LastLoginAt:  nil,
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)
	mockModel.On("UpdateLastLoginAt", mock.Anything, userID.String(), mock.AnythingOfType("time.Time")).Return(nil)

	// 执行登录
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   password,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, int64(86400), resp.ExpiresIn) // 24小时
	assert.Equal(t, userID.String(), resp.UserInfo.Id)
	assert.Equal(t, "John", resp.UserInfo.FirstName)
	assert.Equal(t, "Doe", resp.UserInfo.LastName)
	assert.Equal(t, "john.doe@example.com", resp.UserInfo.Email)
	assert.Equal(t, "Test Org", resp.UserInfo.Organization)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestLogin_InvalidPassword_ReturnsError 测试密码错误（AC-15，统一错误提示 BR-05）
func TestLogin_InvalidPassword_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	correctPassword := "password123"
	wrongPassword := "wrongpassword"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(correctPassword), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		PasswordHash: string(passwordHash),
		Status:       1,
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)

	// 执行登录（使用错误密码）
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   wrongPassword,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	// 验证统一错误提示
	assert.Contains(t, err.Error(), "用户名或密码错误")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestLogin_UserNotFound_ReturnsError 测试用户不存在（AC-15，统一错误提示 BR-05）
func TestLogin_UserNotFound_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 设置 mock 期望（用户不存在）
	mockModel.On("FindOneByEmail", mock.Anything, "nonexistent@example.com").Return(nil, users.ErrUserNotFound)

	// 执行登录
	req := &types.LoginReq{
		Email:      "nonexistent@example.com",
		Password:   "password123",
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	// 验证统一错误提示
	assert.Contains(t, err.Error(), "用户名或密码错误")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestLogin_FirstLogin_AutoActivatesUser 测试首次登录自动激活场景（T122）
func TestLogin_FirstLogin_AutoActivatesUser(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据（未激活用户）
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		Organization: "Test Org",
		PasswordHash: string(passwordHash),
		Status:       0, // 未激活
		LastLoginAt:  nil,
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)
	mockModel.On("UpdateStatus", mock.Anything, userID.String(), int8(1), (*string)(nil), (*string)(nil)).Return(nil)
	mockModel.On("UpdateLastLoginAt", mock.Anything, userID.String(), mock.AnythingOfType("time.Time")).Return(nil)

	// 执行登录
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   password,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, userID.String(), resp.UserInfo.Id)

	// 验证 mock 调用（应该调用了 UpdateStatus 来激活用户）
	mockModel.AssertExpectations(t)
}

// TestLogin_ActivatedUser_LoginSuccess 测试已激活用户登录场景（T122）
func TestLogin_ActivatedUser_LoginSuccess(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据（已激活用户）
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "Jane",
		LastName:     "Smith",
		Email:        "jane.smith@example.com",
		Organization: "Test Org",
		PasswordHash: string(passwordHash),
		Status:       1, // 已激活
		LastLoginAt:  nil,
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "jane.smith@example.com").Return(user, nil)
	mockModel.On("UpdateLastLoginAt", mock.Anything, userID.String(), mock.AnythingOfType("time.Time")).Return(nil)

	// 执行登录
	req := &types.LoginReq{
		Email:      "jane.smith@example.com",
		Password:   password,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)

	// 验证 mock 调用（不应该调用 UpdateStatus，因为用户已经激活）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "UpdateStatus", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

// TestLogin_UserDisabled_ReturnsError 测试用户已禁用（BR-02）
func TestLogin_UserDisabled_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据（用户已停用）
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		PasswordHash: string(passwordHash),
		Status:       2, // 停用（不是未激活）
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)

	// 执行登录
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   password,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户已被禁用")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestLogin_RememberMe_ExtendsTokenExpiry 测试记住我功能（AC-03，Token 有效期延长）
func TestLogin_RememberMe_ExtendsTokenExpiry(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		PasswordHash: string(passwordHash),
		Status:       1,
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)
	mockModel.On("UpdateLastLoginAt", mock.Anything, userID.String(), mock.AnythingOfType("time.Time")).Return(nil)

	// 执行登录（记住我）
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   password,
		RememberMe: true,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, int64(604800), resp.ExpiresIn) // 7天

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestLogin_EmptyEmail_ReturnsError 测试必填字段缺失（AC-16）
func TestLogin_EmptyEmail_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 执行登录（邮箱为空）
	req := &types.LoginReq{
		Email:      "",
		Password:   "password123",
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "邮箱不能为空")

	// 验证 mock 未被调用
	mockModel.AssertNotCalled(t, "FindOneByEmail", mock.Anything, mock.Anything)
}

// TestLogin_EmptyPassword_ReturnsError 测试必填字段缺失（AC-16）
func TestLogin_EmptyPassword_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 执行登录（密码为空）
	req := &types.LoginReq{
		Email:      "john.doe@example.com",
		Password:   "",
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码不能为空")

	// 验证 mock 未被调用
	mockModel.AssertNotCalled(t, "FindOneByEmail", mock.Anything, mock.Anything)
}

// TestLogin_EmailCaseInsensitive_Works 测试邮箱大小写不敏感
func TestLogin_EmailCaseInsensitive_Works(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com", // 小写存储
		PasswordHash: string(passwordHash),
		Status:       1,
	}

	// 设置 mock 期望（邮箱会被转小写）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(user, nil)
	mockModel.On("UpdateLastLoginAt", mock.Anything, userID.String(), mock.AnythingOfType("time.Time")).Return(nil)

	// 执行登录（使用大写邮箱）
	req := &types.LoginReq{
		Email:      "JOHN.DOE@EXAMPLE.COM",
		Password:   password,
		RememberMe: false,
	}

	resp, err := logic.Login(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)

	// 验证 mock 调用（应该使用小写邮箱）
	mockModel.AssertExpectations(t)
}
