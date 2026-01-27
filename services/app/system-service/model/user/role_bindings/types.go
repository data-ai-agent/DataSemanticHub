package rolebindings

import (
	"time"
)

// RoleBinding 角色绑定模型
type RoleBinding struct {
	Id             int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserId         string    `gorm:"size:36;not null;index" json:"user_id"`
	OrgId          string    `gorm:"size:36;not null;index" json:"org_id"`
	Position       *string   `gorm:"size:50" json:"position,omitempty"`              // 岗位职责（可选）
	PermissionRole *string   `gorm:"size:50;index" json:"permission_role,omitempty"` // 权限角色（可选）
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName 指定表名
func (RoleBinding) TableName() string {
	return "role_bindings"
}
