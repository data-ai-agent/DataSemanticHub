// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"encoding/json"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type DeleteUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 删除用户
func NewDeleteUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteUserLogic {
	return &DeleteUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteUserLogic) DeleteUser(userId string, req *types.DeleteUserReq) (resp *types.DeleteUserResp, err error) {
	// 1. 参数校验
	if userId == "" {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户ID不能为空")
	}

	// 2. 获取当前操作人信息（从 context 中获取）
	var operatorID string
	var operatorName string
	if operatorIDValue := l.ctx.Value("user_id"); operatorIDValue != nil {
		if operatorIDStr, ok := operatorIDValue.(string); ok {
			operatorID = operatorIDStr
			// 尝试获取操作人姓名
			if operatorUser, err := l.svcCtx.UserModel.FindOne(l.ctx, operatorID); err == nil && operatorUser != nil {
				operatorName = operatorUser.Name
			}
		}
	}
	if operatorID == "" {
		operatorID = "system"
		operatorName = "System"
	}

	// 3. 检查自我操作限制（不能删除自己）
	if userId == operatorID {
		return nil, baseErrorx.New(errorx.ErrUserManagementCannotOperateSelf, "不能删除自己的账号")
	}

	// 4. 查询用户是否存在
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		if err == users.ErrUserNotFound {
			return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
		}
		l.Errorf("查询用户信息失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}
	if user == nil {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
	}

	// 5. 检查关键责任人影响面（暂简单实现，后续接入业务模块）
	// TODO: 后续接入业务模块检查关键责任人
	// 这里暂时跳过，仅记录日志
	l.Infof("删除用户 %s，暂未检查关键责任人影响面", userId)

	// 6. 处理责任转交（如果提供 transferTo）
	impactsTransferred := false
	if req.TransferTo != "" {
		// 验证转交目标用户是否存在
		transferToUser, err := l.svcCtx.UserModel.FindOne(l.ctx, req.TransferTo)
		if err != nil {
			if err == users.ErrUserNotFound {
				return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "转交目标用户不存在")
			}
			l.Errorf("查询转交目标用户失败: %v", err)
			return nil, baseErrorx.New(50000, "系统错误")
		}
		if transferToUser == nil {
			return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "转交目标用户不存在")
		}

		// TODO: 实现责任转交逻辑
		// 这里暂时只记录日志，后续接入业务模块实现具体的转交逻辑
		l.Infof("将用户 %s 的责任转交给 %s", userId, req.TransferTo)
		impactsTransferred = true
	}

	// 7. 使用事务更新状态和记录审计日志
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		// 7.1 更新状态为"归档"（status=4），实现软删除
		err := l.svcCtx.UserModel.UpdateStatus(l.ctx, userId, 4, nil, nil)
		if err != nil {
			if err == users.ErrUserNotFound {
				return baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
			}
			l.Errorf("更新用户状态失败: %v", err)
			return baseErrorx.New(50000, "更新用户状态失败")
		}

		// 7.2 如果 force=true，执行硬删除（物理删除）
		if req.Force {
			err = l.svcCtx.UserModel.Delete(l.ctx, userId)
			if err != nil {
				l.Errorf("删除用户失败: %v", err)
				return baseErrorx.New(50000, "删除用户失败")
			}
		}

		// 7.3 记录审计日志
		auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)
		changes := map[string]interface{}{
			"status": map[string]interface{}{
				"old": user.Status,
				"new": 4, // 归档
			},
		}
		if req.TransferTo != "" {
			changes["transfer_to"] = map[string]interface{}{
				"new": req.TransferTo,
			}
		}
		if req.Force {
			changes["force_delete"] = map[string]interface{}{
				"new": true,
			}
		}
		changesJSON, _ := json.Marshal(changes)

		auditLog := &auditlogs.AuditLog{
			UserId:     userId,
			Action:     "delete",
			Operator:   operatorName,
			OperatorId: operatorID,
			Changes:    datatypes.JSON(changesJSON),
			Timestamp:  time.Now(),
		}
		_, err = auditLogModel.Insert(l.ctx, auditLog)
		if err != nil {
			l.Errorf("记录审计日志失败: %v", err)
			// 审计日志失败不影响主流程，仅记录错误
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 8. 返回响应
	return &types.DeleteUserResp{
		Archived:           !req.Force, // 如果不是强制删除，则为归档
		ImpactsTransferred: impactsTransferred,
	}, nil
}
