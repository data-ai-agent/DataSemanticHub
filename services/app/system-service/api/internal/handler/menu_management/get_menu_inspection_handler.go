// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"net/http"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/logic/menu_management"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetMenuInspectionHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := menu_management.NewGetMenuInspectionLogic(r.Context(), svcCtx)
		resp, err := l.GetMenuInspection()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
