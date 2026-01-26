package user

import (
	"context"
	"testing"

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

// setupTestRegisterLogic 创建测试用的 RegisterLogic
func setupTestRegisterLogic(mockModel *MockUserModel) (*RegisterLogic, *svc.ServiceContext) {
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

	logic := NewRegisterLogic(context.Background(), svcCtx)
	return logic, svcCtx
}

// TestRegister_ValidInput_ReturnsUser 测试正常注册流程（AC-01）
func TestRegister_ValidInput_ReturnsUser(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "John",
		LastName:      "Doe",
		Name:          "John Doe",
		Email:         "john.doe@example.com",
		Organization:  "Test Org",
		PasswordHash:  string(passwordHash),
		Status:        0,       // 未激活
		AccountSource: "local", // 本地注册
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		return u.FirstName == "John" && u.LastName == "Doe" && u.Email == "john.doe@example.com" &&
			u.Status == 0 && u.AccountSource == "local" && u.Name == "John Doe"
	})).Return(user, nil)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Organization:    "Test Org",
		Password:        password,
		ConfirmPassword: password,
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, userID.String(), resp.Id)
	assert.Equal(t, "John", resp.FirstName)
	assert.Equal(t, "Doe", resp.LastName)
	assert.Equal(t, "john.doe@example.com", resp.Email)
	assert.NotEmpty(t, resp.Token)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestRegister_EmailExists_ReturnsError 测试邮箱已存在（AC-10）
func TestRegister_EmailExists_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据（已存在的用户）
	existingUserID, _ := uuid.NewV7()
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)

	existingUser := &users.User{
		Id:            existingUserID.String(),
		FirstName:     "Existing",
		LastName:      "User",
		Name:          "Existing User",
		Email:         "existing@example.com",
		PasswordHash:  string(passwordHash),
		Status:        1,
		AccountSource: "local",
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "existing@example.com").Return(existingUser, nil)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "existing@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "该邮箱已被注册")

	// 验证 mock 调用（不应该调用 Insert）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_MissingFirstName_ReturnsError 测试必填字段缺失（AC-11）
func TestRegister_MissingFirstName_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（缺少名）
	req := &types.RegisterReq{
		FirstName:       "",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "名不能为空")

	// 验证 mock 未被调用
	mockModel.AssertNotCalled(t, "FindOneByEmail", mock.Anything, mock.Anything)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_MissingLastName_ReturnsError 测试必填字段缺失（AC-11）
func TestRegister_MissingLastName_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（缺少姓）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "",
		Email:           "john.doe@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "姓不能为空")
}

// TestRegister_MissingEmail_ReturnsError 测试必填字段缺失（AC-11）
func TestRegister_MissingEmail_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（缺少邮箱）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "邮箱不能为空")
}

// TestRegister_MissingPassword_ReturnsError 测试必填字段缺失（AC-11）
func TestRegister_MissingPassword_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（缺少密码）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码不能为空")
}

// TestRegister_InvalidEmailFormat_ReturnsError 测试邮箱格式错误（AC-12）
func TestRegister_InvalidEmailFormat_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	testCases := []struct {
		name  string
		email string
	}{
		{"缺少@符号", "invalidemail.com"},
		{"缺少域名", "invalid@"},
		{"缺少顶级域名", "invalid@example"},
		{"包含空格", "invalid @example.com"},
		{"多个@符号", "invalid@@example.com"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := &types.RegisterReq{
				FirstName:       "John",
				LastName:        "Doe",
				Email:           tc.email,
				Password:        "password123",
				ConfirmPassword: "password123",
				AgreeTerms:      true,
			}

			resp, err := logic.Register(req)

			// 验证结果
			require.Error(t, err)
			assert.Nil(t, resp)
			assert.Contains(t, err.Error(), "邮箱格式不正确")
		})
	}
}

// TestRegister_PasswordMismatch_ReturnsError 测试密码不一致（AC-13）
func TestRegister_PasswordMismatch_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（密码不一致）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "password123",
		ConfirmPassword: "password456",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "两次输入的密码不一致")

	// 验证 mock 未被调用
	mockModel.AssertNotCalled(t, "FindOneByEmail", mock.Anything, mock.Anything)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_TermsNotAgreed_ReturnsError 测试未同意条款（AC-14）
func TestRegister_TermsNotAgreed_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 执行注册（未同意条款）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      false,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "请同意服务条款与隐私政策")

	// 验证 mock 未被调用
	mockModel.AssertNotCalled(t, "FindOneByEmail", mock.Anything, mock.Anything)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_PasswordTooShort_ReturnsError 测试密码复杂度不足（BR-03）
func TestRegister_PasswordTooShort_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 设置 mock 期望：邮箱不存在（因为代码会先检查邮箱唯一性）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)

	// 执行注册（密码太短）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "pass1",
		ConfirmPassword: "pass1",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码长度必须在8-128字符之间")

	// 验证 mock 调用（不应该调用 Insert）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_PasswordTooLong_ReturnsError 测试密码复杂度不足（BR-03）
func TestRegister_PasswordTooLong_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 设置 mock 期望：邮箱不存在（因为代码会先检查邮箱唯一性）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)

	// 执行注册（密码太长）
	longPassword := make([]byte, 129)
	for i := range longPassword {
		longPassword[i] = 'a'
	}

	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        string(longPassword),
		ConfirmPassword: string(longPassword),
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码长度必须在8-128字符之间")

	// 验证 mock 调用（不应该调用 Insert）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_PasswordNoLetter_ReturnsError 测试密码复杂度不足（BR-03）
func TestRegister_PasswordNoLetter_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 设置 mock 期望：邮箱不存在（因为代码会先检查邮箱唯一性）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)

	// 执行注册（密码只有数字，没有字母）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "12345678",
		ConfirmPassword: "12345678",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码必须包含字母和数字")

	// 验证 mock 调用（不应该调用 Insert）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_PasswordNoDigit_ReturnsError 测试密码复杂度不足（BR-03）
func TestRegister_PasswordNoDigit_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 设置 mock 期望：邮箱不存在（因为代码会先检查邮箱唯一性）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)

	// 执行注册（密码只有字母，没有数字）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "password",
		ConfirmPassword: "password",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "密码必须包含字母和数字")

	// 验证 mock 调用（不应该调用 Insert）
	mockModel.AssertExpectations(t)
	mockModel.AssertNotCalled(t, "Insert", mock.Anything, mock.Anything)
}

// TestRegister_EmailCaseInsensitive_Works 测试邮箱大小写不敏感
func TestRegister_EmailCaseInsensitive_Works(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "John",
		LastName:      "Doe",
		Name:          "John Doe",
		Email:         "john.doe@example.com", // 小写存储
		PasswordHash:  string(passwordHash),
		Status:        0,
		AccountSource: "local",
	}

	// 设置 mock 期望（邮箱会被转小写）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		return u.Email == "john.doe@example.com" // 应该转小写
	})).Return(user, nil)

	// 执行注册（使用大写邮箱）
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "JOHN.DOE@EXAMPLE.COM",
		Password:        password,
		ConfirmPassword: password,
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "john.doe@example.com", resp.Email) // 应该返回小写邮箱

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestRegister_StatusIsInactive_OnRegistration 测试注册用户状态为"未激活"（T120）
func TestRegister_StatusIsInactive_OnRegistration(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "Jane",
		LastName:      "Smith",
		Name:          "Jane Smith",
		Email:         "jane.smith@example.com",
		PasswordHash:  string(passwordHash),
		Status:        0,       // 未激活
		AccountSource: "local", // 本地注册
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "jane.smith@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		// 验证状态为未激活
		return u.Status == 0
	})).Return(user, nil)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "Jane",
		LastName:        "Smith",
		Email:           "jane.smith@example.com",
		Password:        password,
		ConfirmPassword: password,
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestRegister_AccountSourceIsLocal_OnRegistration 测试注册用户账号来源为"local"（T120）
func TestRegister_AccountSourceIsLocal_OnRegistration(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "Bob",
		LastName:      "Johnson",
		Name:          "Bob Johnson",
		Email:         "bob.johnson@example.com",
		PasswordHash:  string(passwordHash),
		Status:        0,
		AccountSource: "local", // 本地注册
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "bob.johnson@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		// 验证账号来源为 local
		return u.AccountSource == "local"
	})).Return(user, nil)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "Bob",
		LastName:        "Johnson",
		Email:           "bob.johnson@example.com",
		Password:        password,
		ConfirmPassword: password,
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestRegister_NameFieldIsSet_OnRegistration 测试Name字段设置正确（T120）
func TestRegister_NameFieldIsSet_OnRegistration(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 准备测试数据
	userID, _ := uuid.NewV7()
	password := "password123"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(password), 10)

	user := &users.User{
		Id:            userID.String(),
		FirstName:     "Alice",
		LastName:      "Williams",
		Name:          "Alice Williams", // 合并的完整姓名
		Email:         "alice.williams@example.com",
		PasswordHash:  string(passwordHash),
		Status:        0,
		AccountSource: "local",
	}

	// 设置 mock 期望
	mockModel.On("FindOneByEmail", mock.Anything, "alice.williams@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.MatchedBy(func(u *users.User) bool {
		// 验证 Name 字段是 FirstName + " " + LastName
		expectedName := u.FirstName + " " + u.LastName
		return u.Name == expectedName
	})).Return(user, nil)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "Alice",
		LastName:        "Williams",
		Email:           "alice.williams@example.com",
		Password:        password,
		ConfirmPassword: password,
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}

// TestRegister_ModelInsertError_ReturnsError 测试 Model 层插入错误
func TestRegister_ModelInsertError_ReturnsError(t *testing.T) {
	mockModel := new(MockUserModel)
	logic, _ := setupTestRegisterLogic(mockModel)

	// 设置 mock 期望（FindOneByEmail 返回不存在，但 Insert 返回邮箱已存在错误）
	mockModel.On("FindOneByEmail", mock.Anything, "john.doe@example.com").Return(nil, users.ErrUserNotFound)
	mockModel.On("Insert", mock.Anything, mock.Anything).Return(nil, users.ErrEmailExists)

	// 执行注册
	req := &types.RegisterReq{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		AgreeTerms:      true,
	}

	resp, err := logic.Register(req)

	// 验证结果
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "该邮箱已被注册")

	// 验证 mock 调用
	mockModel.AssertExpectations(t)
}
