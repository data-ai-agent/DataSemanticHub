package user_management

import (
	"context"
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
)

// MockUserModelForBatchUpdate 是 users.Model 的 mock 实现
type MockUserModelForBatchUpdate struct {
	mock.Mock
}

func (m *MockUserModelForBatchUpdate) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForBatchUpdate) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForBatchUpdate) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForBatchUpdate) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForBatchUpdate) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForBatchUpdate) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForBatchUpdate) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForBatchUpdate) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForBatchUpdate) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModelForBatchUpdate) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModelForBatchUpdate) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForBatchUpdate) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForBatchUpdate) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// MockAuditLogModelForBatchUpdate 是 auditlogs.Model 的 mock 实现
type MockAuditLogModelForBatchUpdate struct {
	mock.Mock
}

func (m *MockAuditLogModelForBatchUpdate) Insert(ctx context.Context, data *auditlogs.AuditLog) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForBatchUpdate) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*auditlogs.AuditLog, int64, error) {
	args := m.Called(ctx, userId, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*auditlogs.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditLogModelForBatchUpdate) FindOne(ctx context.Context, id int64) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForBatchUpdate) WithTx(tx interface{}) auditlogs.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(auditlogs.Model)
}

// setupTestLogicForBatchUpdate 创建测试用的 Logic 实例
func setupTestLogicForBatchUpdate() (*BatchUpdateStatusLogic, *MockUserModelForBatchUpdate, *MockAuditLogModelForBatchUpdate) {
	mockUserModel := new(MockUserModelForBatchUpdate)
	mockAuditLogModel := new(MockAuditLogModelForBatchUpdate)
	svcCtx := &svc.ServiceContext{
		Config:        config.Config{},
		UserModel:     mockUserModel,
		AuditLogModel: mockAuditLogModel,
	}
	logic := NewBatchUpdateStatusLogic(context.Background(), svcCtx)
	return logic, mockUserModel, mockAuditLogModel
}

// TestBatchUpdateStatus_ValidInput_UpdatesAllUsers 测试正常批量更新场景
func TestBatchUpdateStatus_ValidInput_UpdatesAllUsers(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForBatchUpdate()

	// 准备测试数据
	user1ID, _ := uuid.NewV7()
	user2ID, _ := uuid.NewV7()
	user3ID, _ := uuid.NewV7()

	user1 := &users.User{
		Id:     user1ID.String(),
		Name:   "User1",
		Email:  "user1@example.com",
		Status: 1,
	}
	user2 := &users.User{
		Id:     user2ID.String(),
		Name:   "User2",
		Email:  "user2@example.com",
		Status: 1,
	}
	user3 := &users.User{
		Id:     user3ID.String(),
		Name:   "User3",
		Email:  "user3@example.com",
		Status: 2,
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, user1ID.String()).Return(user1, nil)
	mockUserModel.On("FindOne", mock.Anything, user2ID.String()).Return(user2, nil)
	mockUserModel.On("FindOne", mock.Anything, user3ID.String()).Return(user3, nil)
	mockUserModel.On("BatchUpdateStatus", mock.Anything, []string{user1ID.String(), user2ID.String(), user3ID.String()}, int8(2), (*string)(nil), (*string)(nil)).Return([]string{user1ID.String(), user2ID.String(), user3ID.String()}, []users.BatchUpdateError{}, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil).Times(3)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{user1ID.String(), user2ID.String(), user3ID.String()},
		Status:  2, // 停用
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 3, resp.SuccessCount)
	assert.Equal(t, 0, resp.FailedCount)
	assert.Len(t, resp.Errors, 0)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestBatchUpdateStatus_PartialFailure_ReturnsMixedResults 测试部分失败场景
func TestBatchUpdateStatus_PartialFailure_ReturnsMixedResults(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForBatchUpdate()

	// 准备测试数据
	user1ID, _ := uuid.NewV7()
	user2ID, _ := uuid.NewV7()
	nonExistentID, _ := uuid.NewV7()

	user1 := &users.User{
		Id:     user1ID.String(),
		Name:   "User1",
		Email:  "user1@example.com",
		Status: 1,
	}
	user2 := &users.User{
		Id:     user2ID.String(),
		Name:   "User2",
		Email:  "user2@example.com",
		Status: 1,
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, user1ID.String()).Return(user1, nil)
	mockUserModel.On("FindOne", mock.Anything, user2ID.String()).Return(user2, nil)
	mockUserModel.On("FindOne", mock.Anything, nonExistentID.String()).Return(nil, users.ErrUserNotFound)
	mockUserModel.On("BatchUpdateStatus", mock.Anything, []string{user1ID.String(), user2ID.String()}, int8(2), (*string)(nil), (*string)(nil)).Return([]string{user1ID.String(), user2ID.String()}, []users.BatchUpdateError{}, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil).Times(2)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{user1ID.String(), user2ID.String(), nonExistentID.String()},
		Status:  2,
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 2, resp.SuccessCount)
	assert.Equal(t, 1, resp.FailedCount)
	assert.Len(t, resp.Errors, 1)
	assert.Equal(t, nonExistentID.String(), resp.Errors[0].UserId)
	assert.Equal(t, "用户不存在", resp.Errors[0].Reason)

	mockUserModel.AssertExpectations(t)
}

// TestBatchUpdateStatus_SelfOperation_ReturnsError 测试自我操作限制
func TestBatchUpdateStatus_SelfOperation_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForBatchUpdate()

	// 准备测试数据
	operatorID, _ := uuid.NewV7()
	userID, _ := uuid.NewV7()

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	user := &users.User{
		Id:     userID.String(),
		Name:   "User",
		Email:  "user@example.com",
		Status: 1,
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(user, nil)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{operatorID.String(), userID.String()}, // 包含操作人自己的ID
		Status:  2,
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "不能操作自己的账号")

	mockUserModel.AssertExpectations(t)
}

// TestBatchUpdateStatus_LockStatus_RequiresReason 测试锁定原因必填验证
func TestBatchUpdateStatus_LockStatus_RequiresReason(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForBatchUpdate()

	// 准备测试数据
	userID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "User",
		Email:  "user@example.com",
		Status: 1,
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{userID.String()},
		Status:  3,  // 锁定状态
		Reason:  "", // 未提供锁定原因
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "锁定原因")

	mockUserModel.AssertExpectations(t)
}

// TestBatchUpdateStatus_LockStatus_WithReason_Succeeds 测试锁定状态提供原因时成功
func TestBatchUpdateStatus_LockStatus_WithReason_Succeeds(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForBatchUpdate()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	user := &users.User{
		Id:     userID.String(),
		Name:   "User",
		Email:  "user@example.com",
		Status: 1,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	lockReason := "违规操作"
	operatorIDStr := operatorID.String()

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("BatchUpdateStatus", mock.Anything, []string{userID.String()}, int8(3), &lockReason, &operatorIDStr).Return([]string{userID.String()}, []users.BatchUpdateError{}, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.AnythingOfType("*auditlogs.AuditLog")).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{userID.String()},
		Status:  3, // 锁定状态
		Reason:  lockReason,
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 1, resp.SuccessCount)
	assert.Equal(t, 0, resp.FailedCount)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestBatchUpdateStatus_InvalidParams_ReturnsError 测试参数校验场景
func TestBatchUpdateStatus_InvalidParams_ReturnsError(t *testing.T) {
	logic, _, _ := setupTestLogicForBatchUpdate()

	testCases := []struct {
		name string
		req  *types.BatchUpdateStatusReq
	}{
		{"空用户ID列表", &types.BatchUpdateStatusReq{UserIds: []string{}, Status: 2}},
		{"状态值无效-太小", &types.BatchUpdateStatusReq{UserIds: []string{"user1"}, Status: 0}},
		{"状态值无效-太大", &types.BatchUpdateStatusReq{UserIds: []string{"user1"}, Status: 5}},
		{"用户ID列表超过100", &types.BatchUpdateStatusReq{UserIds: make([]string, 101), Status: 2}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			resp, err := logic.BatchUpdateStatus(tc.req)

			assert.Error(t, err)
			assert.Nil(t, resp)
		})
	}
}

// TestBatchUpdateStatus_AuditLog_RecordsChanges 测试审计日志记录
func TestBatchUpdateStatus_AuditLog_RecordsChanges(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForBatchUpdate()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), "user_id", operatorID.String())
	logic.ctx = ctx

	user := &users.User{
		Id:     userID.String(),
		Name:   "User",
		Email:  "user@example.com",
		Status: 1,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("BatchUpdateStatus", mock.Anything, []string{userID.String()}, int8(2), (*string)(nil), (*string)(nil)).Return([]string{userID.String()}, []users.BatchUpdateError{}, nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)

	// 验证审计日志内容
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "batch_update_status" &&
			log.OperatorId == operatorID.String() &&
			log.Operator == operator.Name
	})).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.BatchUpdateStatusReq{
		UserIds: []string{userID.String()},
		Status:  2,
	}

	// 执行批量更新
	resp, err := logic.BatchUpdateStatus(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 1, resp.SuccessCount)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}
