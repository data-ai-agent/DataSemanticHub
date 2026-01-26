// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	baseErrorx "github.com/DataSemanticHub/services/app/system-service/pkg/errorx"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateOrgLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 更新组织
func NewUpdateOrgLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateOrgLogic {
	return &UpdateOrgLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateOrgLogic) UpdateOrg(req *types.UpdateOrgReq) (resp *types.UpdateOrgResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询部门失败: %v", err)
		return nil, baseErrorx.NewWithCode(errorx.ErrCodeOrgNotFound)
	}

	// 2. 校验同级名称唯一（排除自己，且只在修改名称时检查）
	if req.Name != "" && req.Name != org.Name {
		existingOrg, err := l.svcCtx.OrgModel.FindByParentAndName(l.ctx, org.ParentId, req.Name)
		if err == nil && existingOrg != nil && existingOrg.Id != req.Id {
			l.Errorf("同级已存在同名部门: %s", req.Name)
			return nil, baseErrorx.New(errorx.ErrCodeOrgNameDuplicate, "同级已存在同名部门")
		}
	}

	// 3. 检查停用状态时是否有启用状态的子节点
	if req.Status == 0 { // 0 表示停用
		hasChildren, err := l.svcCtx.OrgModel.HasChildren(l.ctx, req.Id)
		if err != nil {
			l.Errorf("检查子节点失败: %v", err)
			return nil, err
		}
		if hasChildren {
			// 检查是否有启用状态的子节点
			children, err := l.svcCtx.OrgModel.FindChildren(l.ctx, req.Id)
			if err != nil {
				l.Errorf("查询子节点失败: %v", err)
				return nil, err
			}
			for _, child := range children {
				if child.Status == 1 {
					return nil, baseErrorx.New(errorx.ErrCodeOrgHasActiveChildren, "存在启用状态的子节点，无法停用")
				}
			}
		}
	}

	// 4. 更新字段（不修改 parent_id，通过 MoveOrg 接口移动）
	now := time.Now().Format("2006-01-02 15:04:05")

	updated := req.Name != "" && req.Name != org.Name ||
		req.Code != "" ||
		req.SortOrder >= 0 ||
		req.LeaderId != "" ||
		req.Desc != ""

	if updated || req.Status != org.Status {
		if req.Name != "" && req.Name != org.Name {
			org.Name = req.Name
		}
		if req.Code != "" {
			org.Code = req.Code
		}
		if req.SortOrder >= 0 {
			org.SortOrder = req.SortOrder
		}
		if req.LeaderId != "" {
			org.LeaderId = req.LeaderId
		}
		if req.Desc != "" {
			org.Desc = req.Desc
		}
		org.Status = req.Status
	}

	org.UpdatedAt = now

	// 5. 执行更新
	if updated {
		err = l.svcCtx.OrgModel.Update(l.ctx, org)
		if err != nil {
			l.Errorf("更新部门失败: %v", err)
			return nil, err
		}

		l.Infof("成功更新部门: id=%s, name=%s", org.Id, org.Name)
	}

	return &types.UpdateOrgResp{Success: true}, nil
}
