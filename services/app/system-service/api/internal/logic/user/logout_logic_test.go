package user

import (
	"context"
	"testing"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupLogoutTestLogic 创建测试用的 LogoutLogic
func setupLogoutTestLogic(mockModel *MockUserModel) (*LogoutLogic, *svc.ServiceContext) {
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

	logic := NewLogoutLogic(context.Background(), svcCtx)
	return logic, svcCtx
}

// TestLogout_ValidToken_ReturnsSuccess 测试正常退出登录（AC-05）
func TestLogout_ValidToken_ReturnsSuccess(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupLogoutTestLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	ctx := context.WithValue(context.Background(), "user_id", userID.String())
	logic.ctx = ctx

	// 执行退出登录
	resp, err := logic.Logout()

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "退出登录成功", resp.Message)
}

// TestLogout_InvalidToken_ReturnsError 测试 Token 无效
func TestLogout_InvalidToken_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupLogoutTestLogic(mockModel)

	// 创建不带 user_id 的 context（模拟 Token 无效）
	logic.ctx = context.Background()

	// 执行退出登录
	resp, err := logic.Logout()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "Token 无效或已过期")
}

// TestLogout_ExpiredToken_ReturnsError 测试 Token 过期
func TestLogout_ExpiredToken_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupLogoutTestLogic(mockModel)

	// 创建带 nil user_id 的 context（模拟 Token 过期）
	logic.ctx = context.WithValue(context.Background(), "user_id", nil)

	// 执行退出登录
	resp, err := logic.Logout()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "Token 无效")
}

// TestLogout_InvalidUserIDType_ReturnsError 测试无效的用户 ID 类型
func TestLogout_InvalidUserIDType_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupLogoutTestLogic(mockModel)

	// 创建带无效类型 user_id 的 context
	logic.ctx = context.WithValue(context.Background(), "user_id", 12345)

	// 执行退出登录
	resp, err := logic.Logout()

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "Token 无效")
}
