package auditlogs

import (
	"context"
)

// Model 审计日志数据访问接口
type Model interface {
	// Insert 插入审计日志
	Insert(ctx context.Context, data *AuditLog) (*AuditLog, error)

	// FindByUserId 根据用户ID查询审计日志列表（支持分页）
	FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*AuditLog, int64, error)

	// FindOne 根据 ID 查询
	FindOne(ctx context.Context, id int64) (*AuditLog, error)

	// WithTx 使用事务
	WithTx(tx interface{}) Model
}
