package auditlogs

import (
	"time"

	"gorm.io/datatypes"
)

// AuditLog 审计日志模型
type AuditLog struct {
	Id         int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserId     string         `gorm:"size:36;not null;index" json:"user_id"`
	Action     string         `gorm:"size:50;not null;index" json:"action"`      // 操作类型
	Operator   string         `gorm:"size:100;not null" json:"operator"`         // 操作人姓名
	OperatorId string         `gorm:"size:36;not null;index" json:"operator_id"` // 操作人ID
	Changes    datatypes.JSON `gorm:"type:json" json:"changes,omitempty"`        // 变更内容（JSON）
	Timestamp  time.Time      `gorm:"autoCreateTime;index" json:"timestamp"`
}

// TableName 指定表名
func (AuditLog) TableName() string {
	return "audit_logs"
}
