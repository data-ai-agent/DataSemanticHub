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

type ListPermissionTemplatesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListPermissionTemplatesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListPermissionTemplatesLogic {
	return &ListPermissionTemplatesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListPermissionTemplatesLogic) ListPermissionTemplates(req *types.ListPermissionTemplatesReq) (resp *types.ListPermissionTemplatesResp, err error) {
	// 构建查询过滤器
	filter := &permissiontemplatemodel.ListFilter{
		Keyword:         req.Keyword,
		Status:          req.Status,
		ScopeSuggestion: req.ScopeSuggestion,
		Page:            req.Page,
		PageSize:        req.PageSize,
	}

	// 查询权限模板列表
	templates, total, err := l.svcCtx.PermissionTemplateModel.List(l.ctx, filter)
	if err != nil {
		logx.Errorf("查询权限模板列表失败: %v", err)
		return nil, err
	}

	// 转换为响应类型
	items := make([]types.PermissionTemplateItem, 0, len(templates))
	for _, tpl := range templates {
		item := types.PermissionTemplateItem{
			Id:              tpl.Id,
			Name:            tpl.Name,
			Code:            tpl.Code,
			Status:          tpl.Status,
			ScopeSuggestion: "",
			Version:         tpl.Version,
			UpdatedAt:       tpl.UpdatedAt.Format("2006-01-02 15:04:05.000"),
		}

		// 处理可选字段
		if tpl.ScopeSuggestion != nil {
			item.ScopeSuggestion = *tpl.ScopeSuggestion
		}

		items = append(items, item)
	}

	return &types.ListPermissionTemplatesResp{
		Total: total,
		Data:  items,
	}, nil
}
