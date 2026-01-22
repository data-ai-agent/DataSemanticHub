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
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 用户详情查询
func NewGetUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserLogic {
	return &GetUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserLogic) GetUser(userId string) (resp *types.GetUserResp, err error) {
	// 1. 参数校验
	if userId == "" {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户ID不能为空")
	}

	// 2. 查询用户基本信息
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		l.Errorf("查询用户信息失败: %v", err)
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
	}

	if user == nil {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
	}

	// 3. 查询角色绑定列表
	roleBindings, err := l.svcCtx.RoleBindingModel.FindByUserId(l.ctx, userId)
	if err != nil {
		l.Errorf("查询角色绑定失败: %v", err)
		// 角色绑定查询失败不影响主流程，返回空列表
		roleBindings = []*rolebindings.RoleBinding{}
	}

	// 4. 查询审计日志列表（默认查询最近10条）
	auditLogs, _, err := l.svcCtx.AuditLogModel.FindByUserId(l.ctx, userId, 1, 10)
	if err != nil {
		l.Errorf("查询审计日志失败: %v", err)
		// 审计日志查询失败不影响主流程，返回空列表
		auditLogs = []*auditlogs.AuditLog{}
	}

	// 5. 组装响应数据
	return &types.GetUserResp{
		User:         l.convertUserToResponse(user),
		RoleBindings: l.convertRoleBindingsToResponse(roleBindings),
		AuditLogs:    l.convertAuditLogsToResponse(auditLogs),
	}, nil
}

// convertUserToResponse 将 Model 层的 User 转换为 API 层的 User
func (l *GetUserLogic) convertUserToResponse(user *users.User) types.User {
	userResp := types.User{
		Id:            user.Id,
		Name:          user.Name,
		Email:         user.Email,
		Status:        user.Status,
		AccountSource: user.AccountSource,
		CreatedAt:     user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     user.UpdatedAt.Format(time.RFC3339),
	}

	// 处理可选字段
	if user.Phone != nil {
		userResp.Phone = *user.Phone
	}
	if user.DeptId != nil {
		userResp.DeptId = *user.DeptId
	}
	if user.LastLoginAt != nil {
		userResp.LastLogin = user.LastLoginAt.Format(time.RFC3339)
	}
	if user.CreatedBy != nil {
		userResp.CreatedBy = *user.CreatedBy
	}
	if user.UpdatedBy != nil {
		userResp.UpdatedBy = *user.UpdatedBy
	}

	return userResp
}

// convertRoleBindingsToResponse 将 Model 层的 RoleBinding 转换为 API 层的 RoleBinding
func (l *GetUserLogic) convertRoleBindingsToResponse(roleBindings []*rolebindings.RoleBinding) []types.RoleBinding {
	result := make([]types.RoleBinding, 0, len(roleBindings))
	for _, rb := range roleBindings {
		roleBinding := types.RoleBinding{
			Id:     rb.Id,
			UserId: rb.UserId,
			OrgId:  rb.OrgId,
		}
		if rb.Position != nil {
			roleBinding.Position = *rb.Position
		}
		if rb.PermissionRole != nil {
			roleBinding.PermissionRole = *rb.PermissionRole
		}
		result = append(result, roleBinding)
	}
	return result
}

// convertAuditLogsToResponse 将 Model 层的 AuditLog 转换为 API 层的 AuditLog
func (l *GetUserLogic) convertAuditLogsToResponse(auditLogs []*auditlogs.AuditLog) []types.AuditLog {
	result := make([]types.AuditLog, 0, len(auditLogs))
	for _, al := range auditLogs {
		auditLog := types.AuditLog{
			Id:         al.Id,
			Action:     al.Action,
			Operator:   al.Operator,
			OperatorId: al.OperatorId,
			Timestamp:  al.Timestamp.Format(time.RFC3339),
		}
		// 解析 JSON 字段
		if len(al.Changes) > 0 {
			var changes map[string]interface{}
			if err := json.Unmarshal(al.Changes, &changes); err == nil {
				auditLog.Changes = changes
			}
		}
		result = append(result, auditLog)
	}
	return result
}
