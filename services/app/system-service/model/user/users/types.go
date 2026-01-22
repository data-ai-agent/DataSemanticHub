package users

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	Id            string         `gorm:"primaryKey;size:36" json:"id"`                                 // UUID v7
	FirstName     string         `gorm:"size:50;not null" json:"first_name"`                           // 名
	LastName      string         `gorm:"size:50;not null" json:"last_name"`                            // 姓
	Name          string         `gorm:"size:100;index" json:"name"`                                   // 完整姓名（新增）
	Email         string         `gorm:"size:255;not null;uniqueIndex" json:"email"`                   // 邮箱（唯一）
	Phone         *string        `gorm:"size:11;uniqueIndex" json:"phone,omitempty"`                   // 手机号（可选，唯一）
	DeptId        *string        `gorm:"size:36;index" json:"dept_id,omitempty"`                       // 主部门ID（可选）
	Organization  string         `gorm:"size:100" json:"organization"`                                 // 组织
	PasswordHash  string         `gorm:"size:60;not null" json:"-"`                                    // 密码哈希（不返回）
	Status        int8           `gorm:"default:0;not null;index" json:"status"`                       // 状态：0-未激活，1-启用，2-停用，3-锁定，4-归档
	AccountSource string         `gorm:"size:10;not null;default:'local';index" json:"account_source"` // 账号来源：local/sso
	LockReason    *string        `gorm:"size:255" json:"lock_reason,omitempty"`                        // 锁定原因（可选）
	LockTime      *time.Time     `gorm:"type:datetime" json:"lock_time,omitempty"`                     // 锁定时间（可选）
	LockBy        *string        `gorm:"size:36" json:"lock_by,omitempty"`                             // 锁定操作人ID（可选）
	CreatedBy     *string        `gorm:"size:36" json:"created_by,omitempty"`                          // 创建人ID（可选）
	UpdatedBy     *string        `gorm:"size:36" json:"updated_by,omitempty"`                          // 更新人ID（可选）
	LastLoginAt   *time.Time     `gorm:"type:datetime" json:"last_login_at"`                           // 最后登录时间
	CreatedAt     time.Time      `gorm:"autoCreateTime" json:"created_at"`                             // 创建时间
	UpdatedAt     time.Time      `gorm:"autoUpdateTime" json:"updated_at"`                             // 更新时间
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`                                               // 软删除（不返回）
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
