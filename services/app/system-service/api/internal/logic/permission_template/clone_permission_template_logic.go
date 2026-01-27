// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package permission_template

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type ClonePermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewClonePermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ClonePermissionTemplateLogic {
	return &ClonePermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ClonePermissionTemplateLogic) ClonePermissionTemplate(req *types.ClonePermissionTemplateReq) (resp *types.ClonePermissionTemplateResp, err error) {
	// 1. 查询源模板
	sourceTemplate, err := l.svcCtx.PermissionTemplateModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询源权限模板失败: %v", err)
		return nil, err
	}

	// 2. 校验新编码的唯一性
	existing, err := l.svcCtx.PermissionTemplateModel.FindOneByCodeIncludingDeleted(l.ctx, req.Code)
	if err != nil && err != permissiontemplatemodel.ErrPermissionTemplateNotFound {
		l.Errorf("查询编码唯一性失败: %v", err)
		return nil, err
	}
	if existing != nil {
		l.Errorf("编码已存在: %s", req.Code)
		return nil, permissiontemplatemodel.ErrPermissionTemplateCodeExists
	}

	// 3. 生成新 UUID v7
	newId, err := uuid.NewV7()
	if err != nil {
		l.Errorf("生成UUID v7失败: %v", err)
		return nil, err
	}

	// 4. 创建新模板（复制源模板的数据）
	clonedTemplate := &permissiontemplatemodel.PermissionTemplate{
		Id:              newId.String(),
		Name:            req.Name,
		Code:            req.Code,
		Description:     sourceTemplate.Description,
		Status:          permissiontemplatemodel.StatusDraft, // 复制的模板默认为草稿状态
		ScopeSuggestion: sourceTemplate.ScopeSuggestion,
		PolicyMatrix:    sourceTemplate.PolicyMatrix,  // 直接复制 JSON
		AdvancedPerms:   sourceTemplate.AdvancedPerms, // 直接复制 JSON
		Version:         1,                            // 新模板版本从 1 开始
		CreatedBy:       "system",                     // TODO: 从 context 中获取当前用户ID
	}

	// 5. 插入新模板
	result, err := l.svcCtx.PermissionTemplateModel.Insert(l.ctx, clonedTemplate)
	if err != nil {
		l.Errorf("创建克隆模板失败: %v", err)
		return nil, err
	}

	logx.Infof("克隆权限模板成功: 源模板=%s, 新模板=%s, 新编码=%s", req.Id, result.Id, req.Code)

	return &types.ClonePermissionTemplateResp{
		Id: result.Id,
	}, nil
}
