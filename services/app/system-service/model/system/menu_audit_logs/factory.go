package menu_audit_logs

import (
	"gorm.io/gorm"
)

// NewModel 创建菜单审计日志 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormMenuAuditLogModel{
		db: db,
	}
}

// gormMenuAuditLogModel GORM 实现的菜单审计日志 Model
type gormMenuAuditLogModel struct {
	db *gorm.DB
}
