package user_management

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
)

// MockUserModelForResetPassword 是 users.Model 的 mock 实现
type MockUserModelForResetPassword struct {
	mock.Mock
}

func (m *MockUserModelForResetPassword) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForResetPassword) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForResetPassword) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForResetPassword) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForResetPassword) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForResetPassword) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForResetPassword) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForResetPassword) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForResetPassword) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModelForResetPassword) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModelForResetPassword) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForResetPassword) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForResetPassword) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// MockAuditLogModelForResetPassword 是 auditlogs.Model 的 mock 实现
type MockAuditLogModelForResetPassword struct {
	mock.Mock
}

func (m *MockAuditLogModelForResetPassword) Insert(ctx context.Context, data *auditlogs.AuditLog) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForResetPassword) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*auditlogs.AuditLog, int64, error) {
	args := m.Called(ctx, userId, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*auditlogs.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditLogModelForResetPassword) FindOne(ctx context.Context, id int64) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForResetPassword) WithTx(tx interface{}) auditlogs.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(auditlogs.Model)
}

// setupTestLogicForResetPassword 创建测试用的 Logic 实例
func setupTestLogicForResetPassword() (*ResetPasswordLogic, *MockUserModelForResetPassword, *MockAuditLogModelForResetPassword) {
	mockUserModel := new(MockUserModelForResetPassword)
	mockAuditLogModel := new(MockAuditLogModelForResetPassword)
	svcCtx := &svc.ServiceContext{
		Config:        config.Config{},
		UserModel:     mockUserModel,
		AuditLogModel: mockAuditLogModel,
	}
	logic := NewResetPasswordLogic(context.Background(), svcCtx)
	return logic, mockUserModel, mockAuditLogModel
}

// TestResetPassword_ValidInput_ResetsPassword 测试正常重置场景
func TestResetPassword_ValidInput_ResetsPassword(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "Test User",
		Email:         "test@example.com",
		Status:        1,
		AccountSource: "local",
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	changes := map[string]interface{}{
		"password_reset": map[string]interface{}{"action": "reset"},
	}
	changesJSON, _ := json.Marshal(changes)
	auditLog := &auditlogs.AuditLog{
		Id:         1,
		UserId:     userID.String(),
		Action:     "reset_password",
		Operator:   operator.Name,
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "reset_password" &&
			log.OperatorId == operatorID.String()
	})).Return(auditLog, nil)

	req := &types.ResetPasswordReq{
		SendEmail: true,
	}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.TemporaryPassword)
	assert.GreaterOrEqual(t, len(resp.TemporaryPassword), 8)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestResetPassword_SSOAccount_ReturnsError 测试SSO账号重置场景
func TestResetPassword_SSOAccount_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "SSO User",
		Email:         "sso@example.com",
		Status:        1,
		AccountSource: "sso", // SSO 账号
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

	req := &types.ResetPasswordReq{}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "仅本地账号支持密码重置")

	mockUserModel.AssertExpectations(t)
}

// TestResetPassword_UserNotFound_ReturnsError 测试用户不存在场景
func TestResetPassword_UserNotFound_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForResetPassword()

	userID, _ := uuid.NewV7()

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(nil, users.ErrUserNotFound)

	req := &types.ResetPasswordReq{}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	mockUserModel.AssertExpectations(t)
}

// TestResetPassword_WithNewPassword_UsesProvidedPassword 测试使用提供的密码场景
func TestResetPassword_WithNewPassword_UsesProvidedPassword(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "Test User",
		Email:         "test@example.com",
		Status:        1,
		AccountSource: "local",
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.ResetPasswordReq{
		NewPassword: "NewPassword123",
		SendEmail:   false,
	}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "NewPassword123", resp.TemporaryPassword)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestResetPassword_InvalidPassword_ReturnsError 测试无效密码场景
func TestResetPassword_InvalidPassword_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "Test User",
		Email:         "test@example.com",
		Status:        1,
		AccountSource: "local",
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

	testCases := []struct {
		name     string
		password string
	}{
		{"太短", "1234567"},
		{"只有数字", "12345678"},
		{"只有字母", "abcdefgh"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := &types.ResetPasswordReq{
				NewPassword: tc.password,
			}

			resp, err := logic.ResetPassword(userID.String(), req)

			assert.Error(t, err)
			assert.Nil(t, resp)
		})
	}

	mockUserModel.AssertExpectations(t)
}

// TestResetPassword_EmptyUserId_ReturnsError 测试空用户ID场景
func TestResetPassword_EmptyUserId_ReturnsError(t *testing.T) {
	logic, _, _ := setupTestLogicForResetPassword()

	req := &types.ResetPasswordReq{}

	// 执行重置密码
	resp, err := logic.ResetPassword("", req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")
}

// TestResetPassword_AuditLog_RecordsChanges 测试审计日志记录
func TestResetPassword_AuditLog_RecordsChanges(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "Test User",
		Email:         "test@example.com",
		Status:        1,
		AccountSource: "local",
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)

	// 验证审计日志内容
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		// 验证审计日志的关键字段
		if log.UserId != userID.String() || log.Action != "reset_password" || log.OperatorId != operatorID.String() {
			return false
		}

		// 验证变更内容
		var changes map[string]interface{}
		if err := json.Unmarshal([]byte(log.Changes), &changes); err != nil {
			return false
		}

		// 验证密码重置标记
		if passwordReset, ok := changes["password_reset"].(map[string]interface{}); ok {
			if passwordReset["action"] != "reset" {
				return false
			}
		} else {
			return false
		}

		return true
	})).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.ResetPasswordReq{}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestResetPassword_GeneratesTemporaryPassword_WhenNotProvided 测试未提供密码时生成临时密码
func TestResetPassword_GeneratesTemporaryPassword_WhenNotProvided(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForResetPassword()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:            userID.String(),
		Name:          "Test User",
		Email:         "test@example.com",
		Status:        1,
		AccountSource: "local",
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.ResetPasswordReq{
		// 不提供 NewPassword
	}

	// 执行重置密码
	resp, err := logic.ResetPassword(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.TemporaryPassword)
	// 验证生成的密码符合复杂度要求
	assert.GreaterOrEqual(t, len(resp.TemporaryPassword), 8)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}
