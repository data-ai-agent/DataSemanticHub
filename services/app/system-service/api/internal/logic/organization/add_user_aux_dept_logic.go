// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type AddUserAuxDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 添加用户辅助部门
func NewAddUserAuxDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AddUserAuxDeptLogic {
	return &AddUserAuxDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AddUserAuxDeptLogic) AddUserAuxDept(req *types.AddUserAuxDeptReq) (resp *types.AddUserAuxDeptResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.DeptId)
	if err != nil {
		l.Errorf("查询部门失败: deptId=%s, error=%v", req.DeptId, err)
		return nil, err
	}

	// 2. 添加辅助部门
	err = l.svcCtx.UserDeptModel.AddAuxDept(l.ctx, req.UserId, req.DeptId)
	if err != nil {
		l.Errorf("添加辅助部门失败: userId=%s, deptId=%s, error=%v", req.UserId, req.DeptId, err)
		return nil, err
	}

	l.Infof("成功添加辅助部门: userId=%s, deptId=%s, deptName=%s", req.UserId, req.DeptId, org.Name)

	return &types.AddUserAuxDeptResp{
		Success: true,
	}, nil
}
