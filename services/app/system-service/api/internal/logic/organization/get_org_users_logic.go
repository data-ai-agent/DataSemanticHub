// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetOrgUsersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取部门用户
func NewGetOrgUsersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOrgUsersLogic {
	return &GetOrgUsersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOrgUsersLogic) GetOrgUsers(req *types.GetOrgUsersReq) (resp *types.GetOrgUsersResp, err error) {
	// 1. 校验部门存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询部门失败: %v", err)
		return nil, err
	}

	// 2. 收集需要查询的部门ID列表
	deptIds := []string{req.Id}
	if req.Recursive {
		// 递归查询所有子部门（FindSubtree 包含当前节点及所有子孙节点）
		subtree, err := l.svcCtx.OrgModel.FindSubtree(l.ctx, req.Id)
		if err != nil {
			l.Errorf("查询子部门失败: %v", err)
			return nil, err
		}
		// 使用 FindSubtree 返回的所有部门ID
		deptIds = make([]string, 0, len(subtree))
		for _, dept := range subtree {
			deptIds = append(deptIds, dept.Id)
		}
		l.Infof("递归查询部门用户: dept=%s, 总共%d个部门（包含子部门）", org.Name, len(deptIds))
	} else {
		l.Infof("查询部门用户: dept=%s (非递归)", org.Name)
	}

	// 3. 查询所有部门关联的用户
	userDepts := make(map[string]*types.DeptUser) // userId -> DeptUser (去重，保留主部门标记)
	primaryDepts := make(map[string]bool)         // userId -> isPrimary

	for _, deptId := range deptIds {
		// 查询该部门的所有用户（主部门+辅助部门）
		depts, err := l.svcCtx.UserDeptModel.FindUsersByDeptId(l.ctx, deptId, nil)
		if err != nil {
			l.Errorf("查询部门用户失败: deptId=%s, error=%v", deptId, err)
			return nil, err
		}

		for _, ud := range depts {
			// 如果用户已存在，保留主部门标记
			if existing, ok := userDepts[ud.UserId]; ok {
				if ud.IsPrimary == 1 {
					existing.IsPrimary = true
					primaryDepts[ud.UserId] = true
				}
				continue
			}

			// 新用户，记录是否为主部门
			isPrimary := ud.IsPrimary == 1
			userDepts[ud.UserId] = &types.DeptUser{
				UserId:    ud.UserId,
				IsPrimary: isPrimary,
			}
			if isPrimary {
				primaryDepts[ud.UserId] = true
			}
		}
	}

	// 4. 批量查询用户详情填充用户名
	result := make([]*types.DeptUser, 0, len(userDepts))
	for userId, deptUser := range userDepts {
		user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
		if err != nil {
			l.Errorf("查询用户详情失败: userId=%s, error=%v", userId, err)
			// 跳过查询失败的用户，继续处理其他用户
			continue
		}

		result = append(result, &types.DeptUser{
			UserId:    userId,
			UserName:  user.Name,
			IsPrimary: deptUser.IsPrimary,
		})
	}

	l.Infof("成功查询部门用户: dept=%s, recursive=%v, 用户数=%d", org.Name, req.Recursive, len(result))

	return &types.GetOrgUsersResp{
		Users: result,
	}, nil
}
