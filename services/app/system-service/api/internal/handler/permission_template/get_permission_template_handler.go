// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package permission_template

import (
	"net/http"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/logic/permission_template"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetPermissionTemplateHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetPermissionTemplateReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := permission_template.NewGetPermissionTemplateLogic(r.Context(), svcCtx)
		resp, err := l.GetPermissionTemplate(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
