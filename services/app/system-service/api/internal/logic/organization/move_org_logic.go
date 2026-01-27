// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	baseErrorx "github.com/DataSemanticHub/services/app/system-service/pkg/errorx"

	"github.com/zeromicro/go-zero/core/logx"
)

type MoveOrgLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 移动组织
func NewMoveOrgLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MoveOrgLogic {
	return &MoveOrgLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MoveOrgLogic) MoveOrg(req *types.MoveOrgReq) (resp *types.MoveOrgResp, err error) {
	// 1. 校验节点存在
	org, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.Id)
	if err != nil {
		l.Errorf("查询部门失败: %v", err)
		return nil, baseErrorx.NewWithCode(errorx.ErrCodeOrgNotFound)
	}

	// 2. 校验目标父节点存在
	if req.TargetParentId != "0" {
		_, err = l.svcCtx.OrgModel.FindOne(l.ctx, req.TargetParentId)
		if err != nil {
			l.Errorf("查询目标父节点失败: %v", err)
			return nil, baseErrorx.NewWithCode(errorx.ErrCodeOrgParentNotFound)
		}
	}

	// 3. 环路检测：不能将节点移动到其子孙节点下
	if req.TargetParentId != "0" && req.TargetParentId != org.Id {
		isDescendant, err := l.svcCtx.OrgModel.IsDescendant(l.ctx, req.Id, req.TargetParentId)
		if err != nil {
			l.Errorf("环路检测失败: %v", err)
			return nil, err
		}
		if isDescendant {
			l.Errorf("无法移动：目标父节点 %s 是当前节点的子孙", req.TargetParentId)
			return nil, baseErrorx.New(errorx.ErrCodeOrgMoveCycle, "不能将节点移动到其子孙节点下")
		}
	}

	// 4. 不能移动到自己下
	if req.TargetParentId == req.Id {
		return nil, baseErrorx.New(errorx.ErrCodeOrgParamInvalid, "不能将节点移动到自己下")
	}

	// 5. 获取旧祖先路径
	oldAncestors := org.Ancestors
	oldParentId := org.ParentId

	// 6. 计算新祖先路径
	var newAncestors string
	if req.TargetParentId == "0" {
		newAncestors = "0"
	} else {
		targetParent, err := l.svcCtx.OrgModel.FindOne(l.ctx, req.TargetParentId)
		if err != nil {
			l.Errorf("查询目标父节点失败: %v", err)
			return nil, err
		}
		newAncestors = l.svcCtx.OrgTreeService.CalculateAncestors(targetParent.Ancestors, targetParent.Id)
	}

	// 7. 更新当前节点
	org.ParentId = req.TargetParentId
	org.Ancestors = newAncestors
	err = l.svcCtx.OrgModel.Update(l.ctx, org)
	if err != nil {
		l.Errorf("更新部门失败: %v", err)
		return nil, err
	}

	// 8. 批量更新所有子孙节点的 ancestors
	if oldAncestors != newAncestors {
		// 构建新旧前缀
		oldPrefix := oldAncestors + "," + req.Id
		newPrefix := newAncestors + "," + req.Id

		err = l.svcCtx.OrgTreeService.UpdateDescendantsAncestors(l.ctx, req.Id, oldPrefix, newPrefix)
		if err != nil {
			l.Errorf("更新子孙节点失败: %v", err)
			// 回滚当前节点的更新
			org.ParentId = oldParentId
			org.Ancestors = oldAncestors
			_ = l.svcCtx.OrgModel.Update(l.ctx, org)
			return nil, err
		}
	}

	// 7. TODO: 记录审计日志
	// l.svcCtx.AuditLogModel.Record(l.ctx, "move", "org", req.Id, map[string]interface{}{
	//     "old_parent_id": oldParentId,
	//     "new_parent_id": req.TargetParentId,
	//     "old_ancestors": oldAncestors,
	// }, nil)

	l.Infof("成功移动部门: id=%s, name=%s, oldParentId=%s, newParentId=%s", req.Id, org.Name, oldParentId, req.TargetParentId)

	return &types.MoveOrgResp{Success: true}, nil
}
