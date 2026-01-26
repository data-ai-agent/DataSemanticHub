package orgaudit

import (
	"context"
)

// OrgAudit 组织架构审计日志实体
type OrgAudit struct {
	Id         string  `gorm:"primaryKey;size:36"`
	OrgId      string  `gorm:"size:36;not null;index:idx_org_id"`
	Operation  string  `gorm:"size:20;not null;index:idx_operation"`
	OperatorId string  `gorm:"size:36;not null"`
	OldValue   string  `gorm:"type:json"` // JSON formatted
	NewValue   string  `gorm:"type:json"` // JSON formatted
	CreatedAt  string  `gorm:"autoCreateTime;index:idx_created_at"`
}

// TableName 指定表名
func (OrgAudit) TableName() string {
	return "sys_organization_audit"
}

// Model 组织架构审计日志数据访问接口
type Model interface {
	// Insert 插入审计日志
	Insert(ctx context.Context, data *OrgAudit) (*OrgAudit, error)

	// FindByOrgId 查询指定组织的审计日志
	FindByOrgId(ctx context.Context, orgId string, limit int) ([]*OrgAudit, error)

	// FindByOperation 查询指定操作类型的审计日志
	FindByOperation(ctx context.Context, operation string, limit int) ([]*OrgAudit, error)

	// FindByOperator 查询指定操作人的审计日志
	FindByOperator(ctx context.Context, operatorId string, limit int) ([]*OrgAudit, error)

	// FindRecent 查询最近的审计日志
	FindRecent(ctx context.Context, limit int) ([]*OrgAudit, error)

	// WithTx 返回事务版本
	WithTx(tx interface{}) Model
}
