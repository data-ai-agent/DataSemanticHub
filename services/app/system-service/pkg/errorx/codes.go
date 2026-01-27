package errorx

import "fmt"

// Error 自定义错误类型
type Error struct {
	Code    int
	Message string
}

// Error 实现 error 接口
func (e *Error) Error() string {
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// NewWithCode 根据错误码创建错误
func NewWithCode(code int) *Error {
	return &Error{
		Code:    code,
		Message: getErrorMessage(code),
	}
}

// New 创建带自定义消息的错误
func New(code int, message string) *Error {
	return &Error{
		Code:    code,
		Message: message,
	}
}

// getErrorMessage 根据错误码获取默认错误消息
func getErrorMessage(code int) string {
	messages := map[int]string{
		// 用户认证错误 (30100-30199)
		ErrUserNotFound:      "用户不存在",
		ErrPasswordIncorrect: "密码错误",
		ErrUserDisabled:      "用户已禁用",
		ErrEmailExists:       "邮箱已被注册",
		ErrTokenInvalid:      "Token 无效或过期",
		ErrUnauthorized:      "未授权访问",

		// 用户管理错误 (30200-30299)
		ErrUserManagementUserNotFound:        "用户不存在",
		ErrUserManagementEmailExists:         "邮箱已被使用",
		ErrUserManagementPhoneExists:         "手机号已被使用",
		ErrUserManagementInvalidStatus:       "用户状态不允许此操作",
		ErrUserManagementCannotOperateSelf:   "不能操作自己",
		ErrUserManagementKeyResponsible:      "用户是关键责任人，不能删除/停用",
		ErrUserManagementLockReasonRequired:  "锁定原因必填",
		ErrUserManagementOnlyLocalAccount:    "仅本地账号支持密码重置",
		ErrUserManagementBatchPartialFailure: "批量操作部分失败",
		ErrUserManagementDeptNotFound:        "部门不存在",
		ErrUserManagementRoleBindingNotFound: "角色绑定不存在",

		// 组织架构错误 (200100-200150)
		ErrCodeOrgParamInvalid:      "参数校验失败",
		ErrCodeOrgParentNotFound:    "父节点不存在",
		ErrCodeOrgNameDuplicate:     "同级名称重复",
		ErrCodeOrgHasChildren:       "存在子节点，无法删除",
		ErrCodeOrgHasUsers:          "存在关联用户，无法删除",
		ErrCodeOrgMoveCycle:         "移动操作会形成环路",
		ErrCodeOrgHasActiveChildren: "存在启用状态子节点",
		ErrCodeOrgNotFound:          "部门不存在",
		ErrCodeOrgRootDelete:        "根节点不允许删除",
		ErrCodeOrgPrimaryInvalid:    "主部门无效",
		ErrCodeOrgAuxDuplicate:      "辅助部门已存在",
	}

	if msg, ok := messages[code]; ok {
		return msg
	}
	return "未知错误"
}

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

// 组织架构错误码范围: 200100-200150

const (
	// 200101: 参数校验失败
	ErrCodeOrgParamInvalid = 200101

	// 200102: 父节点不存在
	ErrCodeOrgParentNotFound = 200102

	// 200103: 同级名称重复
	ErrCodeOrgNameDuplicate = 200103

	// 200104: 存在子节点
	ErrCodeOrgHasChildren = 200104

	// 200105: 存在关联用户
	ErrCodeOrgHasUsers = 200105

	// 200106: 移动形成环路
	ErrCodeOrgMoveCycle = 200106

	// 200107: 存在启用状态子节点
	ErrCodeOrgHasActiveChildren = 200107

	// 200108: 部门不存在
	ErrCodeOrgNotFound = 200108

	// 200109: 根节点不允许删除
	ErrCodeOrgRootDelete = 200109

	// 200110: 主部门无效
	ErrCodeOrgPrimaryInvalid = 200110

	// 200111: 辅助部门重复
	ErrCodeOrgAuxDuplicate = 200111
)
