// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type BatchImportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 批量导入用户
func NewBatchImportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BatchImportLogic {
	return &BatchImportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *BatchImportLogic) BatchImport(req *types.BatchImportReq) (resp *types.BatchImportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
