package rolebindings

import (
	"context"

	"gorm.io/gorm"
)

// Insert 插入角色绑定
func (m *gormRoleBindingModel) Insert(ctx context.Context, data *RoleBinding) (*RoleBinding, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		return nil, err
	}
	return data, nil
}

// FindByUserId 根据用户ID查询角色绑定列表
func (m *gormRoleBindingModel) FindByUserId(ctx context.Context, userId string) ([]*RoleBinding, error) {
	var roleBindings []*RoleBinding
	err := m.db.WithContext(ctx).Where("user_id = ?", userId).Find(&roleBindings).Error
	if err != nil {
		return nil, err
	}
	return roleBindings, nil
}

// FindOne 根据 ID 查询
func (m *gormRoleBindingModel) FindOne(ctx context.Context, id int64) (*RoleBinding, error) {
	var roleBinding RoleBinding
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&roleBinding).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrRoleBindingNotFound
		}
		return nil, err
	}
	return &roleBinding, nil
}

// Update 更新角色绑定
func (m *gormRoleBindingModel) Update(ctx context.Context, data *RoleBinding) error {
	return m.db.WithContext(ctx).Save(data).Error
}

// Delete 删除角色绑定
func (m *gormRoleBindingModel) Delete(ctx context.Context, id int64) error {
	return m.db.WithContext(ctx).Delete(&RoleBinding{}, "id = ?", id).Error
}

// DeleteByUserId 根据用户ID删除所有角色绑定
func (m *gormRoleBindingModel) DeleteByUserId(ctx context.Context, userId string) error {
	return m.db.WithContext(ctx).Where("user_id = ?", userId).Delete(&RoleBinding{}).Error
}

// WithTx 使用事务
func (m *gormRoleBindingModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormRoleBindingModel{db: gormTx}
	}
	return m
}
