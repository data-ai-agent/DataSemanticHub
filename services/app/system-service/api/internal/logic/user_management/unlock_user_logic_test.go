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

// MockUserModelForUnlock 是 users.Model 的 mock 实现
type MockUserModelForUnlock struct {
	mock.Mock
}

func (m *MockUserModelForUnlock) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForUnlock) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForUnlock) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForUnlock) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForUnlock) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForUnlock) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForUnlock) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForUnlock) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForUnlock) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModelForUnlock) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForUnlock) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForUnlock) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// MockAuditLogModelForUnlock 是 auditlogs.Model 的 mock 实现
type MockAuditLogModelForUnlock struct {
	mock.Mock
}

func (m *MockAuditLogModelForUnlock) Insert(ctx context.Context, data *auditlogs.AuditLog) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForUnlock) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*auditlogs.AuditLog, int64, error) {
	args := m.Called(ctx, userId, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*auditlogs.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditLogModelForUnlock) FindOne(ctx context.Context, id int64) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForUnlock) WithTx(tx interface{}) auditlogs.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(auditlogs.Model)
}

// setupTestLogicForUnlock 创建测试用的 Logic 实例
func setupTestLogicForUnlock() (*UnlockUserLogic, *MockUserModelForUnlock, *MockAuditLogModelForUnlock) {
	mockUserModel := new(MockUserModelForUnlock)
	mockAuditLogModel := new(MockAuditLogModelForUnlock)
	svcCtx := &svc.ServiceContext{
		Config:        config.Config{},
		UserModel:     mockUserModel,
		AuditLogModel: mockAuditLogModel,
	}
	logic := NewUnlockUserLogic(context.Background(), svcCtx)
	return logic, mockUserModel, mockAuditLogModel
}

// TestUnlockUser_ValidInput_UnlocksUser 测试正常解锁场景
func TestUnlockUser_ValidInput_UnlocksUser(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForUnlock()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	lockReason := "违规操作"
	lockBy := operatorID.String()
	lockTime := time.Now()

	lockedUser := &users.User{
		Id:         userID.String(),
		Name:       "Locked User",
		Email:      "locked@example.com",
		Status:     3, // 锁定
		LockReason: &lockReason,
		LockBy:     &lockBy,
		LockTime:   &lockTime,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	operatorIDStr := operatorID.String()
	changes := map[string]interface{}{
		"status":      map[string]interface{}{"old": 3, "new": 1},
		"lock_reason": map[string]interface{}{"old": lockReason, "new": nil},
		"lock_time":   map[string]interface{}{"old": lockTime, "new": nil},
		"lock_by":     map[string]interface{}{"old": lockBy, "new": nil},
	}
	changesJSON, _ := json.Marshal(changes)
	auditLog := &auditlogs.AuditLog{
		Id:         1,
		UserId:     userID.String(),
		Action:     "unlock",
		Operator:   operator.Name,
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(lockedUser, nil)
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(1), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "unlock" &&
			log.OperatorId == operatorID.String()
	})).Return(auditLog, nil)

	req := &types.UnlockUserReq{
		Reason: "问题已解决",
	}

	// 执行解锁
	resp, err := logic.UnlockUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestUnlockUser_UserNotFound_ReturnsError 测试用户不存在场景
func TestUnlockUser_UserNotFound_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForUnlock()

	userID, _ := uuid.NewV7()

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(nil, users.ErrUserNotFound)

	req := &types.UnlockUserReq{}

	// 执行解锁
	resp, err := logic.UnlockUser(userID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	mockUserModel.AssertExpectations(t)
}

// TestUnlockUser_NonLockedStatus_ReturnsError 测试非锁定状态解锁场景
func TestUnlockUser_NonLockedStatus_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForUnlock()

	// 准备测试数据
	userID, _ := uuid.NewV7()

	testCases := []struct {
		name       string
		status     int8
		statusName string
	}{
		{"启用状态", 1, "启用"},
		{"停用状态", 2, "停用"},
		{"归档状态", 4, "归档"},
		{"未激活状态", 0, "未激活"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			user := &users.User{
				Id:     userID.String(),
				Name:   "Test User",
				Email:  "test@example.com",
				Status: tc.status,
			}

			// 设置 mock 期望
			mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

			req := &types.UnlockUserReq{}

			// 执行解锁
			resp, err := logic.UnlockUser(userID.String(), req)

			// 验证结果
			assert.Error(t, err)
			assert.Nil(t, resp)
			assert.Contains(t, err.Error(), "用户状态不是锁定状态")
		})
	}

	mockUserModel.AssertExpectations(t)
}

// TestUnlockUser_EmptyUserId_ReturnsError 测试空用户ID场景
func TestUnlockUser_EmptyUserId_ReturnsError(t *testing.T) {
	logic, _, _ := setupTestLogicForUnlock()

	req := &types.UnlockUserReq{}

	// 执行解锁
	resp, err := logic.UnlockUser("", req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")
}

// TestUnlockUser_AuditLog_RecordsChanges 测试审计日志记录
func TestUnlockUser_AuditLog_RecordsChanges(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForUnlock()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	lockReason := "违规操作"
	lockBy := operatorID.String()
	lockTime := time.Now()

	lockedUser := &users.User{
		Id:         userID.String(),
		Name:       "Locked User",
		Email:      "locked@example.com",
		Status:     3, // 锁定
		LockReason: &lockReason,
		LockBy:     &lockBy,
		LockTime:   &lockTime,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(lockedUser, nil)
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(1), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)

	// 验证审计日志内容
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		// 验证审计日志的关键字段
		if log.UserId != userID.String() || log.Action != "unlock" || log.OperatorId != operatorID.String() {
			return false
		}

		// 验证变更内容
		var changes map[string]interface{}
		if err := json.Unmarshal([]byte(log.Changes), &changes); err != nil {
			return false
		}

		// 验证状态变更
		if statusChange, ok := changes["status"].(map[string]interface{}); ok {
			if statusChange["old"] != float64(3) || statusChange["new"] != float64(1) {
				return false
			}
		} else {
			return false
		}

		return true
	})).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.UnlockUserReq{}

	// 执行解锁
	resp, err := logic.UnlockUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestUnlockUser_ClearsLockInfo 测试解锁时清空锁定信息
func TestUnlockUser_ClearsLockInfo(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForUnlock()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	lockReason := "违规操作"
	lockBy := operatorID.String()
	lockTime := time.Now()

	lockedUser := &users.User{
		Id:         userID.String(),
		Name:       "Locked User",
		Email:      "locked@example.com",
		Status:     3, // 锁定
		LockReason: &lockReason,
		LockBy:     &lockBy,
		LockTime:   &lockTime,
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(lockedUser, nil)
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(&users.User{Id: operatorID.String(), Name: "Operator"}, nil)
	// 验证 UpdateStatus 被调用时，lockReason 和 lockBy 都是 nil
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(1), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.UnlockUserReq{}

	// 执行解锁
	resp, err := logic.UnlockUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}
