package users

import (
	"context"
	"time"
)

// FindListReq 查询用户列表请求参数
type FindListReq struct {
	Page           int
	PageSize       int
	Keyword        string
	DeptId         string
	Status         *int8 // 使用指针以支持 0 值的筛选
	AccountSource  string
	PermissionRole string
	SortField      string // name, created_at, last_login_at
	SortOrder      string // asc, desc
}

// Model 用户数据访问接口
type Model interface {
	// Insert 插入用户
	Insert(ctx context.Context, data *User) (*User, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id string) (*User, error)

	// FindOneByEmail 根据邮箱查询（邮箱转小写）
	FindOneByEmail(ctx context.Context, email string) (*User, error)

	// FindOneByPhone 根据手机号查询
	FindOneByPhone(ctx context.Context, phone string) (*User, error)

	// FindList 查询用户列表（支持分页、筛选、排序）
	FindList(ctx context.Context, req *FindListReq) ([]*User, int64, error)

	// Update 更新用户
	Update(ctx context.Context, data *User) error

	// UpdateLastLoginAt 更新最后登录时间
	UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error

	// UpdateStatus 更新用户状态（支持锁定原因和时间记录）
	// id: 用户ID
	// status: 新状态值（1-启用，2-停用，3-锁定，4-归档）
	// lockReason: 锁定原因（当 status=3 时可选）
	// lockBy: 锁定操作人ID（当 status=3 时可选）
	UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error

	// BatchUpdateStatus 批量更新用户状态
	// userIds: 用户ID列表
	// status: 新状态值（1-启用，2-停用，3-锁定，4-归档）
	// lockReason: 锁定原因（当 status=3 时必填）
	// lockBy: 锁定操作人ID（当 status=3 时必填）
	// 返回：成功更新的用户ID列表和失败的用户ID及原因
	BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []BatchUpdateError, error)

	// GetStatistics 获取用户统计信息
	// 返回：总用户数、各状态用户数、无组织归属用户数、无权限角色用户数、近7天活跃率
	GetStatistics(ctx context.Context) (*Statistics, error)

	// Delete 删除用户（软删除）
	Delete(ctx context.Context, id string) error

	// WithTx 使用事务
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}

// BatchUpdateError 批量更新错误信息
type BatchUpdateError struct {
	UserId string
	Reason string
}

// Statistics 用户统计信息
type Statistics struct {
	Total            int64   // 总用户数
	Active           int64   // 启用状态用户数（status=1）
	Locked           int64   // 锁定状态用户数（status=3）
	Inactive         int64   // 停用状态用户数（status=2）
	NoOrgBinding     int64   // 无组织归属用户数（dept_id为空）
	NoPermissionRole int64   // 无权限角色用户数（无role_bindings或permission_role为空）
	RecentActiveRate float64 // 近7天活跃率（有last_login_at且在7天内的用户数/总用户数）
}
