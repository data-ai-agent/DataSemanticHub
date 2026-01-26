package user_management

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
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
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(users.Model)
}

func (m *MockUserModel) Trans(ctx context.Context, fn func(ctx context.Context, model users.Model) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}

// MockRoleBindingModel 是 rolebindings.Model 的 mock 实现
type MockRoleBindingModel struct {
	mock.Mock
}

func (m *MockRoleBindingModel) Insert(ctx context.Context, data *rolebindings.RoleBinding) (*rolebindings.RoleBinding, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*rolebindings.RoleBinding), args.Error(1)
}

func (m *MockRoleBindingModel) FindByUserId(ctx context.Context, userId string) ([]*rolebindings.RoleBinding, error) {
	args := m.Called(ctx, userId)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*rolebindings.RoleBinding), args.Error(1)
}

func (m *MockRoleBindingModel) FindOne(ctx context.Context, id int64) (*rolebindings.RoleBinding, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*rolebindings.RoleBinding), args.Error(1)
}

func (m *MockRoleBindingModel) Update(ctx context.Context, data *rolebindings.RoleBinding) error {
	args := m.Called(ctx, data)
	return args.Error(0)
}

func (m *MockRoleBindingModel) Delete(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRoleBindingModel) DeleteByUserId(ctx context.Context, userId string) error {
	args := m.Called(ctx, userId)
	return args.Error(0)
}

func (m *MockRoleBindingModel) WithTx(tx interface{}) rolebindings.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(rolebindings.Model)
}

// MockAuditLogModel 是 auditlogs.Model 的 mock 实现
type MockAuditLogModel struct {
	mock.Mock
}

func (m *MockAuditLogModel) Insert(ctx context.Context, data *auditlogs.AuditLog) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, data)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModel) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*auditlogs.AuditLog, int64, error) {
	args := m.Called(ctx, userId, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*auditlogs.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAuditLogModel) FindOne(ctx context.Context, id int64) (*auditlogs.AuditLog, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*auditlogs.AuditLog), args.Error(1)
}

func (m *MockAuditLogModel) WithTx(tx interface{}) auditlogs.Model {
	args := m.Called(tx)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(auditlogs.Model)
}

// setupTestLogic 创建测试用的 Logic 实例
func setupTestLogic() (*GetUserLogic, *MockUserModel, *MockRoleBindingModel, *MockAuditLogModel) {
	mockUserModel := new(MockUserModel)
	mockRoleBindingModel := new(MockRoleBindingModel)
	mockAuditLogModel := new(MockAuditLogModel)
	svcCtx := &svc.ServiceContext{
		Config:           config.Config{},
		UserModel:        mockUserModel,
		RoleBindingModel: mockRoleBindingModel,
		AuditLogModel:    mockAuditLogModel,
	}
	logic := NewGetUserLogic(context.Background(), svcCtx)
	return logic, mockUserModel, mockRoleBindingModel, mockAuditLogModel
}

// TestGetUser_ValidUserId_ReturnsUserDetails 测试正常查询场景
func TestGetUser_ValidUserId_ReturnsUserDetails(t *testing.T) {
	logic, mockUserModel, mockRoleBindingModel, mockAuditLogModel := setupTestLogic()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()
	phone := "13800138000"
	deptId := "dept-001"

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "John",
		LastName:      "Doe",
		Name:          "John Doe",
		Email:         "john.doe@example.com",
		Phone:         &phone,
		DeptId:        &deptId,
		PasswordHash:  string(passwordHash),
		Status:        1,
		AccountSource: "local",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	position := "Manager"
	permissionRole := "admin"
	roleBindings := []*rolebindings.RoleBinding{
		{
			Id:             1,
			UserId:         userID.String(),
			OrgId:          "org-001",
			Position:       &position,
			PermissionRole: &permissionRole,
		},
	}

	operatorID, _ := uuid.NewV7()
	changes := map[string]interface{}{"status": map[string]interface{}{"old": 0, "new": 1}}
	changesJSON, _ := json.Marshal(changes)
	auditLogs := []*auditlogs.AuditLog{
		{
			Id:         1,
			UserId:     userID.String(),
			Action:     "create",
			Operator:   "Admin User",
			OperatorId: operatorID.String(),
			Changes:    datatypes.JSON(changesJSON),
			Timestamp:  now,
		},
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockRoleBindingModel.On("FindByUserId", mock.Anything, userID.String()).Return(roleBindings, nil)
	mockAuditLogModel.On("FindByUserId", mock.Anything, userID.String(), 1, 10).Return(auditLogs, int64(1), nil)

	// 执行查询
	resp, err := logic.GetUser(userID.String())

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, userID.String(), resp.User.Id)
	assert.Equal(t, "John Doe", resp.User.Name)
	assert.Equal(t, "john.doe@example.com", resp.User.Email)
	assert.Len(t, resp.RoleBindings, 1)
	assert.Equal(t, "org-001", resp.RoleBindings[0].OrgId)
	assert.Len(t, resp.AuditLogs, 1)
	assert.Equal(t, "create", resp.AuditLogs[0].Action)

	mockUserModel.AssertExpectations(t)
	mockRoleBindingModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestGetUser_UserNotFound_ReturnsError 测试用户不存在场景
func TestGetUser_UserNotFound_ReturnsError(t *testing.T) {
	logic, mockUserModel, _, _ := setupTestLogic()

	// 准备测试数据
	userID, _ := uuid.NewV7()

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(nil, users.ErrUserNotFound)

	// 执行查询
	resp, err := logic.GetUser(userID.String())

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")

	mockUserModel.AssertExpectations(t)
}

// TestGetUser_EmptyRoleBindingsAndAuditLogs_ReturnsEmptyLists 测试空角色绑定和审计日志场景
func TestGetUser_EmptyRoleBindingsAndAuditLogs_ReturnsEmptyLists(t *testing.T) {
	logic, mockUserModel, mockRoleBindingModel, mockAuditLogModel := setupTestLogic()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	user := &users.User{
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
	}

	// 设置 mock 期望
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockRoleBindingModel.On("FindByUserId", mock.Anything, userID.String()).Return([]*rolebindings.RoleBinding{}, nil)
	mockAuditLogModel.On("FindByUserId", mock.Anything, userID.String(), 1, 10).Return([]*auditlogs.AuditLog{}, int64(0), nil)

	// 执行查询
	resp, err := logic.GetUser(userID.String())

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, userID.String(), resp.User.Id)
	assert.NotNil(t, resp.RoleBindings)
	assert.Len(t, resp.RoleBindings, 0)
	assert.NotNil(t, resp.AuditLogs)
	assert.Len(t, resp.AuditLogs, 0)

	mockUserModel.AssertExpectations(t)
	mockRoleBindingModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}

// TestGetUser_EmptyUserId_ReturnsError 测试空用户ID场景
func TestGetUser_EmptyUserId_ReturnsError(t *testing.T) {
	logic, _, _, _ := setupTestLogic()

	// 执行查询
	resp, err := logic.GetUser("")

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "用户不存在")
}

// TestGetUser_RoleBindingQueryFails_ReturnsUserWithEmptyRoleBindings 测试角色绑定查询失败时返回空列表
func TestGetUser_RoleBindingQueryFails_ReturnsUserWithEmptyRoleBindings(t *testing.T) {
	logic, mockUserModel, mockRoleBindingModel, mockAuditLogModel := setupTestLogic()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	now := time.Now()

	user := &users.User{
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
	}

	// 设置 mock 期望 - 角色绑定查询失败
	mockUserModel.On("FindOne", mock.Anything, userID.String()).Return(user, nil)
	mockRoleBindingModel.On("FindByUserId", mock.Anything, userID.String()).Return(nil, assert.AnError)
	mockAuditLogModel.On("FindByUserId", mock.Anything, userID.String(), 1, 10).Return([]*auditlogs.AuditLog{}, int64(0), nil)

	// 执行查询
	resp, err := logic.GetUser(userID.String())

	// 验证结果 - 应该成功，但角色绑定为空
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, userID.String(), resp.User.Id)
	assert.NotNil(t, resp.RoleBindings)
	assert.Len(t, resp.RoleBindings, 0)

	mockUserModel.AssertExpectations(t)
	mockRoleBindingModel.AssertExpectations(t)
	mockAuditLogModel.AssertExpectations(t)
}
