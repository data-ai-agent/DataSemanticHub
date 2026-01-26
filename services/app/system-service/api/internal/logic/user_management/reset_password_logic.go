// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"encoding/json"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ResetPasswordLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 重置用户密码
func NewResetPasswordLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ResetPasswordLogic {
	return &ResetPasswordLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ResetPasswordLogic) ResetPassword(userId string, req *types.ResetPasswordReq) (resp *types.ResetPasswordResp, err error) {
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

	// 3. 检查账号来源（仅支持local账号）
	if user.AccountSource != "local" {
		return nil, baseErrorx.New(errorx.ErrUserManagementOnlyLocalAccount, "仅本地账号支持密码重置")
	}

	// 4. 生成临时密码或使用提供的密码
	var newPassword string
	if req.NewPassword != "" {
		newPassword = strings.TrimSpace(req.NewPassword)
		// 密码复杂度校验
		if err := l.validatePassword(newPassword); err != nil {
			return nil, err
		}
	} else {
		// 生成临时密码
		newPassword = l.generateTemporaryPassword()
	}

	// 5. 密码加密
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		l.Errorf("密码加密失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 6. 获取当前操作人信息（从 context 中获取）
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

	// 7. 使用事务更新密码和记录审计日志
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		// 7.1 更新用户密码
		updateMap := map[string]interface{}{
			"password_hash": string(passwordHash),
		}
		result := tx.WithContext(l.ctx).Model(&users.User{}).Where("id = ?", userId).Updates(updateMap)
		if result.Error != nil {
			l.Errorf("更新用户密码失败: %v", result.Error)
			return baseErrorx.New(50000, "更新用户密码失败")
		}
		if result.RowsAffected == 0 {
			return baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
		}

		// 7.2 记录审计日志
		auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)
		changes := map[string]interface{}{
			"password_reset": map[string]interface{}{
				"action": "reset",
			},
		}
		changesJSON, _ := json.Marshal(changes)

		auditLog := &auditlogs.AuditLog{
			UserId:     userId,
			Action:     "reset_password",
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

	// 8. 发送邮件通知（Mock实现，后续接入邮件服务）
	if req.SendEmail {
		l.sendPasswordResetEmail(user.Email, newPassword)
	}

	// 9. 返回响应
	return &types.ResetPasswordResp{
		TemporaryPassword: newPassword,
	}, nil
}

// validatePassword 校验密码复杂度（至少8位，包含字母和数字）
func (l *ResetPasswordLogic) validatePassword(password string) error {
	if len(password) < 8 || len(password) > 128 {
		return baseErrorx.New(20002, "密码长度必须在8-128字符之间")
	}

	hasLetter := regexp.MustCompile(`[a-zA-Z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)

	if !hasLetter || !hasDigit {
		return baseErrorx.New(20002, "密码必须包含字母和数字")
	}

	return nil
}

// generateTemporaryPassword 生成临时密码（12位，包含字母和数字）
func (l *ResetPasswordLogic) generateTemporaryPassword() string {
	const (
		letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
		digits  = "0123456789"
		all     = letters + digits
	)

	length := 12 // 默认12位

	// 确保至少包含一个字母和一个数字
	password := make([]byte, length)
	password[0] = letters[rand.Intn(len(letters))]
	password[1] = digits[rand.Intn(len(digits))]

	// 填充剩余字符
	for i := 2; i < length; i++ {
		password[i] = all[rand.Intn(len(all))]
	}

	// 打乱顺序
	rand.Shuffle(length, func(i, j int) {
		password[i], password[j] = password[j], password[i]
	})

	return string(password)
}

// sendPasswordResetEmail 发送密码重置邮件（Mock实现）
func (l *ResetPasswordLogic) sendPasswordResetEmail(email, password string) {
	// TODO: 接入真实邮件服务
	l.Infof("发送密码重置邮件到: %s, 临时密码: %s", email, password)
	// Mock实现：仅记录日志，后续接入邮件服务
}
