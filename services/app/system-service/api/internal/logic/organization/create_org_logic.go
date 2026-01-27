// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"
	"strings"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/organization"
	baseErrorx "github.com/DataSemanticHub/services/app/system-service/pkg/errorx"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateOrgLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建组织
func NewCreateOrgLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateOrgLogic {
	return &CreateOrgLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateOrgLogic) CreateOrg(req *types.CreateOrgReq) (resp *types.CreateOrgResp, err error) {
	// 1. 参数校验（validator 已在 handler 层处理）
	if strings.TrimSpace(req.Name) == "" {
		return nil, baseErrorx.New(errorx.ErrCodeOrgParamInvalid, "部门名称不能为空")
	}

	// 2. 校验父节点存在（如果不是根节点）
	if req.ParentId != "" && req.ParentId != "0" {
		_, err = l.svcCtx.OrgModel.FindOne(l.ctx, req.ParentId)
		if err != nil {
			l.Errorf("查询父节点失败: %v", err)
			return nil, baseErrorx.NewWithCode(errorx.ErrCodeOrgParentNotFound)
		}
	}

	// 3. 校验同级名称唯一
	existingOrg, err := l.svcCtx.OrgModel.FindByParentAndName(l.ctx, req.ParentId, req.Name)
	if err == nil && existingOrg != nil {
		l.Errorf("同级已存在同名部门: %s", req.Name)
		return nil, baseErrorx.New(errorx.ErrCodeOrgNameDuplicate, "同级已存在同名部门")
	}

	// 4. 构建 Org 对象（ancestors 将由 Insert 方法自动计算）
	now := time.Now().Format("2006-01-02 15:04:05")
	org := &organization.SysOrganization{
		ParentId:  req.ParentId,
		Name:      req.Name,
		Code:      req.Code,
		SortOrder: req.SortOrder,
		LeaderId:  req.LeaderId,
		Type:      req.Type,
		Status:    1, // 默认启用
		Desc:      req.Desc,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// 5. 创建部门
	result, err := l.svcCtx.OrgModel.Insert(l.ctx, org)
	if err != nil {
		l.Errorf("创建部门失败: %v", err)
		return nil, err
	}

	// 6. TODO: 记录审计日志
	// l.svcCtx.AuditLogModel.Record(l.ctx, "create", "org", result.Id, nil, result)

	l.Infof("成功创建部门: id=%s, name=%s, parentId=%s", result.Id, result.Name, result.ParentId)

	return &types.CreateOrgResp{Id: result.Id}, nil
}
