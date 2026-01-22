package auditlogs

import (
	"gorm.io/gorm"
)

// NewModel 创建审计日志 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormAuditLogModel{
		db: db,
	}
}

// gormAuditLogModel GORM 实现的审计日志 Model
type gormAuditLogModel struct {
	db *gorm.DB
}
