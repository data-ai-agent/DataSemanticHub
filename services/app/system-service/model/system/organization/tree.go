package organization

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type treeService struct {
	model Model
}

// NewTreeService 创建 TreeService 实例
func NewTreeService(model Model) TreeService {
	return &treeService{model: model}
}

// BuildTree 将扁平列表转换为树形结构
func (s *treeService) BuildTree(nodes []*SysOrganization) []*TreeNode {
	if len(nodes) == 0 {
		return []*TreeNode{}
	}

	// 创建节点映射
	nodeMap := make(map[string]*TreeNode)
	for _, node := range nodes {
		nodeMap[node.Id] = &TreeNode{
			Id:        node.Id,
			ParentId:  node.ParentId,
			Name:      node.Name,
			Code:      node.Code,
			Type:      node.Type,
			Status:    node.Status,
			SortOrder: node.SortOrder,
			LeaderId:  node.LeaderId,
			Children:  []*TreeNode{},
		}
	}

	// 构建树形结构
	var roots []*TreeNode
	for _, node := range nodeMap {
		if node.ParentId == "0" || node.ParentId == "" {
			roots = append(roots, node)
		} else if parent, ok := nodeMap[node.ParentId]; ok {
			parent.Children = append(parent.Children, node)
		}
	}

	return roots
}

// CalculateAncestors 计算祖先路径
func (s *treeService) CalculateAncestors(parentAncestors, parentId string) string {
	if parentId == "0" {
		return "0"
	}
	if parentAncestors == "" || parentAncestors == "0" {
		return "0," + parentId
	}
	return parentAncestors + "," + parentId
}

// UpdateDescendantsAncestors 批量更新子孙节点的祖先路径
func (s *treeService) UpdateDescendantsAncestors(ctx context.Context, rootId, oldPrefix, newPrefix string) error {
	// 查询所有需要更新的子孙节点
	type OrgID struct {
		Id string
	}
	var ids []OrgID
	err := s.model.(*gormDAO).db.WithContext(ctx).
		Table("sys_organization").
		Where("ancestors LIKE ? AND deleted_at IS NULL", oldPrefix+"%").
		Pluck("id", &ids).Error
	if err != nil {
		return fmt.Errorf("query descendants failed: %w", err)
	}

	if len(ids) == 0 {
		return nil
	}

	// 批量更新 ancestors
	// 使用 REPLACE 函数替换祖先路径前缀
	result := s.model.(*gormDAO).db.WithContext(ctx).
		Table("sys_organization").
		Where("ancestors LIKE ? AND deleted_at IS NULL", oldPrefix+"%").
		Update("ancestors", gorm.Expr("REPLACE(ancestors, ?, ?)", oldPrefix, newPrefix))

	if result.Error != nil {
		return fmt.Errorf("update descendants ancestors failed: %w", result.Error)
	}

	return nil
}

// Insert 直接插入并计算 ancestors 的方法（在事务中使用）
func (s *treeService) InsertWithAncestors(ctx context.Context, data *SysOrganization) error {
	// 计算 ancestors
	if data.Ancestors == "" {
		if data.ParentId == "0" {
			data.Ancestors = "0"
		} else {
			// 查询父节点
			parent, err := s.model.FindOne(ctx, data.ParentId)
			if err != nil {
				return fmt.Errorf("find parent node failed: %w", err)
			}
			data.Ancestors = s.CalculateAncestors(parent.Ancestors, data.ParentId)
		}
	}

	// 插入数据
	if err := s.model.(*gormDAO).db.WithContext(ctx).Create(data).Error; err != nil {
		return fmt.Errorf("create organization failed: %w", err)
	}

	return nil
}

// MoveNode 移动部门到新父节点（更新 ancestors）
func (s *treeService) MoveNode(ctx context.Context, id, newParentId string) error {
	// 1. 获取当前节点
	current, err := s.model.FindOne(ctx, id)
	if err != nil {
		return err
	}

	// 2. 计算旧祖先路径前缀
	oldPrefix := current.Ancestors + "," + current.Id + ","

	// 3. 获取新父节点
	newParent, err := s.model.FindOne(ctx, newParentId)
	if err != nil {
		return err
	}

	// 4. 计算新祖先路径
	newAncestors := s.CalculateAncestors(newParent.Ancestors, newParentId)

	// 5. 更新当前节点
	current.ParentId = newParentId
	current.Ancestors = newAncestors
	if err := s.model.Update(ctx, current); err != nil {
		return fmt.Errorf("update current node failed: %w", err)
	}

	// 6. 批量更新子孙节点的 ancestors
	if err := s.UpdateDescendantsAncestors(ctx, id, oldPrefix, newAncestors+","+id+","); err != nil {
		return fmt.Errorf("update descendants failed: %w", err)
	}

	return nil
}

// GetAncestors 获取祖先路径（包括自身）
func (s *treeService) GetAncestors(includeSelf bool, ancestors string) []string {
	if ancestors == "" || ancestors == "0" {
		if includeSelf {
			return []string{"0"}
		}
		return []string{}
	}

	result := []string{}
	if includeSelf {
		result = append(result, "0") // 根节点
	}

	parts := []string{}
	if ancestors != "" && ancestors != "0" {
		parts = strings.Split(ancestors, ",")
	}
	result = append(result, parts...)

	if includeSelf {
		// 添加当前节点（需要在调用处提供）
		// result = append(result, currentId)
	}

	return result
}
