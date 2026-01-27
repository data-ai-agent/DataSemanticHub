.PHONY: init api swagger swagger-yaml gen lint test build clean docker-build docker-run k8s-deploy

# 项目名称
PROJECT_NAME := system-service

# Docker 配置
DOCKER_REGISTRY := docker.io
DOCKER_IMAGE := $(DOCKER_REGISTRY)/$(PROJECT_NAME)
VERSION := $(shell cat VERSION 2>/dev/null || echo "0.1.0")

# Swagger 文档输出目录
SWAGGER_DIR := api/doc/swagger

# 初始化项目
init:
	@./scripts/init.sh

# 生成 API 代码
api:
	goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group

# 生成 Swagger 文档 (JSON 格式)
swagger:
	goctl api swagger --api api/doc/api.api --dir $(SWAGGER_DIR) --filename swagger

# 生成 Swagger 文档 (YAML 格式)
swagger-yaml:
	goctl api swagger --api api/doc/api.api --dir $(SWAGGER_DIR) --filename swagger --yaml

# 一键生成 API 代码 + Swagger 文档
gen: api swagger
	@echo "API code and Swagger documentation generated successfully!"

# 格式化代码
fmt:
	gofmt -w .
	goimports -w .

# 代码检查
lint:
	golangci-lint run ./...

# 运行测试
test:
	go test -v -cover ./...

# 编译
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/$(PROJECT_NAME) ./api

# 运行
run:
	go run api/api.go

# 清理
clean:
	rm -rf bin/
	go clean

# 安装依赖
deps:
	go mod tidy
	go mod download

# ============================================
# Docker 命令
# ============================================

# 构建 Docker 镜像 (使用 build.sh 脚本)
docker-build:
	@./deploy/docker/build.sh $(VERSION)

# 运行 Docker 容器
docker-run:
	docker run -d --name $(PROJECT_NAME) -p 8888:8888 $(DOCKER_IMAGE):$(VERSION)

# 停止 Docker 容器
docker-stop:
	docker stop $(PROJECT_NAME) && docker rm $(PROJECT_NAME)

# 推送 Docker 镜像
docker-push:
	docker push $(DOCKER_IMAGE):$(VERSION)
	docker push $(DOCKER_IMAGE):latest

# ============================================
# Kubernetes 命令
# ============================================

# 部署到 K8s
# 默认环境
ENV ?= dev

# 部署到 K8s (默认 dev)
k8s-deploy:
	kubectl apply -k deploy/k8s/overlays/$(ENV)

# 部署到 K8s (Dev)
k8s-deploy-dev:
	kubectl apply -k deploy/k8s/overlays/dev

# 部署到 K8s (Prod)
k8s-deploy-prod:
	kubectl apply -k deploy/k8s/overlays/prod

# 查看 K8s 生成的 Manifest (Dry-run)
k8s-manifest:
	kubectl kustomize deploy/k8s/overlays/$(ENV)

# 删除 K8s 部署
k8s-delete:
	kubectl delete -k deploy/k8s/overlays/$(ENV)

# 查看 K8s 状态
k8s-status:
	kubectl get pods,svc,deploy,ing -l app=$(PROJECT_NAME)

# 帮助
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make init          - Initialize project"
	@echo "    make api           - Generate API code with goctl"
	@echo "    make swagger       - Generate Swagger JSON documentation"
	@echo "    make swagger-yaml  - Generate Swagger YAML documentation"
	@echo "    make gen           - Generate API code + Swagger docs"
	@echo "    make fmt           - Format code"
	@echo "    make lint          - Run linter"
	@echo "    make test          - Run tests"
	@echo "    make build         - Build binary"
	@echo "    make run           - Run server"
	@echo "    make clean         - Clean build artifacts"
	@echo "    make deps          - Install dependencies"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-build  - Build Docker image"
	@echo "    make docker-run    - Run Docker container"
	@echo "    make docker-stop   - Stop Docker container"
	@echo "    make docker-push   - Push Docker image to registry"
	@echo ""
	@echo "  Kubernetes (Kustomize):"
	@echo "    make k8s-deploy      - Deploy to K8s (default: dev)"
	@echo "    make k8s-deploy-dev  - Deploy to K8s Dev environment"
	@echo "    make k8s-deploy-prod - Deploy to K8s Prod environment"
	@echo "    make k8s-manifest    - View generated manifest (dry-run)"
	@echo "    make k8s-delete      - Delete K8s deployment"
	@echo "    make k8s-status      - Check K8s status"
	@echo ""
	@echo "  Database Migrations:"
	@echo "    make migrate-up      - Run all pending migrations"
	@echo "    make migrate-down    - Rollback last migration"
	@echo "    make migrate-status  - Show migration status"
	@echo "    make migrate-create MODULE=<module> NAME=<name>  - Create new migration"

# ============================================
# Database Migration Commands
# ============================================

# 数据库配置（从环境变量读取，或使用默认值）
DB_HOST ?= localhost
DB_PORT ?= 3306
DB_NAME ?= datasemantichub
DB_USER ?= root
DB_PASSWORD ?=

# 迁移工具配置
MIGRATE := migrate
MIGRATIONS_DIR := migrations/versions
DB_URL := "mysql://$(DB_USER):$(DB_PASSWORD)@tcp($(DB_HOST):$(DB_PORT))/$(DB_NAME)?multiStatements=true"

# 模块列表
MODULES := system user

# 执行所有模块的迁移
migrate-up:
	@echo "🔼 执行数据库迁移..."
	@for module in $(MODULES); do \
		echo ""; \
		echo "📦 模块: $$module"; \
		echo "────────────────────────────────────"; \
		$(MIGRATE) -path $(MIGRATIONS_DIR)/$$module -database $(DB_URL) up || exit 1; \
		echo "✅ $$module 迁移成功"; \
	done
	@echo ""
	@echo "🎉 所有模块迁移完成！"

# 回滚所有模块的最后一次迁移
migrate-down:
	@echo "🔽 回滚数据库迁移..."
	@for module in $(MODULES); do \
		echo ""; \
		echo "📦 模块: $$module"; \
		echo "────────────────────────────────────"; \
		$(MIGRATE) -path $(MIGRATIONS_DIR)/$$module -database $(DB_URL) down 1 || exit 1; \
		echo "✅ $$module 回滚成功"; \
	done
	@echo ""
	@echo "🎉 所有模块回滚完成！"

# 查看所有模块的迁移状态
migrate-status:
	@echo "📊 查看迁移状态..."
	@echo ""
	@for module in $(MODULES); do \
		echo "📦 模块: $$module"; \
		echo "────────────────────────────────────"; \
		$(MIGRATE) -path $(MIGRATIONS_DIR)/$$module -database $(DB_URL) version 2>&1 || echo "  ⚠️  未执行任何迁移"; \
		echo ""; \
	done

# 创建新的迁移文件
migrate-create:
	@if [ -z "$(MODULE)" ]; then \
		echo "❌ 错误: 请指定模块名"; \
		echo "用法: make migrate-create MODULE=system NAME=add_new_field"; \
		exit 1; \
	fi
	@if [ -z "$(NAME)" ]; then \
		echo "❌ 错误: 请指定迁移名称"; \
		echo "用法: make migrate-create MODULE=system NAME=add_new_field"; \
		exit 1; \
	fi
	@echo "📝 创建新的迁移文件..."
	@$(MIGRATE) create -ext sql -dir $(MIGRATIONS_DIR)/$(MODULE) -seq $(NAME)
	@echo "✅ 迁移文件已创建在 $(MIGRATIONS_DIR)/$(MODULE)/"
	@echo ""
	@echo "💡 后续步骤:"
	@echo "   1. 编辑生成的 .up.sql 文件（添加变更逻辑）"
	@echo "   2. 编辑生成的 .down.sql 文件（添加回滚逻辑）"
	@echo "   3. 执行迁移: make migrate-up"

# 安装golang-migrate工具
install-migrate-tool:
	@echo "📦 安装 golang-migrate 工具..."
	@if command -v brew >/dev/null 2>&1; then \
		echo "使用 Homebrew 安装..."; \
		brew install golang-migrate; \
	else \
		echo "❌ 未找到 Homebrew"; \
		echo "请手动安装: https://github.com/golang-migrate/migrate"; \
		exit 1; \
	fi
	@echo "✅ 安装完成"
	@$(MIGRATE) -version
