package permission_template

import (
	"context"
)

// Model 权限模板数据访问接口
type Model interface {
	// Insert 插入权限模板
	Insert(ctx context.Context, data *PermissionTemplate) (*PermissionTemplate, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id string) (*PermissionTemplate, error)

	// FindOneByCode 根据 code 查询（全局唯一，未删除）
	FindOneByCode(ctx context.Context, code string) (*PermissionTemplate, error)

	// FindOneByCodeIncludingDeleted 根据 code 查询（包括已删除，用于唯一性校验）
	FindOneByCodeIncludingDeleted(ctx context.Context, code string) (*PermissionTemplate, error)

	// List 查询权限模板列表（支持筛选和分页）
	List(ctx context.Context, filter *ListFilter) ([]*PermissionTemplate, int64, error)

	// Count 统计符合条件的权限模板数量
	Count(ctx context.Context, filter *ListFilter) (int64, error)

	// Update 更新权限模板
	Update(ctx context.Context, data *PermissionTemplate) error

	// UpdateStatus 更新模板状态
	UpdateStatus(ctx context.Context, id string, status string) error

	// UpdateVersionWithStatus 更新版本号和状态（用于发布）
	UpdateVersionWithStatus(ctx context.Context, id string, version int, status string) error

	// Delete 删除权限模板（软删除）
	Delete(ctx context.Context, id string) error

	// GetUsageStats 获取模板使用统计（被角色引用数量）
	GetUsageStats(ctx context.Context, id string) (*UsageStats, error)

	// WithTx 使用事务
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
