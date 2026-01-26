// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"encoding/json"
	"strings"
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

type BatchUpdateStatusLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 批量更新用户状态
func NewBatchUpdateStatusLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BatchUpdateStatusLogic {
	return &BatchUpdateStatusLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *BatchUpdateStatusLogic) BatchUpdateStatus(req *types.BatchUpdateStatusReq) (resp *types.BatchUpdateStatusResp, err error) {
	// 1. 参数校验
	if err := l.validateBatchUpdateStatus(req); err != nil {
		return nil, err
	}

	// 2. 获取当前操作人信息（从 context 中获取）
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

	// 3. 检查自我操作限制（不能操作自己）
	for _, userId := range req.UserIds {
		if userId == operatorID {
			return nil, baseErrorx.New(errorx.ErrUserManagementCannotOperateSelf, "不能操作自己的账号")
		}
	}

	// 4. 批量查询用户，验证用户是否存在
	var userList []*users.User
	for _, userId := range req.UserIds {
		user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
		if err != nil {
			if err == users.ErrUserNotFound {
				continue // 不存在的用户会在后续处理中记录错误
			}
			l.Errorf("查询用户失败: %v", err)
			continue
		}
		if user != nil {
			userList = append(userList, user)
		}
	}

	// 5. 检查关键责任人影响面（暂简单实现，后续接入业务模块）
	// TODO: 后续接入业务模块检查关键责任人
	// 这里暂时跳过，仅记录日志
	if len(userList) > 0 {
		l.Infof("批量更新用户状态，涉及 %d 个用户，暂未检查关键责任人影响面", len(userList))
	}

	// 6. 准备锁定信息（如果状态为锁定）
	var lockReason *string
	var lockBy *string
	if req.Status == 3 {
		// 锁定状态需要锁定原因
		if strings.TrimSpace(req.Reason) == "" {
			return nil, baseErrorx.New(errorx.ErrUserManagementLockReasonRequired, "锁定用户时必须提供锁定原因")
		}
		reason := strings.TrimSpace(req.Reason)
		lockReason = &reason
		lockBy = &operatorID
	}

	// 7. 批量更新状态
	userIds := make([]string, 0, len(userList))
	for _, user := range userList {
		userIds = append(userIds, user.Id)
	}

	successIds, batchErrors, err := l.svcCtx.UserModel.BatchUpdateStatus(l.ctx, userIds, req.Status, lockReason, lockBy)
	if err != nil {
		l.Errorf("批量更新用户状态失败: %v", err)
		return nil, baseErrorx.New(50000, "批量更新用户状态失败")
	}

	// 8. 构建错误列表（包含不存在的用户和批量更新失败的用户）
	errors := make([]types.OperationError, 0)

	// 添加不存在的用户错误
	successUserIds := make(map[string]bool)
	for _, id := range successIds {
		successUserIds[id] = true
	}
	for _, userId := range req.UserIds {
		if !successUserIds[userId] {
			// 检查是否已经在 batchErrors 中
			found := false
			for _, batchErr := range batchErrors {
				if batchErr.UserId == userId {
					errors = append(errors, types.OperationError{
						UserId: batchErr.UserId,
						Reason: batchErr.Reason,
					})
					found = true
					break
				}
			}
			if !found {
				errors = append(errors, types.OperationError{
					UserId: userId,
					Reason: "用户不存在",
				})
			}
		}
	}

	// 添加批量更新失败的用户错误
	for _, batchErr := range batchErrors {
		// 避免重复添加
		exists := false
		for _, err := range errors {
			if err.UserId == batchErr.UserId {
				exists = true
				break
			}
		}
		if !exists {
			errors = append(errors, types.OperationError{
				UserId: batchErr.UserId,
				Reason: batchErr.Reason,
			})
		}
	}

	// 9. 记录审计日志（为每个成功更新的用户记录）
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)

		for _, userId := range successIds {
			changes := map[string]interface{}{
				"status": map[string]interface{}{
					"new": req.Status,
				},
			}
			if req.Status == 3 && lockReason != nil {
				changes["lock_reason"] = map[string]interface{}{
					"new": *lockReason,
				}
			}

			changesJSON, _ := json.Marshal(changes)
			auditLog := &auditlogs.AuditLog{
				UserId:     userId,
				Action:     "batch_update_status",
				Operator:   operatorName,
				OperatorId: operatorID,
				Changes:    datatypes.JSON(changesJSON),
				Timestamp:  time.Now(),
			}
			_, err := auditLogModel.Insert(l.ctx, auditLog)
			if err != nil {
				l.Errorf("记录审计日志失败: %v", err)
				// 审计日志失败不影响主流程，仅记录错误
			}
		}

		return nil
	})

	if err != nil {
		l.Errorf("记录审计日志事务失败: %v", err)
		// 审计日志失败不影响主流程，仅记录错误
	}

	// 10. 返回响应
	return &types.BatchUpdateStatusResp{
		SuccessCount: len(successIds),
		FailedCount:  len(errors),
		Errors:       errors,
	}, nil
}

// validateBatchUpdateStatus 校验批量更新状态参数
func (l *BatchUpdateStatusLogic) validateBatchUpdateStatus(req *types.BatchUpdateStatusReq) error {
	// 用户ID列表校验
	if len(req.UserIds) == 0 {
		return baseErrorx.New(20001, "用户ID列表不能为空")
	}
	if len(req.UserIds) > 100 {
		return baseErrorx.New(20002, "一次最多只能更新100个用户")
	}

	// 状态值校验
	if req.Status < 1 || req.Status > 4 {
		return baseErrorx.New(20002, "状态值必须在1-4之间")
	}

	// 去重用户ID
	uniqueUserIds := make(map[string]bool)
	for _, userId := range req.UserIds {
		userId = strings.TrimSpace(userId)
		if userId == "" {
			return baseErrorx.New(20001, "用户ID不能为空")
		}
		uniqueUserIds[userId] = true
	}

	// 更新去重后的用户ID列表
	req.UserIds = make([]string, 0, len(uniqueUserIds))
	for userId := range uniqueUserIds {
		req.UserIds = append(req.UserIds, userId)
	}

	return nil
}
