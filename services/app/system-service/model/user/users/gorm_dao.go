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

// FindOneByPhone 根据手机号查询
func (m *gormUserModel) FindOneByPhone(ctx context.Context, phone string) (*User, error) {
	// 去除空格
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil, ErrUserNotFound
	}

	var user User
	err := m.db.WithContext(ctx).Where("phone = ?", phone).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// FindList 查询用户列表（支持分页、筛选、排序）
func (m *gormUserModel) FindList(ctx context.Context, req *FindListReq) ([]*User, int64, error) {
	var users []*User
	var total int64

	query := m.db.WithContext(ctx).Model(&User{})

	// 应用筛选条件
	if req.Keyword != "" {
		keyword := "%" + strings.TrimSpace(req.Keyword) + "%"
		query = query.Where("name LIKE ? OR email LIKE ? OR phone LIKE ?", keyword, keyword, keyword)
	}
	if req.DeptId != "" {
		query = query.Where("dept_id = ?", req.DeptId)
	}
	if req.Status != nil {
		query = query.Where("status = ?", *req.Status)
	}
	if req.AccountSource != "" {
		query = query.Where("account_source = ?", req.AccountSource)
	}
	// PermissionRole 筛选：通过子查询关联 role_bindings 表
	if req.PermissionRole != "" {
		query = query.Where("id IN (SELECT user_id FROM role_bindings WHERE permission_role = ?)", req.PermissionRole)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用排序
	sortField := req.SortField
	if sortField == "" {
		sortField = "created_at"
	}
	// 验证排序字段，防止 SQL 注入
	allowedSortFields := map[string]bool{
		"name":          true,
		"created_at":    true,
		"last_login_at": true,
		"updated_at":     true,
	}
	if !allowedSortFields[sortField] {
		sortField = "created_at"
	}

	sortOrder := strings.ToLower(req.SortOrder)
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}
	query = query.Order(sortField + " " + sortOrder)

	// 应用分页
	if req.PageSize > 0 {
		offset := (req.Page - 1) * req.PageSize
		if offset < 0 {
			offset = 0
		}
		query = query.Offset(offset).Limit(req.PageSize)
	}

	// 执行查询
	if err := query.Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
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

// UpdateStatus 更新用户状态（支持锁定原因和时间记录）
func (m *gormUserModel) UpdateStatus(ctx context.Context, id string, status int8, lockReason *string, lockBy *string) error {
	// 准备更新数据
	updateMap := map[string]interface{}{
		"status": status,
	}

	// 如果是锁定状态，需要设置锁定相关信息
	if status == 3 {
		now := time.Now()
		updateMap["lock_time"] = now
		if lockReason != nil {
			updateMap["lock_reason"] = *lockReason
		}
		if lockBy != nil {
			updateMap["lock_by"] = *lockBy
		}
	} else {
		// 非锁定状态，清空锁定相关信息
		updateMap["lock_reason"] = nil
		updateMap["lock_time"] = nil
		updateMap["lock_by"] = nil
	}

	// 执行更新
	result := m.db.WithContext(ctx).Model(&User{}).Where("id = ?", id).Updates(updateMap)
	if result.Error != nil {
		return result.Error
	}

	// 检查是否更新了记录
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

// BatchUpdateStatus 批量更新用户状态
func (m *gormUserModel) BatchUpdateStatus(ctx context.Context, userIds []string, status int8, lockReason *string, lockBy *string) ([]string, []BatchUpdateError, error) {
	if len(userIds) == 0 {
		return []string{}, []BatchUpdateError{}, nil
	}

	var successIds []string
	var errors []BatchUpdateError

	// 准备更新数据
	updateMap := map[string]interface{}{
		"status": status,
	}

	// 如果是锁定状态，需要设置锁定相关信息
	if status == 3 {
		now := time.Now()
		updateMap["lock_time"] = now
		if lockReason != nil {
			updateMap["lock_reason"] = *lockReason
		}
		if lockBy != nil {
			updateMap["lock_by"] = *lockBy
		}
	} else {
		// 非锁定状态，清空锁定相关信息
		updateMap["lock_reason"] = nil
		updateMap["lock_time"] = nil
		updateMap["lock_by"] = nil
	}

	// 批量查询用户，验证用户是否存在
	var users []User
	err := m.db.WithContext(ctx).Where("id IN ?", userIds).Find(&users).Error
	if err != nil {
		return nil, nil, err
	}

	// 构建存在的用户ID映射
	existingUserIds := make(map[string]bool)
	for _, user := range users {
		existingUserIds[user.Id] = true
	}

	// 检查不存在的用户
	for _, userId := range userIds {
		if !existingUserIds[userId] {
			errors = append(errors, BatchUpdateError{
				UserId: userId,
				Reason: "用户不存在",
			})
		}
	}

	// 批量更新存在的用户
	if len(existingUserIds) > 0 {
		existingIds := make([]string, 0, len(existingUserIds))
		for id := range existingUserIds {
			existingIds = append(existingIds, id)
		}

		// 执行批量更新
		result := m.db.WithContext(ctx).Model(&User{}).Where("id IN ?", existingIds).Updates(updateMap)
		if result.Error != nil {
			// 如果批量更新失败，将所有用户标记为失败
			for _, userId := range existingIds {
				errors = append(errors, BatchUpdateError{
					UserId: userId,
					Reason: "批量更新失败: " + result.Error.Error(),
				})
			}
		} else {
			// 更新成功的用户ID
			successIds = existingIds
		}
	}

	return successIds, errors, nil
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

// GetStatistics 获取用户统计信息
func (m *gormUserModel) GetStatistics(ctx context.Context) (*Statistics, error) {
	stats := &Statistics{}

	// 1. 统计总用户数
	var total int64
	err := m.db.WithContext(ctx).Model(&User{}).Count(&total).Error
	if err != nil {
		return nil, err
	}
	stats.Total = total

	// 2. 统计各状态用户数
	var activeCount, lockedCount, inactiveCount int64

	// 启用状态（status=1）
	err = m.db.WithContext(ctx).Model(&User{}).Where("status = ?", 1).Count(&activeCount).Error
	if err != nil {
		return nil, err
	}
	stats.Active = activeCount

	// 锁定状态（status=3）
	err = m.db.WithContext(ctx).Model(&User{}).Where("status = ?", 3).Count(&lockedCount).Error
	if err != nil {
		return nil, err
	}
	stats.Locked = lockedCount

	// 停用状态（status=2）
	err = m.db.WithContext(ctx).Model(&User{}).Where("status = ?", 2).Count(&inactiveCount).Error
	if err != nil {
		return nil, err
	}
	stats.Inactive = inactiveCount

	// 3. 统计无组织归属用户数（dept_id为空或NULL）
	var noOrgBindingCount int64
	err = m.db.WithContext(ctx).Model(&User{}).Where("dept_id IS NULL OR dept_id = ''").Count(&noOrgBindingCount).Error
	if err != nil {
		return nil, err
	}
	stats.NoOrgBinding = noOrgBindingCount

	// 4. 统计无权限角色用户数（无role_bindings或permission_role为空）
	// 使用子查询：查找所有用户中，不在role_bindings表中的用户，或者role_bindings中permission_role为空的用户
	var noPermissionRoleCount int64
	subquery := m.db.WithContext(ctx).Table("role_bindings").
		Select("DISTINCT user_id").
		Where("permission_role IS NOT NULL AND permission_role != ''")
	err = m.db.WithContext(ctx).Model(&User{}).
		Where("id NOT IN (?)", subquery).
		Count(&noPermissionRoleCount).Error
	if err != nil {
		return nil, err
	}
	stats.NoPermissionRole = noPermissionRoleCount

	// 5. 计算近7天活跃率（有last_login_at且在7天内的用户数/总用户数）
	var recentActiveCount int64
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	err = m.db.WithContext(ctx).Model(&User{}).
		Where("last_login_at IS NOT NULL AND last_login_at >= ?", sevenDaysAgo).
		Count(&recentActiveCount).Error
	if err != nil {
		return nil, err
	}

	// 计算活跃率（百分比）
	if total > 0 {
		stats.RecentActiveRate = float64(recentActiveCount) / float64(total) * 100
	} else {
		stats.RecentActiveRate = 0
	}

	return stats, nil
}

// Trans 执行事务
func (m *gormUserModel) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txModel := &gormUserModel{db: tx}
		return fn(ctx, txModel)
	})
}
