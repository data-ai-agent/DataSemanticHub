// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetStatisticsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取统计数据
func NewGetStatisticsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStatisticsLogic {
	return &GetStatisticsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStatisticsLogic) GetStatistics() (resp *types.GetStatisticsResp, err error) {
	// 1. 调用 Model.GetStatistics 获取统计数据
	stats, err := l.svcCtx.UserModel.GetStatistics(l.ctx)
	if err != nil {
		l.Errorf("获取统计数据失败: %v", err)
		return nil, baseErrorx.New(50000, "获取统计数据失败")
	}

	// 2. 构建响应数据
	return &types.GetStatisticsResp{
		Total:            stats.Total,
		Active:           stats.Active,
		Locked:           stats.Locked,
		Inactive:         stats.Inactive,
		NoOrgBinding:     stats.NoOrgBinding,
		NoPermissionRole: stats.NoPermissionRole,
		RecentActiveRate: stats.RecentActiveRate,
	}, nil
}
