// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetOrgDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取组织详情
func NewGetOrgDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOrgDetailLogic {
	return &GetOrgDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOrgDetailLogic) GetOrgDetail(req *types.GetOrgDetailReq) (resp *types.GetOrgDetailResp, err error) {
	// 1. 查询组织详情
	orgData, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询组织详情失败: %v", err)
		return nil, err
	}

	// 2. 查询父组织名称
	var parentName string
	if orgData.ParentId != "" && orgData.ParentId != "0" {
		parent, err := l.svcCtx.OrgModel.FindOne(l.ctx, orgData.ParentId)
		if err == nil {
			parentName = parent.Name
		}
	}

	// 3. 查询负责人名称（TODO: 从用户表查询）
	var leaderName string
	if orgData.LeaderId != "" {
		// TODO: 通过 UserModel 查询用户名称
		// leaderName = l.svcCtx.UserModel.GetUserName(l.ctx, orgData.LeaderId)
		leaderName = "" // 暂时返回空
	}

	// 4. 构建响应
	detail := &types.OrgDetail{
		Id:         orgData.Id,
		ParentId:   orgData.ParentId,
		ParentName: parentName,
		Name:       orgData.Name,
		Code:       orgData.Code,
		Ancestors:  orgData.Ancestors,
		SortOrder:  orgData.SortOrder,
		LeaderId:   orgData.LeaderId,
		LeaderName: leaderName,
		Type:       orgData.Type,
		Status:     orgData.Status,
		Desc:       orgData.Desc,
		CreatedAt:  orgData.CreatedAt,
		UpdatedAt:  orgData.UpdatedAt,
	}

	return &types.GetOrgDetailResp{Detail: detail}, nil
}
