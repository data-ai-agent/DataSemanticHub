// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"net/http"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/logic/user_management"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// 获取统计数据
func GetStatisticsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user_management.NewGetStatisticsLogic(r.Context(), svcCtx)
		resp, err := l.GetStatistics()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
