package user_management

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
)

// MockUserModelForDelete 是 users.Model 的 mock 实现
type MockUserModelForDelete struct {
	mock.Mock
}

func (m *MockUserModelForDelete) Insert(ctx context.Context, data *users.User) (*users.User, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForDelete) FindOne(ctx context.Context, id string) (*users.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForDelete) FindOneByEmail(ctx context.Context, email string) (*users.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForDelete) FindOneByPhone(ctx context.Context, phone string) (*users.User, error) {
	args := m.Called(ctx, phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.User), args.Error(1)
}

func (m *MockUserModelForDelete) FindList(ctx context.Context, req *users.FindListReq) ([]*users.User, int64, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*users.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserModelForDelete) Update(ctx context.Context, data *users.User) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockUserModelForDelete) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	args := m.Called(ctx, id, loginAt)
	return args.Error(0)
}

func (m *MockUserModelForDelete) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	args := m.Called(ctx, id, status, lockReason, lockBy)
	return args.Error(0)
}

func (m *MockUserModelForDelete) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []users.BatchUpdateError, error) {
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

func (m *MockUserModelForDelete) GetStatistics(ctx context.Context) (*users.Statistics, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*users.Statistics), args.Error(1)
}

func (m *MockUserModelForDelete) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserModelForDelete) WithTx(tx interface{}) users.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModelForDelete) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// MockAuditLogModelForDelete 是 auditlogs.Model 的 mock 实现
type MockAuditLogModelForDelete struct {
	mock.Mock
}

func (m *MockAuditLogModelForDelete) Insert(ctx context.Context, data *auditlogs.AuditLog) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForDelete) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*auditlogs.AuditLog, int64, error) {
	args := m.Called(ctx, userId, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*auditlogs.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditLogModelForDelete) FindOne(ctx context.Context, id int64) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModelForDelete) WithTx(tx interface{}) auditlogs.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(auditlogs.Model)
}

// setupTestLogicForDelete 创建测试用的 Logic 实例
func setupTestLogicForDelete() (*DeleteUserLogic, *MockUserModelForDelete, *MockAuditLogModelForDelete) {
	mockUserModel := new(MockUserModelForDelete)
	mockAuditLogModel := new(MockAuditLogModelForDelete)
	svcCtx := &svc.ServiceContext{
		Config:        config.Config{},
		UserModel:     mockUserModel,
		AuditLogModel: mockAuditLogModel,
	}
	logic := NewDeleteUserLogic(context.Background(), svcCtx)
	return logic, mockUserModel, mockAuditLogModel
}

// TestDeleteUser_ValidInput_ArchivesUser 测试正常删除场景（归档）
func TestDeleteUser_ValidInput_ArchivesUser(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForDelete()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 1, // 启用
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	changes := map[string]interface{}{
		"status": map[string]interface{}{"old": 1, "new": 4},
	}
	changesJSON, _ := json.Marshal(changes)
	auditLog := &auditlogs.AuditLog{
		Id:         1,
		UserId:     userID.String(),
		Action:     "delete",
		Operator:   operator.Name,
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(4), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "delete" &&
			log.OperatorId == operatorID.String()
	})).Return(auditLog, nil)

	req := &types.DeleteUserReq{}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Archived)
	assert.False(t, resp.ImpactsTransferred)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestDeleteUser_UserNotFound_ReturnsError 测试用户不存在场景
func TestDeleteUser_UserNotFound_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForDelete()

	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(&users.User{Id: operatorID.String()}, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(nil, users.ErrUserNotFound)

	req := &types.DeleteUserReq{}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	mockUserModel.AssertExpectations(t)
}

// TestDeleteUser_SelfOperation_ReturnsError 测试自我操作限制
func TestDeleteUser_SelfOperation_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForDelete()

	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:     operatorID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 1,
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(user, nil)

	req := &types.DeleteUserReq{}

	// 执行删除（尝试删除自己）
	resp, err := logic.DeleteUser(operatorID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "不能删除自己的账号")

	mockUserModel.AssertExpectations(t)
}

// TestDeleteUser_WithTransferTo_TransfersImpacts 测试责任转交场景
func TestDeleteUser_WithTransferTo_TransfersImpacts(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForDelete()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	transferToID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 1,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}
	transferToUser := &users.User{
		Id:     transferToID.String(),
		Name:   "Transfer To User",
		Email:  "transfer@example.com",
		Status: 1,
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	changes := map[string]interface{}{
		"status":      map[string]interface{}{"old": 1, "new": 4},
		"transfer_to": map[string]interface{}{"new": transferToID.String()},
	}
	changesJSON, _ := json.Marshal(changes)
	auditLog := &auditlogs.AuditLog{
		Id:         1,
		UserId:     userID.String(),
		Action:     "delete",
		Operator:   operator.Name,
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("FindOne", mock.Anything, transferToID.String()).Return(transferToUser, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(4), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "delete"
	})).Return(auditLog, nil)

	req := &types.DeleteUserReq{
		TransferTo: transferToID.String(),
	}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Archived)
	assert.True(t, resp.ImpactsTransferred)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestDeleteUser_InvalidTransferTo_ReturnsError 测试无效转交目标场景
func TestDeleteUser_InvalidTransferTo_ReturnsError(t *testing.T) {
	logic, mockUserModel, _ := setupTestLogicForDelete()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	nonExistentID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 1,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("FindOne", mock.Anything, nonExistentID.String()).Return(nil, users.ErrUserNotFound)

	req := &types.DeleteUserReq{
		TransferTo: nonExistentID.String(),
	}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	mockUserModel.AssertExpectations(t)
}

// TestDeleteUser_ForceDelete_DeletesPermanently 测试强制删除场景
func TestDeleteUser_ForceDelete_DeletesPermanently(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForDelete()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 1,
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	changes := map[string]interface{}{
		"status":       map[string]interface{}{"old": 1, "new": 4},
		"force_delete": map[string]interface{}{"new": true},
	}
	changesJSON, _ := json.Marshal(changes)
	auditLog := &auditlogs.AuditLog{
		Id:         1,
		UserId:     userID.String(),
		Action:     "delete",
		Operator:   operator.Name,
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(4), (*string)(nil), (*string)(nil)).Return(nil)
	mockUserModel.On("Delete", mock.Anything, userID.String()).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		return log.UserId == userID.String() &&
			log.Action == "delete"
	})).Return(auditLog, nil)

	req := &types.DeleteUserReq{
		Force: true,
	}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.False(t, resp.Archived) // 强制删除不是归档

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestDeleteUser_EmptyUserId_ReturnsError 测试空用户ID场景
func TestDeleteUser_EmptyUserId_ReturnsError(t *testing.T) {
	logic, _, _ := setupTestLogicForDelete()

	req := &types.DeleteUserReq{}

	// 执行删除
	resp, err := logic.DeleteUser("", req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")
}

// TestDeleteUser_AuditLog_RecordsChanges 测试审计日志记录
func TestDeleteUser_AuditLog_RecordsChanges(t *testing.T) {
	logic, mockUserModel, mockAuditLogModel := setupTestLogicForDelete()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	user := &users.User{
		Id:     userID.String(),
		Name:   "Test User",
		Email:  "test@example.com",
		Status: 2, // 停用
	}
	operator := &users.User{
		Id:   operatorID.String(),
		Name: "Operator",
	}

	// 设置 context 中的操作人ID
	ctx := context.WithValue(context.Background(), contextkeys.UserIDKey, operatorID.String())
	logic.ctx = ctx

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, operatorID.String()).Return(operator, nil)
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockUserModel.On("UpdateStatus", mock.Anything, userID.String(), int8(4), (*string)(nil), (*string)(nil)).Return(nil)
	mockAuditLogModel.On("WithTx", mock.Anything).Return(mockAuditLogModel)

	// 验证审计日志内容
	mockAuditLogModel.On("Insert", mock.Anything, mock.MatchedBy(func(log *auditlogs.AuditLog) bool {
		// 验证审计日志的关键字段
		if log.UserId != userID.String() || log.Action != "delete" || log.OperatorId != operatorID.String() {
			return false
		}

		// 验证变更内容
		var changes map[string]interface{}
		if err := json.Unmarshal([]byte(log.Changes), &changes); err != nil {
			return false
		}

		// 验证状态变更
		if statusChange, ok := changes["status"].(map[string]interface{}); ok {
			if statusChange["old"] != float64(2) || statusChange["new"] != float64(4) {
				return false
			}
		} else {
			return false
		}

		return true
	})).Return(&auditlogs.AuditLog{Id: 1}, nil)

	req := &types.DeleteUserReq{}

	// 执行删除
	resp, err := logic.DeleteUser(userID.String(), req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	mockUserModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}
