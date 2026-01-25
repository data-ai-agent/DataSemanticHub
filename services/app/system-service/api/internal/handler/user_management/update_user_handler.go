// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"net/http"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/logic/user_management"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// 更新用户
func UpdateUserHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从路径参数获取用户ID
		var req struct {
			Id string `path:"id"`
			types.UpdateUserReq
		}
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := user_management.NewUpdateUserLogic(r.Context(), svcCtx)
		resp, err := l.UpdateUser(req.Id, &req.UpdateUserReq)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
