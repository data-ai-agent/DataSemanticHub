package menu_audit_logs

import (
	"context"
)

// Model 菜单审计日志数据访问接口
type Model interface {
	// Insert 插入审计日志
	Insert(ctx context.Context, data *MenuAuditLog) (*MenuAuditLog, error)

	// FindList 查询审计日志列表（支持分页和筛选）
	FindList(ctx context.Context, req *FindListReq) ([]*MenuAuditLog, int64, error)

	// FindLatestByMenuId 查询菜单最近一次操作
	FindLatestByMenuId(ctx context.Context, menuId string) (*MenuAuditLog, error)

	// WithTx 使用事务
	WithTx(tx interface{}) Model
}
