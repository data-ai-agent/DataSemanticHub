package users

import (
	"context"
	"time"
)

// Model 用户数据访问接口
type Model interface {
	// Insert 插入用户
	Insert(ctx context.Context, data *User) (*User, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id string) (*User, error)

	// FindOneByEmail 根据邮箱查询（邮箱转小写）
	FindOneByEmail(ctx context.Context, email string) (*User, error)

	// Update 更新用户
	Update(ctx context.Context, data *User) error

	// UpdateLastLoginAt 更新最后登录时间
	UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error

	// Delete 删除用户（软删除）
	Delete(ctx context.Context, id string) error

	// WithTx 使用事务
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
