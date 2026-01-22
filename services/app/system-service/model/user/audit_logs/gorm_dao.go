package auditlogs

import (
	"context"

	"gorm.io/gorm"
)

// Insert 插入审计日志
func (m *gormAuditLogModel) Insert(ctx context.Context, data *AuditLog) (*AuditLog, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

// FindByUserId 根据用户ID查询审计日志列表（支持分页）
func (m *gormAuditLogModel) FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*AuditLog, int64, error) {
	var auditLogs []*AuditLog
	var total int64

	query := m.db.WithContext(ctx).Model(&AuditLog{}).Where("user_id = ?", userId)

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用分页
	if pageSize > 0 {
		offset := (page - 1) * pageSize
		if offset < 0 {
			offset = 0
		}
		query = query.Offset(offset).Limit(pageSize)
	}

	// 按时间倒序排列（最新的在前）
	query = query.Order("timestamp DESC")

	// 执行查询
	if err := query.Find(&auditLogs).Error; err != nil {
		return nil, 0, err
	}

	return auditLogs, total, nil
}

// FindOne 根据 ID 查询
func (m *gormAuditLogModel) FindOne(ctx context.Context, id int64) (*AuditLog, error) {
	var auditLog AuditLog
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&auditLog).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrAuditLogNotFound
		}
		return nil, err
	}
	return &auditLog, nil
}

// WithTx 使用事务
func (m *gormAuditLogModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormAuditLogModel{db: gormTx}
	}
	return m
}
