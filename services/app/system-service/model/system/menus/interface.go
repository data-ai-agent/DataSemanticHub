package menus

import (
	"context"
)

// Model 菜单数据访问接口
type Model interface {
	// Insert 插入菜单
	Insert(ctx context.Context, data *Menu) (*Menu, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id string) (*Menu, error)

	// FindOneByCode 根据 code 查询（全局唯一）
	FindOneByCode(ctx context.Context, code string) (*Menu, error)

	// FindTree 查询菜单树（支持搜索和过滤）
	FindTree(ctx context.Context, req *FindTreeReq) ([]*Menu, error)

	// FindChildren 查询子菜单列表
	FindChildren(ctx context.Context, parentId string) ([]*Menu, error)

	// FindChildrenCount 查询子菜单数量
	FindChildrenCount(ctx context.Context, parentId string) (int64, error)

	// Update 更新菜单
	Update(ctx context.Context, data *Menu) error

	// UpdateEnabled 更新菜单启用状态
	UpdateEnabled(ctx context.Context, id string, enabled bool) error

	// UpdateVisible 更新菜单可见状态
	UpdateVisible(ctx context.Context, id string, visible bool) error

	// Delete 删除菜单（软删除）
	Delete(ctx context.Context, id string) error

	// UpdateOrder 更新排序（同级）
	UpdateOrder(ctx context.Context, id string, order int) error

	// BatchUpdateOrder 批量更新排序
	BatchUpdateOrder(ctx context.Context, updates []OrderUpdate) error

	// Move 移动菜单到新父级
	Move(ctx context.Context, id string, newParentId *string, newOrder int) error

	// CheckCycle 检查是否形成循环（父节点不能是自身或子孙）
	CheckCycle(ctx context.Context, id string, newParentId string) (bool, error)

	// FindByPath 根据 path 查询（用于冲突检测）
	FindByPath(ctx context.Context, path string) ([]*Menu, error)

	// GetStatistics 获取统计信息
	GetStatistics(ctx context.Context) (*Statistics, error)

	// WithTx 使用事务
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
