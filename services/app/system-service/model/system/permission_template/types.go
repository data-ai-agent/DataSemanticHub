package permission_template

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// PermissionTemplate 权限模板实体
type PermissionTemplate struct {
	Id              string         `gorm:"primaryKey;size:36" json:"id"`                                                           // UUID v7
	Name            string         `gorm:"size:128;not null" json:"name"`                                                           // 模板名称
	Code            string         `gorm:"size:64;not null;index:idx_code" json:"code"`                                              // 模板编码（全局唯一）
	Description     string         `gorm:"size:500" json:"description"`                                                             // 模板描述
	Status          string         `gorm:"size:20;not null;default:'draft';index:idx_status" json:"status"`                          // 模板状态：draft/published/disabled
	ScopeSuggestion string         `gorm:"size:50;index:idx_scope_suggestion" json:"scope_suggestion"`                                // 推荐适用范围：global/organization/domain/project
	PolicyMatrix    datatypes.JSON `gorm:"type:json;not null" json:"policy_matrix"`                                                 // 策略矩阵（模块×动作勾选关系）
	AdvancedPerms   datatypes.JSON `gorm:"type:json" json:"advanced_perms"`                                                         // 高级权限点配置
	Version         int            `gorm:"type:int;not null;default:1" json:"version"`                                               // 版本号（每次发布递增）
	CreatedBy       string         `gorm:"size:36;not null" json:"created_by"`                                                      // 创建人ID
	CreatedAt       time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3);index:idx_created_at" json:"created_at"` // 创建时间
	UpdatedBy       *string        `gorm:"size:36" json:"updated_by,omitempty"`                                                     // 最后更新人ID
	UpdatedAt       time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)" json:"updated_at"` // 最后更新时间
	DeletedAt       gorm.DeletedAt `gorm:"type:datetime(3);index:uk_code_deleted" json:"-"`                                         // 删除时间（软删除，不返回）
}

// TableName 指定表名
func (PermissionTemplate) TableName() string {
	return "permission_templates"
}

// UsageStats 模板使用统计
type UsageStats struct {
	UsedByRoleCount int64      `json:"used_by_role_count"` // 被角色引用数量
	LastAppliedAt   *time.Time `json:"last_applied_at"`    // 最后应用时间
}
