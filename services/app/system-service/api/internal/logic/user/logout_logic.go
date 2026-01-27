// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/contextkeys"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
)

type LogoutLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 退出登录
func NewLogoutLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LogoutLogic {
	return &LogoutLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LogoutLogic) Logout() (resp *types.LogoutResp, err error) {
	// 1. 从 JWT Token 中提取用户 ID
	userIDValue := l.ctx.Value(contextkeys.UserIDKey)
	if userIDValue == nil {
		return nil, baseErrorx.New(errorx.ErrTokenInvalid, "Token 无效或已过期")
	}

	userID, ok := userIDValue.(string)
	if !ok {
		l.Errorf("无法从 Token 中获取用户 ID，类型: %T", userIDValue)
		return nil, baseErrorx.New(errorx.ErrTokenInvalid, "Token 无效")
	}

	// 2. 将 Token 加入黑名单（可选，使用 Redis，MVP 阶段可简化）
	// TODO: MVP 阶段简化处理，后续可添加 Redis 黑名单功能
	// 目前仅返回成功响应，客户端删除本地 token 即可
	l.Infof("用户 %s 退出登录", userID)

	// 3. 返回成功响应
	return &types.LogoutResp{
		Message: "退出登录成功",
	}, nil
}
