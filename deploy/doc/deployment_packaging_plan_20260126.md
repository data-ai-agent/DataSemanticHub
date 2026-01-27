# DataSemanticHub 快速部署打包方案 (2026-01-26)

## 背景

为了在功能开发完成后（如组织架构管理），能够快速、标准化地将服务、SQL 和前端资源打包并部署，我们需要一套自动化的打包发布流程。本方案旨在解决依赖管理、Docker 构建、数据迁移和前端发布的协同问题。

## 方案概览：Function Release Pipeline

核心思想是通过脚本自动化收集变更，生成标准化的发布包。

### 0. 依赖服务的补充 (Infrastructure Automation)

目标：确保新引入的基础设施组件（如新中间件、新配置）被自动纳入部署包。

*   **配置中心化**：
    *   所有环境变量定义在 `.env.example`。
    *   所有基础服务（MariaDB, Redis, Kafka 等）定义在 `docker-compose.yaml`。
*   **自动化检查**：
    *   打包脚本验证 `.env` 变量完整性。

### 1. Docker 构建 (Build Automation)

目标：统一镜像版本管理，确保生产环境使用确定的不可变镜像。

*   **统一构建脚本**：基于 `deploy/scripts/build.sh`。
*   **版本策略**：
    *   引入 `TAG` 环境变量。
    *   示例：`./package.sh v1.1.0` 将构建 `system-service:v1.1.0`。
*   **产物固化**：
    *   自动生成/更新 `docker-compose-prod.yaml`，将 `image: system-service:latest` 替换为具体的 `image: system-service:v1.1.0`。

### 2. 后端服务与 SQL 迁移 (Database Migration)

目标：解决手动执行 SQL 易错、连接困难的问题，实现应用启动即最新 schema。

*   **Migrator 服务化**：
    *   **现状**：目前 `run-migrations.sh` 在宿主机运行，依赖本地 mysql 客户端且网络连接复杂。
    *   **改进**：创建一个专用的 `migrator` 容器。
    *   **机制**：`migrator` 容器挂载项目中的 SQL 目录，在 `docker-compose` 启动时依赖 DB 健康检查，自动执行增量 SQL。
*   **SQL 文件收集**：
    *   打包脚本自动扫描 `services/app/*/migrations/*.sql`。
    *   复制到发布包的 `deploy/migrations/` 目录。

### 3. 前端服务构建 (Frontend Delivery)

目标：提供高性能、配置灵活的静态资源服务。

*   **构建**：执行 `npm run build` 生成 `dist`。
*   **封装**：
    *   使用 `deploy/frontend/Dockerfile` 将 `dist` 目录打包进 Nginx 镜像。
    *   **改进**：支持运行时注入后端 API 地址（通过 `docker-entrypoint` 替换 Nginx 配置或 JS 变量），避免硬编码。

---

## 实施方案：Package Script (`deploy/package.sh`)

我们将开发一个一键打包脚本，执行流程如下：

1.  **环境检查**：检查 git 状态，确认代码已提交。
2.  **清理**：清除旧的构建产物。
3.  **构建镜像**：
    *   调用 `deploy/scripts/build.sh` 构建所有微服务及前端镜像。
    *   打上指定版本 TAG。
4.  **收集资源**：
    *   **SQL**：`cp -r services/app/*/migrations/*.sql deploy/migrations/`
    *   **Config**：`cp services/app/*/etc/*.yaml deploy/config/`
5.  **生成发布的 Compose 文件**：
    *   基于 `docker-compose.yaml` 生成 `docker-compose-release.yaml`。
    *   替换镜像 Tag 为当前版本。
    *   加入 `migrator` 服务配置。
6.  **归档**：
    *   将 `deploy/` 目录（包含镜像加载脚本、Compose 文件、SQL、配置）打包为 `.tar.gz`。

---

## 目录结构预览 (发布包)

```text
release-v1.1.0/
├── docker-compose.yaml      # 生产用 Compose 文件 (固定 Tag)
├── .env.example             # 环境变量模板
├── images/                  # (可选) 离线镜像包 .tar
├── migrations/              # 汇总的所有 SQL 文件
│   ├── system-service/
│   └── data-connection/
├── config/                  # 后端配置文件
│   ├── system-service/
│   └── data-connection/
├── scripts/
│   ├── install.sh           # 一键安装/升级脚本
│   └── load-images.sh       # 离线镜像加载脚本
└── nginx/                   # (可选) 前端自定义 Nginx 配置
```
