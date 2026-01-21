package users

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	Id           string         `gorm:"primaryKey;size:36" json:"id"`           // UUID v7
	FirstName    string         `gorm:"size:50;not null" json:"first_name"`     // 名
	LastName     string         `gorm:"size:50;not null" json:"last_name"`      // 姓
	Email        string         `gorm:"size:255;not null;uniqueIndex" json:"email"` // 邮箱（唯一）
	Organization string         `gorm:"size:100" json:"organization"`           // 组织
	PasswordHash string         `gorm:"size:60;not null" json:"-"`              // 密码哈希（不返回）
	Status       int8           `gorm:"default:1;not null" json:"status"`        // 状态：1-启用，0-禁用
	LastLoginAt  *time.Time     `gorm:"type:datetime" json:"last_login_at"`      // 最后登录时间
	CreatedAt    time.Time      `gorm:"autoCreateTime" json:"created_at"`        // 创建时间
	UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`        // 更新时间
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                          // 软删除（不返回）
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
