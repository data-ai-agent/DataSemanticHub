package errorx

// 用户认证错误码范围: 30100-30199

const (
	// 30100: 用户不存在
	ErrUserNotFound = 30100

	// 30101: 密码错误
	ErrPasswordIncorrect = 30101

	// 30102: 用户已禁用
	ErrUserDisabled = 30102

	// 30103: 邮箱已被注册
	ErrEmailExists = 30103

	// 30104: Token 无效或过期
	ErrTokenInvalid = 30104

	// 30105: 未授权访问
	ErrUnauthorized = 30105
)

// 用户管理错误码范围: 30200-30299

const (
	// 30200: 用户不存在
	ErrUserManagementUserNotFound = 30200

	// 30201: 邮箱已被使用
	ErrUserManagementEmailExists = 30201

	// 30202: 手机号已被使用
	ErrUserManagementPhoneExists = 30202

	// 30203: 用户状态不允许此操作
	ErrUserManagementInvalidStatus = 30203

	// 30204: 不能操作自己
	ErrUserManagementCannotOperateSelf = 30204

	// 30205: 用户是关键责任人，不能删除/停用
	ErrUserManagementKeyResponsible = 30205

	// 30206: 锁定原因必填
	ErrUserManagementLockReasonRequired = 30206

	// 30207: 仅本地账号支持密码重置
	ErrUserManagementOnlyLocalAccount = 30207

	// 30208: 批量操作部分失败
	ErrUserManagementBatchPartialFailure = 30208

	// 30209: 部门不存在
	ErrUserManagementDeptNotFound = 30209

	// 30210: 角色绑定不存在
	ErrUserManagementRoleBindingNotFound = 30210
)
