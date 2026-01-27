package organization

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

// NewModel 创建 Organization Model 实例
func NewModel(db *gorm.DB) Model {
	return &gormDAO{db: db}
}

func (m *gormDAO) Insert(ctx context.Context, data *SysOrganization) (*SysOrganization, error) {
	// 生成 UUID v7
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("generate uuid failed: %w", err)
	}
	data.Id = id.String()

	// 如果未指定祖先路径，计算默认值
	if data.Ancestors == "" && data.ParentId != "0" {
		// 需要查询父节点的祖先路径
		parent, err := m.FindOne(ctx, data.ParentId)
		if err != nil {
			return nil, errorx.NewWithCode(errorx.ErrCodeOrgParentNotFound)
		}
		data.Ancestors = m.CalculateAncestors(parent.Ancestors, data.ParentId)
	} else if data.ParentId == "0" {
		data.Ancestors = "0"
	}

	if err := m.db.WithContext(ctx).Create(data).Error; err != nil {
		return nil, fmt.Errorf("create organization failed: %w", err)
	}

	return data, nil
}

func (m *gormDAO) FindOne(ctx context.Context, id string) (*SysOrganization, error) {
	var org SysOrganization
	err := m.db.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorx.NewWithCode(errorx.ErrCodeOrgNotFound)
		}
		return nil, err
	}
	return &org, nil
}

func (m *gormDAO) Update(ctx context.Context, data *SysOrganization) error {
	result := m.db.WithContext(ctx).Model(&SysOrganization{}).Where("id = ?", data.Id).Updates(data)
	if result.Error != nil {
		return fmt.Errorf("update organization failed: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return errorx.NewWithCode(errorx.ErrCodeOrgNotFound)
	}
	return nil
}

func (m *gormDAO) Delete(ctx context.Context, id string) error {
	// 检查是否存在子节点
	hasChildren, err := m.HasChildren(ctx, id)
	if err != nil {
		return err
	}
	if hasChildren {
		return errorx.NewWithCode(errorx.ErrCodeOrgHasChildren)
	}

	// 检查是否有关联用户
	count, err := m.CountUsers(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return errorx.NewWithCode(errorx.ErrCodeOrgHasUsers)
	}

	// 逻辑删除
	result := m.db.WithContext(ctx).Model(&SysOrganization{}).Where("id = ?", id).Update("deleted_at", gorm.Expr("NOW(3)"))
	if result.Error != nil {
		return fmt.Errorf("delete organization failed: %w", result.Error)
	}
	return nil
}

func (m *gormDAO) FindTree(ctx context.Context, status *int8) ([]*SysOrganization, error) {
	var orgs []*SysOrganization
	query := m.db.WithContext(ctx).Where("deleted_at IS NULL")
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	err := query.Order("sort_order ASC").Find(&orgs).Error
	if err != nil {
		return nil, fmt.Errorf("find organization tree failed: %w", err)
	}
	return orgs, nil
}

func (m *gormDAO) FindChildren(ctx context.Context, parentId string) ([]*SysOrganization, error) {
	var orgs []*SysOrganization
	err := m.db.WithContext(ctx).
		Where("parent_id = ? AND deleted_at IS NULL", parentId).
		Order("sort_order ASC").
		Find(&orgs).Error
	if err != nil {
		return nil, fmt.Errorf("find children failed: %w", err)
	}
	return orgs, nil
}

func (m *gormDAO) FindSubtree(ctx context.Context, id string) ([]*SysOrganization, error) {
	var orgs []*SysOrganization
	// 使用 ancestors 字段查询所有子孙节点
	// 匹配: ",id," (深度>=2的子孙) 或 ",id" (直接子节点)
	err := m.db.WithContext(ctx).
		Where("(id = ? OR ancestors LIKE ? OR ancestors LIKE ?) AND deleted_at IS NULL",
			id, "%,"+id+",%", "%,"+id).
		Order("ancestors, sort_order ASC").
		Find(&orgs).Error
	if err != nil {
		return nil, fmt.Errorf("find subtree failed: %w", err)
	}
	return orgs, nil
}

func (m *gormDAO) HasChildren(ctx context.Context, id string) (bool, error) {
	var count int64
	err := m.db.WithContext(ctx).
		Table("sys_organization").
		Where("parent_id = ? AND deleted_at IS NULL", id).
		Count(&count).Error
	return count > 0, err
}

func (m *gormDAO) FindByCode(ctx context.Context, code string) (*SysOrganization, error) {
	var org SysOrganization
	err := m.db.WithContext(ctx).Where("code = ? AND deleted_at IS NULL", code).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorx.NewWithCode(errorx.ErrCodeOrgNotFound)
		}
		return nil, err
	}
	return &org, nil
}

func (m *gormDAO) FindByParentAndName(ctx context.Context, parentId, name string) (*SysOrganization, error) {
	var org SysOrganization
	err := m.db.WithContext(ctx).
		Where("parent_id = ? AND name = ? AND deleted_at IS NULL", parentId, name).
		First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // 不存在
		}
		return nil, err
	}
	return &org, nil
}

func (m *gormDAO) CountUsers(ctx context.Context, deptId string) (int64, error) {
	var count int64
	err := m.db.WithContext(ctx).
		Table("sys_user_dept").
		Where("dept_id = ?", deptId).
		Count(&count).Error
	return count, err
}

func (m *gormDAO) IsDescendant(ctx context.Context, ancestorId, descendantId string) (bool, error) {
	var count int64
	err := m.db.WithContext(ctx).
		Table("sys_organization").
		Where("id = ? AND ancestors LIKE ? AND deleted_at IS NULL", descendantId, "%,"+ancestorId+",%").
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (m *gormDAO) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormDAO{db: gormTx}
	}
	return m
}

func (m *gormDAO) Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error {
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(ctx, &gormDAO{db: tx})
	})
}

// CalculateAncestors 计算祖先路径
func (m *gormDAO) CalculateAncestors(parentAncestors, parentId string) string {
	if parentId == "0" {
		return "0"
	}
	if parentAncestors == "" || parentAncestors == "0" {
		return "0," + parentId
	}
	return parentAncestors + "," + parentId
}
