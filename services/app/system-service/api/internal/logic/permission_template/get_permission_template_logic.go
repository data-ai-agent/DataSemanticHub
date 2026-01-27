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

type GetPermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetPermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPermissionTemplateLogic {
	return &GetPermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPermissionTemplateLogic) GetPermissionTemplate(req *types.GetPermissionTemplateReq) (resp *types.GetPermissionTemplateResp, err error) {
	// 1. 参数校验
	if req.Id == "" {
		return nil, permissiontemplatemodel.ErrPermissionTemplateNotFound
	}

	// 2. 查询权限模板详情
	template, err := l.svcCtx.PermissionTemplateModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询权限模板详情失败: %v", err)
		return nil, err
	}

	// 3. 查询模板使用统计
	stats, err := l.svcCtx.PermissionTemplateModel.GetUsageStats(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("查询权限模板使用统计失败: %v", err)
		// 使用统计查询失败不影响主流程，继续返回模板详情
		stats = &permissiontemplatemodel.UsageStats{}
	}

	// 4. 转换为响应类型
	detail := l.convertToDetail(template, stats)

	return &types.GetPermissionTemplateResp{
		Data: detail,
	}, nil
}

// convertToDetail 将 Model 层的 PermissionTemplate 转换为 types.PermissionTemplateDetail
func (l *GetPermissionTemplateLogic) convertToDetail(template *permissiontemplatemodel.PermissionTemplate, stats *permissiontemplatemodel.UsageStats) types.PermissionTemplateDetail {
	detail := types.PermissionTemplateDetail{
		Id:              template.Id,
		Name:            template.Name,
		Code:            template.Code,
		Description:     template.Description,
		Status:          template.Status,
		ScopeSuggestion: template.ScopeSuggestion,
		Version:         template.Version,
		UsedByRoleCount: stats.UsedByRoleCount,
		CreatedBy:       template.CreatedBy,
		CreatedAt:       template.CreatedAt.Format("2006-01-02 15:04:05.000"),
		UpdatedBy:       "",
		UpdatedAt:       template.UpdatedAt.Format("2006-01-02 15:04:05.000"),
	}

	// 处理可选字段
	if template.UpdatedBy != nil {
		detail.UpdatedBy = *template.UpdatedBy
	}

	// 处理最后应用时间
	if stats.LastAppliedAt != nil {
		detail.LastAppliedAt = stats.LastAppliedAt.Format("2006-01-02 15:04:05.000")
	}

	// 解析 JSON 字段
	if len(template.PolicyMatrix) > 0 {
		var policyMatrix map[string]types.PolicyMatrixEntry
		if err := json.Unmarshal(template.PolicyMatrix, &policyMatrix); err == nil {
			detail.PolicyMatrix = policyMatrix
		}
	}

	if len(template.AdvancedPerms) > 0 {
		var advancedPerms map[string]types.AdvancedPermEntry
		if err := json.Unmarshal(template.AdvancedPerms, &advancedPerms); err == nil {
			detail.AdvancedPerms = advancedPerms
		}
	}

	return detail
}
