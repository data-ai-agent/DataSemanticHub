package organization

import (
	"context"
)

// SysOrganization 组织实体
type SysOrganization struct {
	Id        string  `gorm:"primaryKey;size:36"`
	ParentId  string  `gorm:"size:36;not null;default:'0'"`
	Name      string  `gorm:"size:100;not null"`
	Code      string  `gorm:"size:50;unique"`
	Ancestors string  `gorm:"size:500;not null;default:''"`
	SortOrder int     `gorm:"not null;default:0"`
	LeaderId  string  `gorm:"size:36"`
	Type      int8    `gorm:"not null;default:2"`
	Status    int8    `gorm:"not null;default:1"`
	Desc      string  `gorm:"size:255"`
	CreatedAt string  `gorm:"autoCreateTime"`
	UpdatedAt string  `gorm:"autoUpdateTime"`
	DeletedAt *string `gorm:"index;size:3"` // DATETIME(3) for GORM soft delete
}

// TableName 指定表名
func (SysOrganization) TableName() string {
	return "sys_organization"
}

// TreeNode 树节点响应结构
type TreeNode struct {
	Id         string      `json:"id"`
	ParentId   string      `json:"parentId"`
	Name       string      `json:"name"`
	Code       string      `json:"code"`
	Type       int8        `json:"type"`
	Status     int8        `json:"status"`
	SortOrder  int         `json:"sortOrder"`
	LeaderId   string      `json:"leaderId"`
	LeaderName string      `json:"leaderName"`
	Children   []*TreeNode `json:"children"`
}

// Model 组织架构数据访问接口
type Model interface {
	// Insert 插入部门
	Insert(ctx context.Context, data *SysOrganization) (*SysOrganization, error)

	// FindOne 根据ID查询部门
	FindOne(ctx context.Context, id string) (*SysOrganization, error)

	// Update 更新部门信息
	Update(ctx context.Context, data *SysOrganization) error

	// Delete 删除部门（逻辑删除）
	Delete(ctx context.Context, id string) error

	// FindTree 查询组织树（所有节点或按状态过滤）
	FindTree(ctx context.Context, status *int8) ([]*SysOrganization, error)

	// FindChildren 查询直属子节点
	FindChildren(ctx context.Context, parentId string) ([]*SysOrganization, error)

	// FindSubtree 查询子树（所有子孙节点）
	FindSubtree(ctx context.Context, id string) ([]*SysOrganization, error)

	// HasChildren 检查是否有子节点
	HasChildren(ctx context.Context, id string) (bool, error)

	// FindByCode 根据编码查询部门
	FindByCode(ctx context.Context, code string) (*SysOrganization, error)

	// FindByParentAndName 根据父节点和名称查询（同级名称唯一性校验）
	FindByParentAndName(ctx context.Context, parentId, name string) (*SysOrganization, error)

	// CountUsers 统计部门下的用户数量
	CountUsers(ctx context.Context, deptId string) (int64, error)

	// IsDescendant 检测是否为子孙节点（环路检测）
	IsDescendant(ctx context.Context, ancestorId, descendantId string) (bool, error)

	// WithTx 绑定事务
	WithTx(tx interface{}) Model

	// Trans 执行事务
	Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}

// TreeService 树操作服务接口
type TreeService interface {
	// BuildTree 将扁平列表转换为树形结构
	BuildTree(nodes []*SysOrganization) []*TreeNode

	// CalculateAncestors 计算祖先路径
	CalculateAncestors(parentAncestors, parentId string) string

	// UpdateDescendantsAncestors 批量更新子孙节点的祖先路径
	UpdateDescendantsAncestors(ctx context.Context, rootId, oldPrefix, newPrefix string) error
}
