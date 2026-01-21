package users

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Insert 插入用户
func (m *gormUserModel) Insert(ctx context.Context, data *User) (*User, error) {
	// 邮箱转小写
	data.Email = strings.ToLower(strings.TrimSpace(data.Email))

	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		// 检查是否是唯一性约束错误
		if strings.Contains(err.Error(), "Duplicate entry") || strings.Contains(err.Error(), "UNIQUE constraint") {
			return nil, ErrEmailExists
		}
		return nil, err
	}
	return data, nil
}

// FindOne 根据 ID 查询
func (m *gormUserModel) FindOne(ctx context.Context, id string) (*User, error) {
	var user User
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindOneByEmail 根据邮箱查询（邮箱转小写）
func (m *gormUserModel) FindOneByEmail(ctx context.Context, email string) (*User, error) {
	// 邮箱转小写
	email = strings.ToLower(strings.TrimSpace(email))

	var user User
	err := m.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Update 更新用户
func (m *gormUserModel) Update(ctx context.Context, data *User) error {
	// 邮箱转小写
	if data.Email != "" {
		data.Email = strings.ToLower(strings.TrimSpace(data.Email))
	}

	return m.db.WithContext(ctx).Save(data).Error
}

// UpdateLastLoginAt 更新最后登录时间
func (m *gormUserModel) UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error {
	return m.db.WithContext(ctx).Model(&User{}).Where("id = ?", id).Update("last_login_at", loginAt).Error
}

// Delete 删除用户（软删除）
func (m *gormUserModel) Delete(ctx context.Context, id string) error {
	return m.db.WithContext(ctx).Delete(&User{}, "id = ?", id).Error
}

// WithTx 使用事务
func (m *gormUserModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormUserModel{db: gormTx}
	}
	return m
}

// Trans 执行事务
func (m *gormUserModel) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txModel := &gormUserModel{db: tx}
		return fn(ctx, txModel)
	})
}
