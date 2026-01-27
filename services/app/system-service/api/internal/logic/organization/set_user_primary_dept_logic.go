// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SetUserPrimaryDeptLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 设置用户主部门
func NewSetUserPrimaryDeptLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SetUserPrimaryDeptLogic {
	return &SetUserPrimaryDeptLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SetUserPrimaryDeptLogic) SetUserPrimaryDept(req *types.SetUserPrimaryDeptReq) (resp *types.SetUserPrimaryDeptResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.DeptId)
	if err != nil {
		l.Errorf("查询部门失败: deptId=%s, error=%v", req.DeptId, err)
		return nil, err
	}

	// 2. 设置主部门（UserDept Model 会处理旧主部门的转换）
	err = l.svcCtx.UserDeptModel.SetPrimaryDept(l.ctx, req.UserId, req.DeptId)
	if err != nil {
		l.Errorf("设置主部门失败: userId=%s, deptId=%s, error=%v", req.UserId, req.DeptId, err)
		return nil, err
	}

	l.Infof("成功设置用户主部门: userId=%s, deptId=%s, deptName=%s", req.UserId, req.DeptId, org.Name)

	return &types.SetUserPrimaryDeptResp{
		Success: true,
	}, nil
}
