// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"encoding/json"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
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

type UnlockUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 解锁用户
func NewUnlockUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UnlockUserLogic {
	return &UnlockUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UnlockUserLogic) UnlockUser(userId string, req *types.UnlockUserReq) (resp *types.EmptyResp, err error) {
	// 1. 参数校验
	if userId == "" {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户ID不能为空")
	}

	// 2. 查询用户是否存在
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

	// 3. 检查用户状态是否为"锁定"（status=3）
	if user.Status != 3 {
		return nil, baseErrorx.New(errorx.ErrUserManagementInvalidStatus, "用户状态不是锁定状态，无法解锁")
	}

	// 4. 获取当前操作人信息（从 context 中获取）
	var operatorID string
	var operatorName string
	if operatorIDValue := l.ctx.Value(contextkeys.UserIDKey); operatorIDValue != nil {
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

	// 5. 使用事务更新状态和记录审计日志
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		// 5.1 更新状态为"启用"（status=1），并清空锁定相关信息
		err := l.svcCtx.UserModel.UpdateStatus(l.ctx, userId, 1, nil, nil)
		if err != nil {
			if err == users.ErrUserNotFound {
				return baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
			}
			l.Errorf("更新用户状态失败: %v", err)
			return baseErrorx.New(50000, "更新用户状态失败")
		}

		// 5.2 记录审计日志
		auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)
		changes := map[string]interface{}{
			"status": map[string]interface{}{
				"old": 3,
				"new": 1,
			},
			"lock_reason": map[string]interface{}{
				"old": user.LockReason,
				"new": nil,
			},
			"lock_time": map[string]interface{}{
				"old": user.LockTime,
				"new": nil,
			},
			"lock_by": map[string]interface{}{
				"old": user.LockBy,
				"new": nil,
			},
		}
		changesJSON, _ := json.Marshal(changes)

		auditLog := &auditlogs.AuditLog{
			UserId:     userId,
			Action:     "unlock",
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

	// 6. 返回响应
	return &types.EmptyResp{}, nil
}
