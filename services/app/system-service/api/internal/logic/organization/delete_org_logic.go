// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	baseErrorx "github.com/DataSemanticHub/services/app/system-service/pkg/errorx"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteOrgLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除组织
func NewDeleteOrgLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteOrgLogic {
	return &DeleteOrgLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteOrgLogic) DeleteOrg(req *types.DeleteOrgReq) (resp *types.DeleteOrgResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询部门失败: %v", err)
		return nil, baseErrorx.NewWithCode(errorx.ErrCodeOrgNotFound)
	}

	// 2. 根节点不允许删除
	if org.ParentId == "0" || org.Ancestors == "0" {
		return nil, baseErrorx.New(errorx.ErrCodeOrgRootDelete, "根节点不允许删除")
	}

	// 3. 校验无子节点
	hasChildren, err := l.svcCtx.OrgModel.HasChildren(l.ctx, req.Id)
	if err != nil {
		l.Errorf("检查子节点失败: %v", err)
		return nil, err
	}
	if hasChildren {
		return nil, baseErrorx.New(errorx.ErrCodeOrgHasChildren, "存在子节点，无法删除")
	}

	// 4. 校验无关联用户
	userCount, err := l.svcCtx.OrgModel.CountUsers(l.ctx, req.Id)
	if err != nil {
		l.Errorf("检查关联用户失败: %v", err)
		return nil, err
	}
	if userCount > 0 {
		return nil, baseErrorx.New(errorx.ErrCodeOrgHasUsers, "存在关联用户，无法删除")
	}

	// 5. 执行逻辑删除
	err = l.svcCtx.OrgModel.Delete(l.ctx, req.Id)
	if err != nil {
		l.Errorf("删除部门失败: %v", err)
		return nil, err
	}

	// 6. TODO: 记录审计日志
	// l.svcCtx.AuditLogModel.Record(l.ctx, "delete", "org", req.Id, org, nil)

	l.Infof("成功删除部门: id=%s, name=%s", req.Id, org.Name)

	return &types.DeleteOrgResp{Success: true}, nil
}
