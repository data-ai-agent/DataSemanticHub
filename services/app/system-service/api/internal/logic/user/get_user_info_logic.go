// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserInfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取当前用户信息
func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserInfoLogic) GetUserInfo() (resp *types.GetUserInfoResp, err error) {
	// 1. 从 JWT Token 中提取用户 ID（通过 context.Value 获取）
	userIDValue := l.ctx.Value("user_id")
	if userIDValue == nil {
		return nil, baseErrorx.New(errorx.ErrTokenInvalid, "Token 无效或已过期")
	}

	userID, ok := userIDValue.(string)
	if !ok {
		l.Errorf("无法从 Token 中获取用户 ID，类型: %T", userIDValue)
		return nil, baseErrorx.New(errorx.ErrTokenInvalid, "Token 无效")
	}

	// 2. 调用 Model.FindOne 查询用户信息
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userID)
	if err != nil {
		l.Errorf("查询用户信息失败: %v", err)
		return nil, baseErrorx.New(errorx.ErrUserNotFound, "用户不存在")
	}

	if user == nil {
		return nil, baseErrorx.New(errorx.ErrUserNotFound, "用户不存在")
	}

	// 3. 检查用户状态
	if user.Status != 1 {
		return nil, baseErrorx.New(errorx.ErrUserDisabled, "用户已被禁用")
	}

	// 4. 返回用户信息（排除敏感字段）
	return &types.GetUserInfoResp{
		UserInfo: types.UserInfo{
			Id:           user.Id,
			FirstName:    user.FirstName,
			LastName:     user.LastName,
			Email:        user.Email,
			Organization: user.Organization,
		},
	}, nil
}
