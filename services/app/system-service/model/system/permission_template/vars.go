package permission_template

import (
	"github.com/jinguoxing/idrm-go-base/errorx"
)

var (
	// ErrPermissionTemplateNotFound 权限模板不存在
	ErrPermissionTemplateNotFound = errorx.New(200154, "权限模板不存在")

	// ErrPermissionTemplateCodeExists 权限模板编码已存在
	ErrPermissionTemplateCodeExists = errorx.New(200152, "权限模板编码已存在")

	// ErrPermissionTemplateNameOrCodeRequired 模板名称和编码必填
	ErrPermissionTemplateNameOrCodeRequired = errorx.New(200151, "模板名称和编码必填")

	// ErrPermissionTemplatePolicyMatrixRequired 策略矩阵必填
	ErrPermissionTemplatePolicyMatrixRequired = errorx.New(200153, "策略矩阵必填")

	// ErrPermissionTemplateInvalidStatus 无效的模板状态
	ErrPermissionTemplateInvalidStatus = errorx.New(200155, "无效的模板状态")

	// ErrPermissionTemplateNotDraft 模板不是草稿状态
	ErrPermissionTemplateNotDraft = errorx.New(200156, "只有草稿状态的模板可以编辑")

	// ErrPermissionTemplateNotPublished 模板不是已发布状态
	ErrPermissionTemplateNotPublished = errorx.New(200157, "只有已发布的模板可以停用")

	// ErrPermissionTemplateNotDisabled 模板不是已停用状态
	ErrPermissionTemplateNotDisabled = errorx.New(200158, "只有已停用的模板可以重新启用")

	// ErrPermissionTemplateInUse 模板正在被使用，无法删除
	ErrPermissionTemplateInUse = errorx.New(200159, "模板正在被角色引用，无法删除")

	// ErrPermissionTemplateEmptyPolicyMatrix 策略矩阵为空，无法发布
	ErrPermissionTemplateEmptyPolicyMatrix = errorx.New(200160, "策略矩阵为空，无法发布")

	// ErrPermissionTemplateUpdateFailed 更新权限模板失败
	ErrPermissionTemplateUpdateFailed = errorx.New(200161, "更新权限模板失败")

	// ErrPermissionTemplateDeleteFailed 删除权限模板失败
	ErrPermissionTemplateDeleteFailed = errorx.New(200162, "删除权限模板失败")

	// ErrPermissionTemplateCreateFailed 创建权限模板失败
	ErrPermissionTemplateCreateFailed = errorx.New(200163, "创建权限模板失败")

	// ErrPermissionTemplateStatusTransitionInvalid 无效的状态流转
	ErrPermissionTemplateStatusTransitionInvalid = errorx.New(200164, "无效的状态流转")
)

const (
	// StatusDraft 草稿状态
	StatusDraft = "draft"
	// StatusPublished 已发布状态
	StatusPublished = "published"
	// StatusDisabled 已停用状态
	StatusDisabled = "disabled"
)

// ScopeSuggestion 适用范围常量
const (
	ScopeGlobal        = "global"
	ScopeOrganization  = "organization"
	ScopeDomain        = "domain"
	ScopeProject       = "project"
)

// ListFilter 查询权限模板列表请求参数
type ListFilter struct {
	Keyword         string // 搜索关键词（name/code）
	Status          string // 状态筛选：draft/published/disabled
	ScopeSuggestion string // 适用范围筛选：global/organization/domain/project
	Page            int    // 页码（从1开始）
	PageSize        int    // 每页数量
}
