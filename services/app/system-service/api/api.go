package main

import (
	"flag"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/handler"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"

	"github.com/jinguoxing/idrm-go-base/middleware"
	"github.com/jinguoxing/idrm-go-base/response"
	"github.com/jinguoxing/idrm-go-base/telemetry"
	"github.com/jinguoxing/idrm-go-base/validator"

	"github.com/zeromicro/go-zero/rest"
)

var configFile = flag.String("f", "etc/api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	mustLoadConfig(*configFile, &c)

	// 初始化 Telemetry (日志、链路追踪、审计)
	if err := telemetry.Init(c.Telemetry); err != nil {
		panic(fmt.Sprintf("telemetry 初始化失败: %v", err))
	}
	// defer telemetry.Close(context.Background())

	// 初始化参数校验器
	validator.Init()
	response.InitErrorHandler()

	// 创建 HTTP 服务器
	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	// 注册全局中间件 (顺序重要!)
	server.Use(middleware.Recovery())  // 1. Panic 恢复
	server.Use(middleware.RequestID()) // 2. 请求 ID 生成
	server.Use(middleware.Trace())     // 3. OpenTelemetry 链路追踪
	server.Use(middleware.CORS())      // 4. CORS 跨域处理
	server.Use(middleware.Logger())    // 5. 请求日志

	// 初始化服务上下文
	ctx := svc.NewServiceContext(c)

	// 注册 Swagger 路由 (必须在其他路由之前)
	handler.RegisterSwaggerHandlers(server)

	// 注册路由
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("启动 API 服务: %s:%d\n", c.Host, c.Port)
	server.Start()
}
