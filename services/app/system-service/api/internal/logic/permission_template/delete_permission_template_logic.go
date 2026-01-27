// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package permission_template

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeletePermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeletePermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeletePermissionTemplateLogic {
	return &DeletePermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeletePermissionTemplateLogic) DeletePermissionTemplate(req *types.DeletePermissionTemplateReq) (resp *types.DeletePermissionTemplateResp, err error) {
	// 1. 查询模板使用统计
	stats, err := l.svcCtx.PermissionTemplateModel.GetUsageStats(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询模板使用统计失败: %v", err)
		return nil, err
	}

	// 2. 校验模板未被角色引用
	if stats.UsedByRoleCount > 0 {
		l.Errorf("模板正在被 %d 个角色引用，无法删除", stats.UsedByRoleCount)
		return nil, permissiontemplatemodel.ErrPermissionTemplateInUse
	}

	// 3. 执行软删除
	err = l.svcCtx.PermissionTemplateModel.Delete(l.ctx, req.Id)
	if err != nil {
		l.Errorf("删除权限模板失败: %v", err)
		return nil, err
	}

	logx.Infof("删除权限模板成功: id=%s", req.Id)

	return &types.DeletePermissionTemplateResp{
		Success: true,
	}, nil
}
