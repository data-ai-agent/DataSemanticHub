package menus

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// FindTree 查询菜单树（支持搜索和过滤）
func (m *gormMenuModel) FindTree(ctx context.Context, req *FindTreeReq) ([]*Menu, error) {
	var menus []*Menu
	query := m.db.WithContext(ctx).Model(&Menu{})

	// 搜索关键词（name/code/path/permission_key）
	if req.Keyword != "" {
		keyword := "%" + strings.TrimSpace(req.Keyword) + "%"
		query = query.Where(
			"name LIKE ? OR code LIKE ? OR path LIKE ? OR permission_key LIKE ?",
			keyword, keyword, keyword, keyword,
		)
	}

	// 过滤：enabled
	if req.Enabled != nil {
		query = query.Where("enabled = ?", *req.Enabled)
	}

	// 过滤：visible
	if req.Visible != nil {
		query = query.Where("visible = ?", *req.Visible)
	}

	// 过滤：权限绑定状态
	if req.PermissionBind == "bound" {
		query = query.Where("permission_key IS NOT NULL AND permission_key != ''")
	} else if req.PermissionBind == "unbound" {
		query = query.Where("permission_key IS NULL OR permission_key = ''")
	}

	// 过滤：type
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	// 过滤：group_id
	if req.GroupId != "" {
		query = query.Where("group_id = ?", req.GroupId)
	}

	// 按 order 排序
	query = query.Order("`order` ASC, created_at ASC")

	err := query.Find(&menus).Error
	if err != nil {
		return nil, fmt.Errorf("查询菜单树失败: %w", err)
	}

	// 返回扁平列表，树形结构在 Logic 层构建
	return menus, nil
}

// FindOne 根据 ID 查询
func (m *gormMenuModel) FindOne(ctx context.Context, id string) (*Menu, error) {
	var menu Menu
	err := m.db.WithContext(ctx).Where("id = ?", id).First(&menu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrMenuNotFound
		}
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	return &menu, nil
}

// FindOneByCode 根据 code 查询（全局唯一）
func (m *gormMenuModel) FindOneByCode(ctx context.Context, code string) (*Menu, error) {
	var menu Menu
	err := m.db.WithContext(ctx).Where("code = ?", code).First(&menu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, ErrMenuNotFound
		}
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	return &menu, nil
}

// FindChildren 查询子菜单列表
func (m *gormMenuModel) FindChildren(ctx context.Context, parentId string) ([]*Menu, error) {
	var menus []*Menu
	err := m.db.WithContext(ctx).Where("parent_id = ?", parentId).Order("`order` ASC").Find(&menus).Error
	if err != nil {
		return nil, fmt.Errorf("查询子菜单失败: %w", err)
	}
	return menus, nil
}

// FindChildrenCount 查询子菜单数量
func (m *gormMenuModel) FindChildrenCount(ctx context.Context, parentId string) (int64, error) {
	var count int64
	err := m.db.WithContext(ctx).Model(&Menu{}).Where("parent_id = ?", parentId).Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("查询子菜单数量失败: %w", err)
	}
	return count, nil
}

// Insert 插入菜单
func (m *gormMenuModel) Insert(ctx context.Context, data *Menu) (*Menu, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		// 检查是否是唯一性约束错误
		if strings.Contains(err.Error(), "Duplicate entry") || strings.Contains(err.Error(), "UNIQUE constraint") {
			return nil, ErrMenuCodeExists
		}
		return nil, fmt.Errorf("创建菜单失败: %w", err)
	}
	return data, nil
}

// Update 更新菜单
func (m *gormMenuModel) Update(ctx context.Context, data *Menu) error {
	err := m.db.WithContext(ctx).Save(data).Error
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") || strings.Contains(err.Error(), "UNIQUE constraint") {
			return ErrMenuCodeExists
		}
		return fmt.Errorf("更新菜单失败: %w", err)
	}
	return nil
}

// Delete 删除菜单（软删除）
func (m *gormMenuModel) Delete(ctx context.Context, id string) error {
	err := m.db.WithContext(ctx).Delete(&Menu{}, "id = ?", id).Error
	if err != nil {
		return fmt.Errorf("删除菜单失败: %w", err)
	}
	return nil
}

// UpdateEnabled 更新菜单启用状态
func (m *gormMenuModel) UpdateEnabled(ctx context.Context, id string, enabled bool) error {
	err := m.db.WithContext(ctx).Model(&Menu{}).Where("id = ?", id).Update("enabled", enabled).Error
	if err != nil {
		return fmt.Errorf("更新菜单启用状态失败: %w", err)
	}
	return nil
}

// UpdateVisible 更新菜单可见状态
func (m *gormMenuModel) UpdateVisible(ctx context.Context, id string, visible bool) error {
	err := m.db.WithContext(ctx).Model(&Menu{}).Where("id = ?", id).Update("visible", visible).Error
	if err != nil {
		return fmt.Errorf("更新菜单可见状态失败: %w", err)
	}
	return nil
}

// UpdateOrder 更新排序（同级）
func (m *gormMenuModel) UpdateOrder(ctx context.Context, id string, order int) error {
	err := m.db.WithContext(ctx).Model(&Menu{}).Where("id = ?", id).Update("order", order).Error
	if err != nil {
		return fmt.Errorf("更新排序失败: %w", err)
	}
	return nil
}

// BatchUpdateOrder 批量更新排序
func (m *gormMenuModel) BatchUpdateOrder(ctx context.Context, updates []OrderUpdate) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			if err := tx.Model(&Menu{}).Where("id = ?", update.Id).Update("order", update.Order).Error; err != nil {
				return fmt.Errorf("批量更新排序失败: %w", err)
			}
		}
		return nil
	})
}

// Move 移动菜单到新父级
func (m *gormMenuModel) Move(ctx context.Context, id string, newParentId *string, newOrder int) error {
	updates := map[string]interface{}{
		"order": newOrder,
	}
	if newParentId != nil {
		updates["parent_id"] = *newParentId
	} else {
		updates["parent_id"] = nil
	}

	err := m.db.WithContext(ctx).Model(&Menu{}).Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return fmt.Errorf("移动菜单失败: %w", err)
	}
	return nil
}

// CheckCycle 检查是否形成循环（父节点不能是自身或子孙）
func (m *gormMenuModel) CheckCycle(ctx context.Context, id string, newParentId string) (bool, error) {
	// 如果新父级是自身，则形成循环
	if id == newParentId {
		return true, nil
	}

	// 递归检查新父级是否是当前菜单的子孙
	currentId := newParentId
	for {
		var menu Menu
		err := m.db.WithContext(ctx).Where("id = ?", currentId).First(&menu).Error
		if err == gorm.ErrRecordNotFound {
			break // 没有找到，说明不是循环
		}
		if err != nil {
			return false, fmt.Errorf("检查循环失败: %w", err)
		}

		// 如果找到的菜单的父级是目标菜单，则形成循环
		if menu.ParentId != nil && *menu.ParentId == id {
			return true, nil
		}

		// 继续向上查找
		if menu.ParentId == nil {
			break // 已到根节点
		}
		currentId = *menu.ParentId
	}

	return false, nil
}

// FindByPath 根据 path 查询（用于冲突检测）
func (m *gormMenuModel) FindByPath(ctx context.Context, path string) ([]*Menu, error) {
	var menus []*Menu
	err := m.db.WithContext(ctx).Where("path = ?", path).Find(&menus).Error
	if err != nil {
		return nil, fmt.Errorf("查询菜单失败: %w", err)
	}
	return menus, nil
}

// GetStatistics 获取统计信息
func (m *gormMenuModel) GetStatistics(ctx context.Context) (*Statistics, error) {
	var stats Statistics

	// 总菜单数
	if err := m.db.WithContext(ctx).Model(&Menu{}).Count(&stats.Total).Error; err != nil {
		return nil, fmt.Errorf("查询总菜单数失败: %w", err)
	}

	// 启用菜单数
	if err := m.db.WithContext(ctx).Model(&Menu{}).Where("enabled = ?", true).Count(&stats.Enabled).Error; err != nil {
		return nil, fmt.Errorf("查询启用菜单数失败: %w", err)
	}

	// 隐藏菜单数
	if err := m.db.WithContext(ctx).Model(&Menu{}).Where("visible = ?", false).Count(&stats.Hidden).Error; err != nil {
		return nil, fmt.Errorf("查询隐藏菜单数失败: %w", err)
	}

	// 未绑定权限菜单数
	if err := m.db.WithContext(ctx).Model(&Menu{}).Where("permission_key IS NULL OR permission_key = ''").Count(&stats.UnboundPermission).Error; err != nil {
		return nil, fmt.Errorf("查询未绑定权限菜单数失败: %w", err)
	}

	return &stats, nil
}

// WithTx 使用事务
func (m *gormMenuModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormMenuModel{db: gormTx}
	}
	return m
}

// Trans 执行事务
func (m *gormMenuModel) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txModel := &gormMenuModel{db: tx}
		return fn(ctx, txModel)
	})
}
