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

// 菜单管理错误码范围: 200130-200150

const (
	// 200130: 菜单名称必填
	ErrMenuNameRequired = 200130

	// 200131: 菜单编码已存在
	ErrMenuCodeExists = 200131

	// 200132: 菜单类型无效
	ErrMenuTypeInvalid = 200132

	// 200133: 路由路径必填（page/directory类型）
	ErrMenuPathRequired = 200133

	// 200134: 外部链接必填（external类型）
	ErrMenuExternalUrlRequired = 200134

	// 200135: 打开方式必填（external类型）
	ErrMenuOpenModeRequired = 200135

	// 200136: 父子关系形成循环
	ErrMenuCycleDetected = 200136

	// 200137: 同级排序值冲突
	ErrMenuOrderConflict = 200137

	// 200138: 菜单存在子节点，不能删除
	ErrMenuHasChildren = 200138

	// 200139: 移动菜单导致循环
	ErrMenuMoveCycle = 200139

	// 200140: 分组约束不满足（父子必须同组）
	ErrMenuGroupConstraint = 200140

	// 200141: 路由冲突（path/route_name已存在）
	ErrMenuRouteConflict = 200141

	// 200142: 菜单不存在
	ErrMenuNotFound = 200142

	// 200143: 权限服务调用失败
	ErrMenuPermissionServiceError = 200143

	// 200144: 权限创建失败
	ErrMenuPermissionCreateFailed = 200144

	// 200145: 菜单已删除
	ErrMenuDeleted = 200145
)
