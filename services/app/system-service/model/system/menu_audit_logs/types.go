package menu_audit_logs

import (
	"time"

	"gorm.io/datatypes"
)

// MenuAuditLog 菜单审计日志实体
type MenuAuditLog struct {
	Id            string         `gorm:"primaryKey;size:36" json:"id"`                                             // UUID v7
	MenuId        string         `gorm:"size:36;not null;index" json:"menu_id"`                                    // 菜单ID
	OperationType string         `gorm:"size:20;not null;index" json:"operation_type"`                             // 操作类型：create/update/delete/move/reorder/enable/disable/show/hide
	OperatorId    *string        `gorm:"size:36;index" json:"operator_id,omitempty"`                               // 操作人ID
	OperatorName  *string        `gorm:"size:128" json:"operator_name,omitempty"`                                  // 操作人名称
	ChangedFields datatypes.JSON `gorm:"type:json" json:"changed_fields,omitempty"`                                // 变更字段（JSON格式）
	OldValue      datatypes.JSON `gorm:"type:json" json:"old_value,omitempty"`                                     // 旧值（JSON格式）
	NewValue      datatypes.JSON `gorm:"type:json" json:"new_value,omitempty"`                                     // 新值（JSON格式）
	Remark        *string        `gorm:"size:512" json:"remark,omitempty"`                                         // 备注
	CreatedAt     time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"` // 创建时间
}

// TableName 指定表名
func (MenuAuditLog) TableName() string {
	return "menu_audit_logs"
}

// FindListReq 查询审计日志列表请求参数
type FindListReq struct {
	MenuId        string     // 菜单ID
	OperationType string     // 操作类型
	OperatorId    string     // 操作人ID
	StartTime     *time.Time // 开始时间
	EndTime       *time.Time // 结束时间
	Page          int        // 页码
	PageSize      int        // 每页大小
}
