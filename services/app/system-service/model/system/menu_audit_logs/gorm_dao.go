package menu_audit_logs

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// Insert 插入审计日志
func (m *gormMenuAuditLogModel) Insert(ctx context.Context, data *MenuAuditLog) (*MenuAuditLog, error) {
	err := m.db.WithContext(ctx).Create(data).Error
	if err != nil {
		return nil, fmt.Errorf("创建审计日志失败: %w", err)
	}
	return data, nil
}

// FindList 查询审计日志列表（支持分页和筛选）
func (m *gormMenuAuditLogModel) FindList(ctx context.Context, req *FindListReq) ([]*MenuAuditLog, int64, error) {
	var logs []*MenuAuditLog
	var total int64

	query := m.db.WithContext(ctx).Model(&MenuAuditLog{})

	// 筛选：menu_id
	if req.MenuId != "" {
		query = query.Where("menu_id = ?", req.MenuId)
	}

	// 筛选：operation_type
	if req.OperationType != "" {
		query = query.Where("operation_type = ?", req.OperationType)
	}

	// 筛选：operator_id
	if req.OperatorId != "" {
		query = query.Where("operator_id = ?", req.OperatorId)
	}

	// 筛选：时间范围
	if req.StartTime != nil {
		query = query.Where("created_at >= ?", *req.StartTime)
	}
	if req.EndTime != nil {
		query = query.Where("created_at <= ?", *req.EndTime)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("查询审计日志总数失败: %w", err)
	}

	// 按创建时间倒序排序
	query = query.Order("created_at DESC")

	// 分页
	if req.PageSize > 0 {
		offset := (req.Page - 1) * req.PageSize
		if offset < 0 {
			offset = 0
		}
		query = query.Offset(offset).Limit(req.PageSize)
	}

	// 执行查询
	if err := query.Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("查询审计日志列表失败: %w", err)
	}

	return logs, total, nil
}

// FindLatestByMenuId 查询菜单最近一次操作
func (m *gormMenuAuditLogModel) FindLatestByMenuId(ctx context.Context, menuId string) (*MenuAuditLog, error) {
	var log MenuAuditLog
	err := m.db.WithContext(ctx).
		Where("menu_id = ?", menuId).
		Order("created_at DESC").
		First(&log).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // 没有找到记录，返回 nil（不是错误）
		}
		return nil, fmt.Errorf("查询最近一次操作失败: %w", err)
	}
	return &log, nil
}

// WithTx 使用事务
func (m *gormMenuAuditLogModel) WithTx(tx interface{}) Model {
	if gormTx, ok := tx.(*gorm.DB); ok {
		return &gormMenuAuditLogModel{db: gormTx}
	}
	return m
}
