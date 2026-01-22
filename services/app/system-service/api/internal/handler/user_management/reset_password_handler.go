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

// 重置用户密码
func ResetPasswordHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从路径参数获取用户ID
		var pathReq struct {
			Id string `path:"id"`
		}
		if err := httpx.Parse(r, &pathReq); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		var req types.ResetPasswordReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := user_management.NewResetPasswordLogic(r.Context(), svcCtx)
		resp, err := l.ResetPassword(pathReq.Id, &req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
