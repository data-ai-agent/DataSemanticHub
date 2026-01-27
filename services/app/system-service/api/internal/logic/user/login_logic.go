// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"
	"strings"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/golang-jwt/jwt/v4"
	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/bcrypt"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 用户登录
func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	// 1. 参数校验（邮箱、密码必填）AC-16
	if err := l.validateLogin(req); err != nil {
		return nil, err
	}

	// 2. 邮箱转小写查询用户
	email := strings.ToLower(strings.TrimSpace(req.Email))
	user, err := l.svcCtx.UserModel.FindOneByEmail(l.ctx, email)
	if err != nil || user == nil {
		// 3. 统一错误提示（BR-05）：无论用户是否存在，统一返回"用户名或密码错误"
		return nil, baseErrorx.New(errorx.ErrPasswordIncorrect, "用户名或密码错误")
	}

	// 4. 验证密码（bcrypt.CompareHashAndPassword）
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		// 统一错误提示（BR-05）
		return nil, baseErrorx.New(errorx.ErrPasswordIncorrect, "用户名或密码错误")
	}

	// 5. 检查用户状态并处理首次登录自动激活
	if user.Status == 0 {
		// 未激活状态：首次登录时自动激活（更新状态为"启用"）
		user.Status = 1
		if err := l.svcCtx.UserModel.UpdateStatus(l.ctx, user.Id, 1, nil, nil); err != nil {
			l.Errorf("激活用户失败: %v", err)
			return nil, baseErrorx.New(50000, "系统错误")
		}
	} else if user.Status != 1 {
		// 其他非启用状态（停用、锁定、归档）：不允许登录
		return nil, baseErrorx.New(errorx.ErrUserDisabled, "用户已被禁用")
	}

	// 6. 根据 RememberMe 生成 Token（BR-06：普通24小时，记住我7天）
	token, expiresIn, err := l.generateToken(user.Id, user.Email, req.RememberMe)
	if err != nil {
		l.Errorf("生成Token失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}

	// 7. 更新最后登录时间
	now := time.Now()
	if err := l.svcCtx.UserModel.UpdateLastLoginAt(l.ctx, user.Id, now); err != nil {
		l.Errorf("更新最后登录时间失败: %v", err)
		// 不影响登录流程，仅记录错误
	}

	// 8. 返回 Token 和用户信息
	return &types.LoginResp{
		Token:     token,
		ExpiresIn: expiresIn,
		UserInfo: types.UserInfo{
			Id:           user.Id,
			FirstName:    user.FirstName,
			LastName:     user.LastName,
			Email:        user.Email,
			Organization: user.Organization,
		},
	}, nil
}

// validateLogin 校验登录参数
func (l *LoginLogic) validateLogin(req *types.LoginReq) error {
	// 邮箱必填
	if strings.TrimSpace(req.Email) == "" {
		return baseErrorx.New(20001, "邮箱不能为空")
	}

	// 密码必填
	if strings.TrimSpace(req.Password) == "" {
		return baseErrorx.New(20001, "密码不能为空")
	}

	return nil
}

// generateToken 生成 JWT Token
func (l *LoginLogic) generateToken(userID, email string, rememberMe bool) (string, int64, error) {
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
		return "", 0, err
	}

	return tokenString, expire, nil
}
