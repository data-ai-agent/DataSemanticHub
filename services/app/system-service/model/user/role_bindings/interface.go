package rolebindings

import (
	"context"
)

// Model 角色绑定数据访问接口
type Model interface {
	// Insert 插入角色绑定
	Insert(ctx context.Context, data *RoleBinding) (*RoleBinding, error)

	// FindByUserId 根据用户ID查询角色绑定列表
	FindByUserId(ctx context.Context, userId string) ([]*RoleBinding, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id int64) (*RoleBinding, error)

	// Update 更新角色绑定
	Update(ctx context.Context, data *RoleBinding) error

	// Delete 删除角色绑定
	Delete(ctx context.Context, id int64) error

	// DeleteByUserId 根据用户ID删除所有角色绑定
	DeleteByUserId(ctx context.Context, userId string) error

	// WithTx 使用事务
	WithTx(tx interface{}) Model
}
