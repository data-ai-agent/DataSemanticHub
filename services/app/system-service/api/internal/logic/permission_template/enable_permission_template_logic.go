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

type EnablePermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewEnablePermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *EnablePermissionTemplateLogic {
	return &EnablePermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *EnablePermissionTemplateLogic) EnablePermissionTemplate(req *types.EnablePermissionTemplateReq) (resp *types.EnablePermissionTemplateResp, err error) {
	// 1. 查询模板
	template, err := l.svcCtx.PermissionTemplateModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询权限模板失败: %v", err)
		return nil, err
	}

	// 2. 校验模板状态为已停用
	if template.Status != permissiontemplatemodel.StatusDisabled {
		l.Errorf("只有已停用状态的模板可以重新启用，当前状态: %s", template.Status)
		return nil, permissiontemplatemodel.ErrPermissionTemplateNotDisabled
	}

	// 3. 更新状态为已发布
	err = l.svcCtx.PermissionTemplateModel.UpdateStatus(l.ctx, req.Id, permissiontemplatemodel.StatusPublished)
	if err != nil {
		l.Errorf("重新启用权限模板失败: %v", err)
		return nil, err
	}

	logx.Infof("重新启用权限模板成功: id=%s, code=%s", req.Id, template.Code)

	return &types.EnablePermissionTemplateResp{
		Success: true,
	}, nil
}
