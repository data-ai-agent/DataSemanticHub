package permission_template

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// gormPermissionTemplateModel GORM 实现的权限模板 Model
type gormPermissionTemplateModel struct {
	db *gorm.DB
}

// Insert 插入权限模板
func (m *gormPermissionTemplateModel) Insert(ctx context.Context, data *PermissionTemplate) (*PermissionTemplate, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		// 检查是否是唯一性约束错误
		if strings.Contains(err.Error(), "Duplicate entry") || strings.Contains(err.Error(), "UNIQUE constraint") {
			return nil, ErrPermissionTemplateCodeExists
		}
		return nil, fmt.Errorf("创建权限模板失败: %w", err)
	}
	return data, nil
}

// FindOne 根据 ID 查询
func (m *gormPermissionTemplateModel) FindOne(ctx context.Context, id string) (*PermissionTemplate, error) {
	var template PermissionTemplate
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&template).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPermissionTemplateNotFound
		}
		return nil, fmt.Errorf("查询权限模板失败: %w", err)
	}
	return &template, nil
}

// FindOneByCode 根据 code 查询（全局唯一，未删除）
func (m *gormPermissionTemplateModel) FindOneByCode(ctx context.Context, code string) (*PermissionTemplate, error) {
	var template PermissionTemplate
	err := m.db.WithContext(ctx).Unscoped().Where("code = ? AND deleted_at IS NULL", code).First(&template).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPermissionTemplateNotFound
		}
		return nil, fmt.Errorf("查询权限模板失败: %w", err)
	}
	return &template, nil
}

// FindOneByCodeIncludingDeleted 根据 code 查询（包括已删除，用于唯一性校验）
func (m *gormPermissionTemplateModel) FindOneByCodeIncludingDeleted(ctx context.Context, code string) (*PermissionTemplate, error) {
	var template PermissionTemplate
	// 使用 Unscoped() 查询所有记录，包括已删除的
	err := m.db.WithContext(ctx).Unscoped().Where("code = ?", code).First(&template).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrPermissionTemplateNotFound
		}
		return nil, fmt.Errorf("查询权限模板失败: %w", err)
	}
	return &template, nil
}

// List 查询权限模板列表（支持筛选和分页）
func (m *gormPermissionTemplateModel) List(ctx context.Context, filter *ListFilter) ([]*PermissionTemplate, int64, error) {
	var templates []*PermissionTemplate
	var total int64

	query := m.db.WithContext(ctx).Model(&PermissionTemplate{})

	// 搜索关键词（name/code）
	if filter.Keyword != "" {
		keyword := "%" + strings.TrimSpace(filter.Keyword) + "%"
		query = query.Where("name LIKE ? OR code LIKE ?", keyword, keyword)
	}

	// 过滤：status
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	// 过滤：scope_suggestion
	if filter.ScopeSuggestion != "" {
		query = query.Where("scope_suggestion = ?", filter.ScopeSuggestion)
	}

	// 先统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("统计权限模板数量失败: %w", err)
	}

	// 分页参数
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 10
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	offset := (filter.Page - 1) * filter.PageSize

	// 按 updated_at 降序排序，支持分页
	err := query.Order("updated_at DESC").Limit(filter.PageSize).Offset(offset).Find(&templates).Error
	if err != nil {
		return nil, 0, fmt.Errorf("查询权限模板列表失败: %w", err)
	}

	return templates, total, nil
}

// Count 统计符合条件的权限模板数量
func (m *gormPermissionTemplateModel) Count(ctx context.Context, filter *ListFilter) (int64, error) {
	var count int64
	query := m.db.WithContext(ctx).Model(&PermissionTemplate{})

	// 搜索关键词（name/code）
	if filter.Keyword != "" {
		keyword := "%" + strings.TrimSpace(filter.Keyword) + "%"
		query = query.Where("name LIKE ? OR code LIKE ?", keyword, keyword)
	}

	// 过滤：status
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	// 过滤：scope_suggestion
	if filter.ScopeSuggestion != "" {
		query = query.Where("scope_suggestion = ?", filter.ScopeSuggestion)
	}

	err := query.Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("统计权限模板数量失败: %w", err)
	}

	return count, nil
}

// Update 更新权限模板
func (m *gormPermissionTemplateModel) Update(ctx context.Context, data *PermissionTemplate) error {
	err := m.db.WithContext(ctx).Save(data).Error
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") || strings.Contains(err.Error(), "UNIQUE constraint") {
			return ErrPermissionTemplateCodeExists
		}
		return fmt.Errorf("更新权限模板失败: %w", err)
	}
	return nil
}

// UpdateStatus 更新模板状态
func (m *gormPermissionTemplateModel) UpdateStatus(ctx context.Context, id string, status string) error {
	err := m.db.WithContext(ctx).Model(&PermissionTemplate{}).Where("id = ?", id).Update("status", status).Error
	if err != nil {
		return fmt.Errorf("更新权限模板状态失败: %w", err)
	}
	return nil
}

// UpdateVersionWithStatus 更新版本号和状态（用于发布）
func (m *gormPermissionTemplateModel) UpdateVersionWithStatus(ctx context.Context, id string, version int, status string) error {
	updates := map[string]interface{}{
		"status":  status,
		"version": version,
	}
	err := m.db.WithContext(ctx).Model(&PermissionTemplate{}).Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return fmt.Errorf("更新权限模板版本和状态失败: %w", err)
	}
	return nil
}

// Delete 删除权限模板（软删除）
func (m *gormPermissionTemplateModel) Delete(ctx context.Context, id string) error {
	err := m.db.WithContext(ctx).Delete(&PermissionTemplate{}, "id = ?", id).Error
	if err != nil {
		return fmt.Errorf("删除权限模板失败: %w", err)
	}
	return nil
}

// GetUsageStats 获取模板使用统计（被角色引用数量）
// 注意：当前版本返回空统计，后续需要关联角色表实现
func (m *gormPermissionTemplateModel) GetUsageStats(ctx context.Context, id string) (*UsageStats, error) {
	// TODO: 后续需要关联 role_templates 或 roles 表查询实际使用情况
	// 当前版本返回零值
	stats := &UsageStats{
		UsedByRoleCount: 0,
		LastAppliedAt:   nil,
	}
	return stats, nil
}

// WithTx 使用事务
func (m *gormPermissionTemplateModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormPermissionTemplateModel{db: gormTx}
	}
	return m
}

// Trans 执行事务
func (m *gormPermissionTemplateModel) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txModel := &gormPermissionTemplateModel{db: tx}
		return fn(ctx, txModel)
	})
}
