package orgaudit

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type gormDAO struct {
	db *gorm.DB
}

// NewModel 创建 OrgAudit Model 实例
func NewModel(db *gorm.DB) Model {
	return &gormDAO{db: db}
}

func (m *gormDAO) Insert(ctx context.Context, data *OrgAudit) (*OrgAudit, error) {
	// 生成 UUID v7
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("generate uuid failed: %w", err)
	}
	data.Id = id.String()

	if err := m.db.WithContext(ctx).Create(data).Error; err != nil {
		return nil, fmt.Errorf("create audit log failed: %w", err)
	}

	return data, nil
}

func (m *gormDAO) FindByOrgId(ctx context.Context, orgId string, limit int) ([]*OrgAudit, error) {
	if limit <= 0 {
		limit = DefaultQueryLimit
	}
	if limit > MaxQueryLimit {
		limit = MaxQueryLimit
	}

	var audits []*OrgAudit
	err := m.db.WithContext(ctx).
		Where("org_id = ?", orgId).
		Order("created_at DESC").
		Limit(limit).
		Find(&audits).Error

	if err != nil {
		return nil, fmt.Errorf("find audit logs by org_id failed: %w", err)
	}

	return audits, nil
}

func (m *gormDAO) FindByOperation(ctx context.Context, operation string, limit int) ([]*OrgAudit, error) {
	if limit <= 0 {
		limit = DefaultQueryLimit
	}
	if limit > MaxQueryLimit {
		limit = MaxQueryLimit
	}

	var audits []*OrgAudit
	err := m.db.WithContext(ctx).
		Where("operation = ?", operation).
		Order("created_at DESC").
		Limit(limit).
		Find(&audits).Error

	if err != nil {
		return nil, fmt.Errorf("find audit logs by operation failed: %w", err)
	}

	return audits, nil
}

func (m *gormDAO) FindByOperator(ctx context.Context, operatorId string, limit int) ([]*OrgAudit, error) {
	if limit <= 0 {
		limit = DefaultQueryLimit
	}
	if limit > MaxQueryLimit {
		limit = MaxQueryLimit
	}

	var audits []*OrgAudit
	err := m.db.WithContext(ctx).
		Where("operator_id = ?", operatorId).
		Order("created_at DESC").
		Limit(limit).
		Find(&audits).Error

	if err != nil {
		return nil, fmt.Errorf("find audit logs by operator failed: %w", err)
	}

	return audits, nil
}

func (m *gormDAO) FindRecent(ctx context.Context, limit int) ([]*OrgAudit, error) {
	if limit <= 0 {
		limit = DefaultQueryLimit
	}
	if limit > MaxQueryLimit {
		limit = MaxQueryLimit
	}

	var audits []*OrgAudit
	err := m.db.WithContext(ctx).
		Order("created_at DESC").
		Limit(limit).
		Find(&audits).Error

	if err != nil {
		return nil, fmt.Errorf("find recent audit logs failed: %w", err)
	}

	return audits, nil
}

func (m *gormDAO) WithTx(tx interface{}) Model {
	if db, ok := tx.(*gorm.DB); ok {
		return &gormDAO{db: db}
	}
	return m
}
