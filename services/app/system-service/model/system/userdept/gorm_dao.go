package userdept

import (
	"context"
	"errors"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/pkg/errorx"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type gormDAO struct {
	db *gorm.DB
}

// Insert 插入用户部门关联
func (m *gormDAO) Insert(ctx context.Context, data *SysUserDept) (*SysUserDept, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		return nil, fmt.Errorf("insert user dept failed: %w", err)
	}
	return data, nil
}

// FindOne 根据ID查询
func (m *gormDAO) FindOne(ctx context.Context, id string) (*SysUserDept, error) {
	var data SysUserDept
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorx.NewWithCode(errorx.ErrCodeOrgNotFound)
		}
		return nil, err
	}
	return &data, nil
}

// Delete 删除用户部门关联
func (m *gormDAO) Delete(ctx context.Context, id string) error {
	result := m.db.WithContext(ctx).Where("id = ?", id).Delete(&SysUserDept{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errorx.NewWithCode(errorx.ErrCodeOrgNotFound)
	}
	return nil
}

// FindByUserId 查询用户的所有部门关联
func (m *gormDAO) FindByUserId(ctx context.Context, userId string) ([]*SysUserDept, error) {
	var data []*SysUserDept
	err := m.db.WithContext(ctx).Where("user_id = ?", userId).Find(&data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

// FindPrimaryByUserId 查询用户的主部门
func (m *gormDAO) FindPrimaryByUserId(ctx context.Context, userId string) (*SysUserDept, error) {
	var data SysUserDept
	err := m.db.WithContext(ctx).Where("user_id = ? AND is_primary = 1", userId).First(&data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // 用户没有主部门
		}
		return nil, err
	}
	return &data, nil
}

// FindAuxByUserId 查询用户的辅助部门
func (m *gormDAO) FindAuxByUserId(ctx context.Context, userId string) ([]*SysUserDept, error) {
	var data []*SysUserDept
	err := m.db.WithContext(ctx).Where("user_id = ? AND is_primary = 0", userId).Find(&data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

// FindUsersByDeptId 查询部门的所有用户关联
// isPrimary: nil=所有, 1=仅主部门, 2=仅辅助部门
func (m *gormDAO) FindUsersByDeptId(ctx context.Context, deptId string, isPrimary *int8) ([]*SysUserDept, error) {
	var data []*SysUserDept
	query := m.db.WithContext(ctx).Where("dept_id = ?", deptId)

	if isPrimary != nil {
		query = query.Where("is_primary = ?", *isPrimary)
	}

	err := query.Find(&data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

// CountByDeptId 统计部门用户数量
// isPrimary: 0=所有, 1=仅主部门用户, 2=仅辅助部门用户
func (m *gormDAO) CountByDeptId(ctx context.Context, deptId string, isPrimary int8) (int64, error) {
	query := m.db.WithContext(ctx).Model(&SysUserDept{}).Where("dept_id = ?", deptId)

	switch isPrimary {
	case 1:
		query = query.Where("is_primary = 1")
	case 2:
		query = query.Where("is_primary = 0")
	}

	var count int64
	err := query.Count(&count).Error
	return count, err
}

// SetPrimaryDept 设置用户的主部门（事务：删除旧主部门，设置新主部门）
func (m *gormDAO) SetPrimaryDept(ctx context.Context, userId, deptId string) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. 将旧的主部门设置为辅助部门
		result := tx.Model(&SysUserDept{}).
			Where("user_id = ? AND is_primary = 1", userId).
			Update("is_primary", 0)
		if result.Error != nil {
			return result.Error
		}

		// 2. 检查新主部门关联是否存在
		var existing SysUserDept
		err := tx.Where("user_id = ? AND dept_id = ?", userId, deptId).
			First(&existing).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// 3. 如果关联存在，更新为主部门
		if existing.Id != "" {
			result = tx.Model(&SysUserDept{}).
				Where("user_id = ? AND dept_id = ?", userId, deptId).
				Update("is_primary", 1)
			if result.Error != nil {
				return result.Error
			}
		} else {
			// 4. 如果关联不存在，创建新的主部门关联
			id, _ := uuid.NewV7()
			newRecord := &SysUserDept{
				Id:        id.String(),
				UserId:    userId,
				DeptId:    deptId,
				IsPrimary: 1,
			}
			err = tx.Create(newRecord).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
}

// AddAuxDept 添加辅助部门
func (m *gormDAO) AddAuxDept(ctx context.Context, userId, deptId string) error {
	// 检查关联是否已存在
	var existing SysUserDept
	err := m.db.WithContext(ctx).Where("user_id = ? AND dept_id = ?", userId, deptId).
		First(&existing).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if existing.Id != "" {
		// 关联已存在，如果是主部门则不能添加为辅助
		if existing.IsPrimary == 1 {
			return errorx.New(errorx.ErrCodeOrgPrimaryInvalid, "该部门已是用户的主部门")
		}
		// 已是辅助部门，直接返回成功
		return nil
	}

	// 创建新的辅助部门关联
	id, _ := uuid.NewV7()
	newRecord := &SysUserDept{
		Id:        id.String(),
		UserId:    userId,
		DeptId:    deptId,
		IsPrimary: 0,
	}
	err = m.db.WithContext(ctx).Create(newRecord).Error
	if err != nil {
		return fmt.Errorf("add aux dept failed: %w", err)
	}

	return nil
}

// RemoveAuxDept 删除辅助部门
func (m *gormDAO) RemoveAuxDept(ctx context.Context, userId, deptId string) error {
	result := m.db.WithContext(ctx).
		Where("user_id = ? AND dept_id = ? AND is_primary = 0", userId, deptId).
		Delete(&SysUserDept{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errorx.New(errorx.ErrCodeOrgAuxDuplicate, "辅助部门关联不存在")
	}

	return nil
}

// WithTx 创建事务副本
func (m *gormDAO) WithTx(tx interface{}) Model {
	return &gormDAO{db: tx.(*gorm.DB)}
}

// Trans 执行事务
func (m *gormDAO) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(ctx, &gormDAO{db: tx})
	})
}
