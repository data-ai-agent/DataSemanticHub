package userdept

import (
	"context"
	"time"
)

// SysUserDept 用户部门关联实体
// 用于管理用户与部门的多对多关系
// 支持主部门（用于数据权限）和辅助部门（用于协作场景）
type SysUserDept struct {
	Id        string    `gorm:"primaryKey;size:36"` // UUID v7
	UserId    string    `gorm:"size:36;not null;index:idx_user_id"`
	DeptId    string    `gorm:"size:36;not null;index:idx_dept_id"`
	IsPrimary int8      `gorm:"not null;default:0;index:uk_user_primary"` // 1=主部门, 0=辅助部门
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

// TableName 指定表名
func (SysUserDept) TableName() string {
	return "sys_user_dept"
}

// Model 用户部门关联模型接口
type Model interface {
	// Insert 插入用户部门关联
	Insert(ctx context.Context, data *SysUserDept) (*SysUserDept, error)

	// FindOne 根据ID查询
	FindOne(ctx context.Context, id string) (*SysUserDept, error)

	// Delete 删除用户部门关联（逻辑删除）
	Delete(ctx context.Context, id string) error

	// FindByUserId 查询用户的所有部门关联
	FindByUserId(ctx context.Context, userId string) ([]*SysUserDept, error)

	// FindPrimaryByUserId 查询用户的主部门
	FindPrimaryByUserId(ctx context.Context, userId string) (*SysUserDept, error)

	// FindAuxByUserId 查询用户的辅助部门
	FindAuxByUserId(ctx context.Context, userId string) ([]*SysUserDept, error)

	// FindUsersByDeptId 查询部门的所有用户关联
	// isPrimary: 0=查询所有, 1=仅主部门, 2=仅辅助部门
	FindUsersByDeptId(ctx context.Context, deptId string, isPrimary *int8) ([]*SysUserDept, error)

	// CountByDeptId 统计部门用户数量
	// isPrimary: 0=所有, 1=仅主部门用户, 2=仅辅助部门用户
	CountByDeptId(ctx context.Context, deptId string, isPrimary int8) (int64, error)

	// SetPrimaryDept 设置用户的主部门（事务：删除旧主部门，设置新主部门）
	SetPrimaryDept(ctx context.Context, userId, deptId string) error

	// AddAuxDept 添加辅助部门
	AddAuxDept(ctx context.Context, userId, deptId string) error

	// RemoveAuxDept 删除辅助部门
	RemoveAuxDept(ctx context.Context, userId, deptId string) error

	// WithTx 创建事务副本
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
