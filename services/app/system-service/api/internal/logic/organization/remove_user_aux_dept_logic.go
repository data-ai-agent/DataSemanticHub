// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RemoveUserAuxDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除用户辅助部门
func NewRemoveUserAuxDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RemoveUserAuxDeptLogic {
	return &RemoveUserAuxDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RemoveUserAuxDeptLogic) RemoveUserAuxDept(req *types.RemoveUserAuxDeptReq) (resp *types.RemoveUserAuxDeptResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.DeptId)
	if err != nil {
		l.Errorf("查询部门失败: deptId=%s, error=%v", req.DeptId, err)
		return nil, err
	}

	// 2. 删除辅助部门
	err = l.svcCtx.UserDeptModel.RemoveAuxDept(l.ctx, req.UserId, req.DeptId)
	if err != nil {
		l.Errorf("删除辅助部门失败: userId=%s, deptId=%s, error=%v", req.UserId, req.DeptId, err)
		return nil, err
	}

	l.Infof("成功删除辅助部门: userId=%s, deptId=%s, deptName=%s", req.UserId, req.DeptId, org.Name)

	return &types.RemoveUserAuxDeptResp{
		Success: true,
	}, nil
}
