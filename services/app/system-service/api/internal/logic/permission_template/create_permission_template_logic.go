// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package permission_template

import (
	"context"
	"encoding/json"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	permissiontemplatemodel "github.com/DataSemanticHub/services/app/system-service/model/system/permission_template"

	"github.com/google/uuid"
	"github.com/zeromicro/go-zero/core/logx"
)

type CreatePermissionTemplateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreatePermissionTemplateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreatePermissionTemplateLogic {
	return &CreatePermissionTemplateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreatePermissionTemplateLogic) CreatePermissionTemplate(req *types.CreatePermissionTemplateReq) (resp *types.CreatePermissionTemplateResp, err error) {
	// 1. 生成 UUID v7 主键
	id, err := uuid.NewV7()
	if err != nil {
		l.Errorf("生成UUID v7失败: %v", err)
		return nil, err
	}

	// 2. 校验编码唯一性（排除已删除的记录）
	existing, err := l.svcCtx.PermissionTemplateModel.FindOneByCodeIncludingDeleted(l.ctx, req.Code)
	if err != nil && err != permissiontemplatemodel.ErrPermissionTemplateNotFound {
		l.Errorf("查询编码唯一性失败: %v", err)
		return nil, err
	}
	if existing != nil {
		l.Errorf("编码已存在: %s", req.Code)
		return nil, permissiontemplatemodel.ErrPermissionTemplateCodeExists
	}

	// 3. 序列化 JSON 字段
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

	// 4. 处理可选字段（空字符串转为 nil）
	var description *string
	if req.Description != "" {
		description = &req.Description
	}

	var scopeSuggestion *string
	if req.ScopeSuggestion != "" {
		scopeSuggestion = &req.ScopeSuggestion
	}

	// 5. 构建 PermissionTemplate 实体
	template := &permissiontemplatemodel.PermissionTemplate{
		Id:              id.String(),
		Name:            req.Name,
		Code:            req.Code,
		Description:     description,
		Status:          permissiontemplatemodel.StatusDraft, // 默认为草稿状态
		ScopeSuggestion: scopeSuggestion,
		PolicyMatrix:    policyMatrixJSON,
		AdvancedPerms:   advancedPermsJSON,
		Version:         1,
		CreatedBy:       "system", // TODO: 从 context 中获取当前用户ID
	}

	// 5. 插入数据库
	result, err := l.svcCtx.PermissionTemplateModel.Insert(l.ctx, template)
	if err != nil {
		l.Errorf("创建权限模板失败: %v", err)
		return nil, err
	}

	logx.Infof("创建权限模板成功: id=%s, code=%s, name=%s", result.Id, result.Code, result.Name)

	return &types.CreatePermissionTemplateResp{
		Id: result.Id,
	}, nil
}
