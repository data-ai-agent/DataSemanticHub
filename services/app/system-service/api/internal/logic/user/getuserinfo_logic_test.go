package user

import (
	"context"
	"testing"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// setupGetUserInfoTestLogic 创建测试用的 GetUserInfoLogic
func setupGetUserInfoTestLogic(mockModel *MockUserModel) (*GetUserInfoLogic, *svc.ServiceContext, context.Context) {
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

	// 创建带 user_id 的 context
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, "test-user-id")
	logic := NewGetUserInfoLogic(ctx, svcCtx)
	return logic, svcCtx, ctx
}

// TestGetUserInfo_ValidToken_ReturnsUserInfo 测试正常获取用户信息（AC-04）
func TestGetUserInfo_ValidToken_ReturnsUserInfo(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	user := &users.User{
		Id:           userID.String(),
		FirstName:    "John",
		LastName:     "Doe",
		Email:        "john.doe@example.com",
		Organization: "Test Org",
		Status:       1, // 启用
	}

	// 创建带 user_id 的 context
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, userID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.UserInfo)
	assert.Equal(t, userID.String(), resp.UserInfo.Id)
	assert.Equal(t, "John", resp.UserInfo.FirstName)
	assert.Equal(t, "Doe", resp.UserInfo.LastName)
	assert.Equal(t, "john.doe@example.com", resp.UserInfo.Email)
	assert.Equal(t, "Test Org", resp.UserInfo.Organization)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestGetUserInfo_InvalidToken_ReturnsError 测试 Token 无效（AC-18）
func TestGetUserInfo_InvalidToken_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 创建不带 user_id 的 context（模拟 Token 无效）
	logic.ctx = context.Background()

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "Token 无效或已过期")
}

// TestGetUserInfo_ExpiredToken_ReturnsError 测试 Token 过期（AC-18）
func TestGetUserInfo_ExpiredToken_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 创建带 nil user_id 的 context（模拟 Token 过期）
	logic.ctx = context.WithValue(context.Background(), contextkeys.UserIDKey, nil)

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "Token 无效")
}

// TestGetUserInfo_UserNotFound_ReturnsError 测试用户不存在
func TestGetUserInfo_UserNotFound_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, userID.String())
	logic.ctx = ctx

	// 设置 mock 期望：返回用户不存在（nil user 和错误）
	mockModel.On("FindOne", mock.Anything, userID.String()).Return(nil, users.ErrUserNotFound)

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestGetUserInfo_UserIsNil_ReturnsError 测试用户为 nil
func TestGetUserInfo_UserIsNil_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, userID.String())
	logic.ctx = ctx

	// 设置 mock 期望：返回 nil user 和 nil 错误
	mockModel.On("FindOne", mock.Anything, userID.String()).Return(nil, nil)

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestGetUserInfo_UserDisabled_ReturnsError 测试用户已禁用
func TestGetUserInfo_UserDisabled_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _, _ := setupGetUserInfoTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	user := &users.User{
		Id:        userID.String(),
		FirstName: "John",
		LastName:  "Doe",
		Email:     "john.doe@example.com",
		Status:    0, // 禁用
	}

	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, userID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

	// 执行获取用户信息
	resp, err := logic.GetUserInfo()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户已被禁用")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}
