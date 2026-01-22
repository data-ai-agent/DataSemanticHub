// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExportUsersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 导出用户数据
func NewExportUsersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExportUsersLogic {
	return &ExportUsersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExportUsersLogic) ExportUsers(req *types.ListUsersReq) (resp *types.EmptyResp, err error) {
	// todo: add your logic here and delete this line

	return
}
