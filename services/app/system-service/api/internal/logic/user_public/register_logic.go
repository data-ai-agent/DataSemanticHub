// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_public

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/bcrypt"
)

type RegisterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 用户注册
func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RegisterLogic) Register(req *types.RegisterReq) (resp *types.RegisterResp, err error) {
	// 1. 参数校验
	if err := l.validateRegister(req); err != nil {
		return nil, err
	}

	// 2. 邮箱转小写并检查唯一性
	email := strings.ToLower(strings.TrimSpace(req.Email))
	existingUser, _ := l.svcCtx.UserModel.FindOneByEmail(l.ctx, email)
	if existingUser != nil {
		return nil, baseErrorx.New(errorx.ErrEmailExists, "该邮箱已被注册")
	}

	// 3. 密码复杂度校验（至少8位，包含字母和数字）
	if err := l.validatePassword(req.Password); err != nil {
		return nil, err
	}

	// 4. bcrypt 加密密码（cost=10）
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		l.Errorf("密码加密失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 5. 生成 UUID v7 作为用户 ID
	userID, err := uuid.NewV7()
	if err != nil {
		l.Errorf("生成用户ID失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 6. 创建用户
	firstName := strings.TrimSpace(req.FirstName)
	lastName := strings.TrimSpace(req.LastName)
	user := &users.User{
		Id:            userID.String(),
		FirstName:     firstName,
		LastName:      lastName,
		Name:          firstName + " " + lastName, // 合并FirstName和LastName
		Email:         email,
		Organization:  strings.TrimSpace(req.Organization),
		PasswordHash:  string(passwordHash),
		Status:        0,       // 未激活（首次登录时自动激活）
		AccountSource: "local", // 账号来源：本地注册
	}

	createdUser, err := l.svcCtx.UserModel.Insert(l.ctx, user)
	if err != nil {
		// 检查是否是邮箱已存在的错误
		if err == users.ErrEmailExists {
			return nil, baseErrorx.New(errorx.ErrEmailExists, "该邮箱已被注册")
		}
		l.Errorf("创建用户失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 7. 生成 JWT Token（自动登录）
	token, err := l.generateToken(createdUser.Id, createdUser.Email, false)
	if err != nil {
		l.Errorf("生成Token失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 8. 返回用户信息和 Token
	return &types.RegisterResp{
		Id:        createdUser.Id,
		FirstName: createdUser.FirstName,
		LastName:  createdUser.LastName,
		Email:     createdUser.Email,
		Token:     token,
	}, nil
}

// validateRegister 校验注册参数
func (l *RegisterLogic) validateRegister(req *types.RegisterReq) error {
	// 必填字段校验
	if strings.TrimSpace(req.FirstName) == "" {
		return baseErrorx.New(20001, "名不能为空")
	}
	if strings.TrimSpace(req.LastName) == "" {
		return baseErrorx.New(20001, "姓不能为空")
	}
	if strings.TrimSpace(req.Email) == "" {
		return baseErrorx.New(20001, "邮箱不能为空")
	}
	if strings.TrimSpace(req.Password) == "" {
		return baseErrorx.New(20001, "密码不能为空")
	}
	if strings.TrimSpace(req.ConfirmPassword) == "" {
		return baseErrorx.New(20001, "确认密码不能为空")
	}

	// 邮箱格式校验
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		return baseErrorx.New(20002, "邮箱格式不正确")
	}

	// 密码一致性校验
	if req.Password != req.ConfirmPassword {
		return baseErrorx.New(20002, "两次输入的密码不一致")
	}

	// 条款同意校验
	if !req.AgreeTerms {
		return baseErrorx.New(20002, "请同意服务条款与隐私政策")
	}

	return nil
}

// validatePassword 校验密码复杂度（至少8位，包含字母和数字）
func (l *RegisterLogic) validatePassword(password string) error {
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

// generateToken 生成 JWT Token
func (l *RegisterLogic) generateToken(userID, email string, rememberMe bool) (string, error) {
	// 根据 rememberMe 设置 Token 有效期
	var expire int64
	if rememberMe {
		expire = 604800 // 7天
	} else {
		expire = 86400 // 24小时
	}

	// 创建 JWT Claims
	now := time.Now()
	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     now.Add(time.Duration(expire) * time.Second).Unix(),
		"iat":     now.Unix(),
	}

	// 生成 Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
