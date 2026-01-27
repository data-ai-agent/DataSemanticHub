// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package permission_template

import (
	"context"
	"encoding/json"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/zeromicro/go-zero/core/logx"
)

type PublishPermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPublishPermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PublishPermissionTemplateLogic {
	return &PublishPermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PublishPermissionTemplateLogic) PublishPermissionTemplate(req *types.PublishPermissionTemplateReq) (resp *types.PublishPermissionTemplateResp, err error) {
	// 1. 查询模板
	template, err := l.svcCtx.PermissionTemplateModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询权限模板失败: %v", err)
		return nil, err
	}

	// 2. 校验模板状态为草稿
	if template.Status != permissiontemplatemodel.StatusDraft {
		l.Errorf("只有草稿状态的模板可以发布，当前状态: %s", template.Status)
		return nil, permissiontemplatemodel.ErrPermissionTemplateStatusTransitionInvalid
	}

	// 3. 校验策略矩阵非空
	var policyMatrix map[string]interface{}
	if err := json.Unmarshal(template.PolicyMatrix, &policyMatrix); err != nil {
		l.Errorf("解析策略矩阵失败: %v", err)
		return nil, err
	}
	if len(policyMatrix) == 0 {
		l.Errorf("策略矩阵为空，无法发布")
		return nil, permissiontemplatemodel.ErrPermissionTemplateEmptyPolicyMatrix
	}

	// 4. 递增版本号并更新状态为已发布
	newVersion := template.Version + 1
	err = l.svcCtx.PermissionTemplateModel.UpdateVersionWithStatus(l.ctx, req.Id, newVersion, permissiontemplatemodel.StatusPublished)
	if err != nil {
		l.Errorf("发布权限模板失败: %v", err)
		return nil, err
	}

	logx.Infof("发布权限模板成功: id=%s, code=%s, version=%d", req.Id, template.Code, newVersion)

	return &types.PublishPermissionTemplateResp{
		Success: true,
		Version: newVersion,
	}, nil
}
