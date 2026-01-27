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

type UpdatePermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdatePermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdatePermissionTemplateLogic {
	return &UpdatePermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdatePermissionTemplateLogic) UpdatePermissionTemplate(req *types.UpdatePermissionTemplateReq) (resp *types.UpdatePermissionTemplateResp, err error) {
	// 1. 查询模板是否存在
	template, err := l.svcCtx.PermissionTemplateModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询权限模板失败: %v", err)
		return nil, err
	}

	// 2. 校验模板状态为草稿（只有草稿状态可以编辑）
	if template.Status != permissiontemplatemodel.StatusDraft {
		l.Errorf("只有草稿状态的模板可以编辑，当前状态: %s", template.Status)
		return nil, permissiontemplatemodel.ErrPermissionTemplateNotDraft
	}

	// 3. 如果编码发生变化，校验新编码的唯一性
	if template.Code != req.Code {
		existing, err := l.svcCtx.PermissionTemplateModel.FindOneByCodeIncludingDeleted(l.ctx, req.Code)
		if err != nil && err != permissiontemplatemodel.ErrPermissionTemplateNotFound {
			l.Errorf("查询编码唯一性失败: %v", err)
			return nil, err
		}
		if existing != nil {
			l.Errorf("编码已存在: %s", req.Code)
			return nil, permissiontemplatemodel.ErrPermissionTemplateCodeExists
		}
	}

	// 4. 序列化 JSON 字段
	policyMatrixJSON, err := json.Marshal(req.PolicyMatrix)
	if err != nil {
		l.Errorf("序列化策略矩阵失败: %v", err)
		return nil, err
	}

	var advancedPermsJSON []byte
	if req.AdvancedPerms != nil {
		advancedPermsJSON, err = json.Marshal(req.AdvancedPerms)
		if err != nil {
			l.Errorf("序列化高级权限点失败: %v", err)
			return nil, err
		}
	}

	// 5. 处理可选字段（空字符串转为 nil）
	var description *string
	if req.Description != "" {
		description = &req.Description
	}

	var scopeSuggestion *string
	if req.ScopeSuggestion != "" {
		scopeSuggestion = &req.ScopeSuggestion
	}

	// 6. 更新模板字段
	template.Name = req.Name
	template.Code = req.Code
	template.Description = description
	template.ScopeSuggestion = scopeSuggestion
	template.PolicyMatrix = policyMatrixJSON
	template.AdvancedPerms = advancedPermsJSON
	// UpdatedBy 和 UpdatedAt 由 GORM 自动处理

	// 6. 保存更新
	err = l.svcCtx.PermissionTemplateModel.Update(l.ctx, template)
	if err != nil {
		l.Errorf("更新权限模板失败: %v", err)
		return nil, err
	}

	logx.Infof("更新权限模板成功: id=%s, code=%s, name=%s", template.Id, template.Code, template.Name)

	return &types.UpdatePermissionTemplateResp{
		Success: true,
	}, nil
}
