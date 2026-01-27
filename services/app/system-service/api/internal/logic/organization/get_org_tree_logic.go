// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"
	"strings"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	org "github.com/DataSemanticHub/services/app/system-service/model/system/organization"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetOrgTreeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取组织架构树
func NewGetOrgTreeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOrgTreeLogic {
	return &GetOrgTreeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOrgTreeLogic) GetOrgTree(req *types.GetOrgTreeReq) (resp *types.GetOrgTreeResp, err error) {
	// 1. 查询所有组织节点（可按状态过滤）
	var statusFilter *int8
	if req.Status != 0 {
		statusFilter = &req.Status
	}

	allOrgs, err := l.svcCtx.OrgModel.FindTree(l.ctx, statusFilter)
	if err != nil {
		l.Errorf("查询组织树失败: %v", err)
		return nil, err
	}

	// 2. 模糊搜索过滤（如果提供了名称）
	var filteredOrgs []*org.SysOrganization
	if req.Name != "" {
		for _, item := range allOrgs {
			// 包含搜索词，或者其祖先节点包含搜索词
			if contains(item.Name, req.Name) || containsInAncestors(item.Ancestors, req.Name, l.ctx, l.svcCtx.OrgModel) {
				filteredOrgs = append(filteredOrgs, item)
			}
		}
	} else {
		filteredOrgs = allOrgs
	}

	// 3. 构建树形结构
	treeNodes := l.svcCtx.OrgTreeService.BuildTree(filteredOrgs)

	// 4. 转换为 API 响应格式
	respTree := convertToAPI(treeNodes)

	return &types.GetOrgTreeResp{Tree: respTree}, nil
}

// contains 简单的字符串包含判断
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// containsInAncestors 检查祖先节点中是否包含搜索词
func containsInAncestors(ancestors, name string, ctx context.Context, model org.Model) bool {
	if ancestors == "" || ancestors == "0" {
		return false
	}

	parts := strings.Split(ancestors, ",")
	for _, id := range parts {
		if id == "" || id == "0" {
			continue
		}
		ancestor, err := model.FindOne(ctx, id)
		if err != nil {
			continue
		}
		if contains(ancestor.Name, name) {
			return true
		}
	}
	return false
}

// convertToAPI 将 Model TreeNode 转换为 API OrgTreeNode
func convertToAPI(nodes []*org.TreeNode) []*types.OrgTreeNode {
	result := make([]*types.OrgTreeNode, 0, len(nodes))
	for _, node := range nodes {
		apiNode := &types.OrgTreeNode{
			Id:         node.Id,
			ParentId:   node.ParentId,
			Name:       node.Name,
			Code:       node.Code,
			Type:       node.Type,
			Status:     node.Status,
			SortOrder:  node.SortOrder,
			LeaderId:   node.LeaderId,
			LeaderName: node.LeaderName, // TODO: 从用户表查询
			Children:   convertToAPI(node.Children),
		}
		result = append(result, apiNode)
	}
	return result
}
