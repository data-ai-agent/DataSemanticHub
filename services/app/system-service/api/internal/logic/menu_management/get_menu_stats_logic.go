// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"context"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMenuStatsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMenuStatsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMenuStatsLogic {
	return &GetMenuStatsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMenuStatsLogic) GetMenuStats() (resp *types.GetMenuStatsResp, err error) {
	// 1. 查询统计信息
	stats, err := l.svcCtx.MenuModel.GetStatistics(l.ctx)
	if err != nil {
		logx.Errorf("查询菜单统计信息失败: %v", err)
		return nil, fmt.Errorf("查询菜单统计信息失败: %w", err)
	}

	// 2. 转换为响应类型
	resp = &types.GetMenuStatsResp{
		Total:             stats.Total,
		Enabled:           stats.Enabled,
		Hidden:            stats.Hidden,
		UnboundPermission: stats.UnboundPermission,
	}

	return
}
