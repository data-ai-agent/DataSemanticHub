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

	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CreateUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 创建用户
func NewCreateUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateUserLogic {
	return &CreateUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateUserLogic) CreateUser(req *types.CreateUserReq) (resp *types.CreateUserResp, err error) {
	// 1. 参数校验
	if err := l.validateCreateUser(req); err != nil {
		return nil, err
	}

	// 2. 检查邮箱唯一性
	email := strings.ToLower(strings.TrimSpace(req.Email))
	existingUser, _ := l.svcCtx.UserModel.FindOneByEmail(l.ctx, email)
	if existingUser != nil {
		return nil, baseErrorx.New(errorx.ErrUserManagementEmailExists, "邮箱已被使用")
	}

	// 3. 检查手机号唯一性（如果提供）
	var phone *string
	if req.Phone != "" {
		phoneStr := strings.TrimSpace(req.Phone)
		existingUserByPhone, _ := l.svcCtx.UserModel.FindOneByPhone(l.ctx, phoneStr)
		if existingUserByPhone != nil {
			return nil, baseErrorx.New(errorx.ErrUserManagementPhoneExists, "手机号已被使用")
		}
		phone = &phoneStr
	}

	// 4. 生成或使用提供的初始密码
	initialPassword := req.InitialPassword
	if initialPassword == "" {
		initialPassword = l.generateInitialPassword()
	}

	// 5. 密码复杂度校验（仅对 local 账号）
	if req.AccountSource == "local" {
		if err := l.validatePassword(initialPassword); err != nil {
			return nil, err
		}
	}

	// 6. 密码加密（仅对 local 账号）
	var passwordHash string
	if req.AccountSource == "local" {
		hash, err := bcrypt.GenerateFromPassword([]byte(initialPassword), 10)
		if err != nil {
			l.Errorf("密码加密失败: %v", err)
			return nil, baseErrorx.New(50000, "系统错误")
		}
		passwordHash = string(hash)
	} else {
		// SSO 账号不需要密码
		passwordHash = ""
	}

	// 7. 生成 UUID v7 作为用户 ID
	userID, err := uuid.NewV7()
	if err != nil {
		l.Errorf("生成用户ID失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 8. 获取当前操作人信息（从 context 中获取，如果可用）
	var createdBy *string
	if operatorIDValue := l.ctx.Value(contextkeys.UserIDKey); operatorIDValue != nil {
		if operatorIDStr, ok := operatorIDValue.(string); ok {
			createdBy = &operatorIDStr
		}
	}

	// 9. 使用事务创建用户、角色绑定和审计日志
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		// 9.1 创建用户（状态设为"未激活"）
		userModel := l.svcCtx.UserModel.WithTx(tx)
		user := &users.User{
			Id:            userID.String(),
			FirstName:     "", // 从 name 中解析，或使用 name
			LastName:      "", // 从 name 中解析，或使用 name
			Name:          strings.TrimSpace(req.Name),
			Email:         email,
			Phone:         phone,
			DeptId:        &req.DeptId,
			PasswordHash:  passwordHash,
			Status:        0, // 未激活
			AccountSource: req.AccountSource,
			CreatedBy:     createdBy,
		}

		createdUser, err := userModel.Insert(l.ctx, user)
		if err != nil {
			if err == users.ErrEmailExists {
				return baseErrorx.New(errorx.ErrUserManagementEmailExists, "邮箱已被使用")
			}
			l.Errorf("创建用户失败: %v", err)
			return baseErrorx.New(50000, "系统错误")
		}

		// 9.2 创建角色绑定
		roleBindingModel := l.svcCtx.RoleBindingModel.WithTx(tx)
		for _, rbInput := range req.RoleBindings {
			roleBinding := &rolebindings.RoleBinding{
				UserId: createdUser.Id,
				OrgId:  rbInput.OrgId,
			}
			if rbInput.Position != "" {
				position := strings.TrimSpace(rbInput.Position)
				roleBinding.Position = &position
			}
			if rbInput.PermissionRole != "" {
				permissionRole := strings.TrimSpace(rbInput.PermissionRole)
				roleBinding.PermissionRole = &permissionRole
			}
			_, err := roleBindingModel.Insert(l.ctx, roleBinding)
			if err != nil {
				l.Errorf("创建角色绑定失败: %v", err)
				return baseErrorx.New(50000, "创建角色绑定失败")
			}
		}

		// 9.3 记录审计日志
		auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)
		operatorName := "System"
		operatorID := "system"
		if createdBy != nil {
			operatorID = *createdBy
			// 尝试获取操作人姓名（使用非事务查询，避免嵌套事务问题）
			if operatorUser, err := l.svcCtx.UserModel.FindOne(l.ctx, operatorID); err == nil && operatorUser != nil {
				operatorName = operatorUser.Name
			}
		}

		changes := map[string]interface{}{
			"status":         map[string]interface{}{"new": 0},
			"account_source": map[string]interface{}{"new": req.AccountSource},
			"dept_id":        map[string]interface{}{"new": req.DeptId},
		}
		changesJSON, _ := json.Marshal(changes)

		auditLog := &auditlogs.AuditLog{
			UserId:     createdUser.Id,
			Action:     "create",
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

	// 10. 发送邀请邮件（Mock实现，后续接入邮件服务）
	if req.SendInvitation {
		l.sendInvitationEmail(email, initialPassword, req.AccountSource == "local")
	}

	// 11. 返回响应
	resp = &types.CreateUserResp{
		UserId: userID.String(),
	}
	// 仅返回初始密码（如果提供了或生成了）
	if initialPassword != "" && req.AccountSource == "local" {
		resp.InitialPassword = initialPassword
	}

	return resp, nil
}

// validateCreateUser 校验创建用户参数
func (l *CreateUserLogic) validateCreateUser(req *types.CreateUserReq) error {
	// 必填字段校验
	if strings.TrimSpace(req.Name) == "" {
		return baseErrorx.New(20001, "姓名不能为空")
	}
	if strings.TrimSpace(req.Email) == "" {
		return baseErrorx.New(20001, "邮箱不能为空")
	}
	if strings.TrimSpace(req.DeptId) == "" {
		return baseErrorx.New(20001, "部门ID不能为空")
	}
	if req.AccountSource != "local" && req.AccountSource != "sso" {
		return baseErrorx.New(20002, "账号来源必须是 local 或 sso")
	}

	// 邮箱格式校验
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		return baseErrorx.New(20002, "邮箱格式不正确")
	}

	// 手机号格式校验（如果提供）
	if req.Phone != "" {
		phoneRegex := regexp.MustCompile(`^1[3-9]\d{9}$`)
		if !phoneRegex.MatchString(req.Phone) {
			return baseErrorx.New(20002, "手机号格式不正确")
		}
	}

	return nil
}

// validatePassword 校验密码复杂度（至少8位，包含字母和数字）
func (l *CreateUserLogic) validatePassword(password string) error {
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

// generateInitialPassword 生成初始密码（8-16位，包含字母和数字）
func (l *CreateUserLogic) generateInitialPassword() string {
	const (
		letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
		digits  = "0123456789"
		all     = letters + digits
	)

	rand.Seed(time.Now().UnixNano())
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

// sendInvitationEmail 发送邀请邮件（Mock实现）
func (l *CreateUserLogic) sendInvitationEmail(email, password string, isLocal bool) {
	// TODO: 接入真实邮件服务
	l.Infof("发送邀请邮件到: %s, 初始密码: %s, 本地账号: %v", email, password, isLocal)
	// Mock实现：仅记录日志，后续接入邮件服务
}
