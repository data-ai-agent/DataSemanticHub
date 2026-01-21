package handler

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest"
)

// SwaggerJSONHandler 返回 swagger.json
func SwaggerJSONHandler(serverCtx *interface{}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		http.ServeFile(w, r, "doc/swagger/swagger.json")
	}
}

// SwaggerFileHandler 处理静态文件请求
func SwaggerFileHandler(serverCtx *interface{}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fileServer := http.FileServer(http.Dir("web/swagger"))
		http.StripPrefix("/swagger/", fileServer).ServeHTTP(w, r)
	}
}

// RegisterSwaggerHandlers 注册 Swagger 相关路由
func RegisterSwaggerHandlers(server *rest.Server) {
	// swagger.json 接口
	server.AddRoute(rest.Route{
		Method:  http.MethodGet,
		Path:    "/swagger.json",
		Handler: SwaggerJSONHandler(nil),
	})

	// Swagger UI 根目录 (重定向到 index.html)
	server.AddRoute(rest.Route{
		Method:  http.MethodGet,
		Path:    "/swagger/",
		Handler: SwaggerFileHandler(nil),
	})

	// 静态文件服务 - Swagger UI (使用 :path 通配符匹配所有子路径)
	server.AddRoute(rest.Route{
		Method:  http.MethodGet,
		Path:    "/swagger/:path",
		Handler: SwaggerFileHandler(nil),
	})
}
