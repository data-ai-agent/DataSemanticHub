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
