package errorx

// 通用常量
const (
	// AccountSourceLocal: 本地账号
	AccountSourceLocal = "local"

	// SystemOperator: 系统操作者
	SystemOperatorName = "System"
	SystemOperatorID   = "system"
)

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

// 组织架构错误码范围: 200100-200129
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

// 权限模板错误码范围: 200151-200175

const (
	// 200151: 模板名称或编码为空
	ErrPermissionTemplateNameOrCodeRequired = 200151

	// 200152: 模板编码已存在
	ErrPermissionTemplateCodeExists = 200152

	// 200153: 策略矩阵不能为空
	ErrPermissionTemplatePolicyMatrixRequired = 200153

	// 200154: 只有草稿状态可编辑
	ErrPermissionTemplateOnlyDraftEditable = 200154

	// 200155: 只有草稿状态可发布
	ErrPermissionTemplateOnlyDraftPublishable = 200155

	// 200156: 只有已发布状态可停用
	ErrPermissionTemplateOnlyPublishedDisablable = 200156

	// 200157: 只有已停用状态可重新启用
	ErrPermissionTemplateOnlyDisabledEnablable = 200157

	// 200158: 模板被角色引用，无法删除
	ErrPermissionTemplateReferencedByRoles = 200158

	// 200159: 模板不存在
	ErrPermissionTemplateNotFound = 200159

	// 200160: 权限不足
	ErrPermissionTemplateInsufficientPermission = 200160

	// 200161: 模板名称长度超限
	ErrPermissionTemplateNameTooLong = 200161

	// 200162: 模板描述长度超限
	ErrPermissionTemplateDescriptionTooLong = 200162

	// 200163: 适用范围枚举值无效
	ErrPermissionTemplateInvalidScope = 200163

	// 200164: 并发编辑冲突
	ErrPermissionTemplateConcurrentEdit = 200164

	// 200165: 模板版本冲突
	ErrPermissionTemplateVersionConflict = 200165

	// 200166: 模板已被停用，不可用于创建角色
	ErrPermissionTemplateDisabledNotUsable = 200166

	// 200167: 策略矩阵格式错误
	ErrPermissionTemplateInvalidPolicyMatrix = 200167

	// 200168: 高级权限点格式错误
	ErrPermissionTemplateInvalidAdvancedPerms = 200168

	// 200169: 模板编码格式错误
	ErrPermissionTemplateInvalidCodeFormat = 200169

	// 200170: 模板已被引用，禁止删除
	ErrPermissionTemplateAlreadyReferenced = 200170

	// 200171: 模板使用统计查询失败
	ErrPermissionTemplateUsageStatsFailed = 200171

	// 200172: 模板复制失败
	ErrPermissionTemplateCloneFailed = 200172

	// 200173: 模板发布失败
	ErrPermissionTemplatePublishFailed = 200173

	// 200174: 模板停用失败
	ErrPermissionTemplateDisableFailed = 200174

	// 200175: 模板重新启用失败
	ErrPermissionTemplateEnableFailed = 200175
)
