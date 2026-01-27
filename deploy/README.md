# DataSemanticHub Docker 部署文档

本文档提供 DataSemanticHub 项目的 Docker 容器化部署方案。

## 📋 目录

- [架构概览](#架构概览)
- [快速开始](#快速开始)
- [服务说明](#服务说明)
- [目录结构](#目录结构)
- [环境变量配置](#环境变量配置)
- [部署脚本](#部署脚本)
- [服务访问](#服务访问)
- [常见问题](#常见问题)
- [📚 相关文档](#-相关文档)

---

## 📚 相关文档

请查阅 `docs/` 目录获取更详细的指南：

### 📖 用户指南 (Guide)
- **[数据库迁移指南](docs/guide/database_migration_guide.md)**: 完整的数据库版本管理、迁移操作手册。

### 🧠 核心概念 (Concept)
- **[迁移概念详解 (UP vs DOWN)](docs/concept/migration_concepts.md)**: 理解为什么需要 `up.sql` 和 `down.sql` 以及最佳实践。

### 📝 参考资料 (Reference)
- **[实施总结](docs/reference/implementation_summary_20260127.md)**: 2026-01-27 数据库迁移改造的实施详情记录。

---

## 架构概览

### 服务组成

DataSemanticHub 采用微服务架构，包含以下服务：

#### 应用层
- **Frontend**: React + Vite 前端应用
- **System Service**: Go-Zero 用户系统服务
- **Metadata Service**: 元数据服务（预留）
- **Java Service**: Java 服务（预留）
- **Python Service**: Python 服务（预留）

#### 数据存储层
- **MariaDB**: 关系型数据库
- **Redis**: 缓存服务
- **OpenSearch**: 搜索引擎
- **OpenSearch Dashboards**: 搜索可视化（可选）

#### 消息队列层
- **Kafka**: 消息队列
- **Zookeeper**: Kafka 协调服务

#### 可观测性层
- **Jaeger**: 分布式链路追踪
- **Prometheus**: 指标监控
- **Grafana**: 监控可视化

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 5173 | 前端应用 |
| System Service | 8888 | 后端 API |
| Metadata Service | 8889 | 元数据服务（预留） |
| Java Service | 8890 | Java 服务（预留） |
| Python Service | 8891 | Python 服务（预留） |
| MariaDB | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| Kafka | 9092 | 消息队列 |
| Zookeeper | 2181 | 协调服务 |
| OpenSearch | 9200/9600 | 搜索引擎 |
| OpenSearch Dashboards | 5601 | 搜索可视化 |
| Jaeger | 16686/14268/6831 | 链路追踪 |
| Prometheus | 9090 | 指标监控 |
| Grafana | 3000 | 监控可视化 |

---

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose V2 (作为 Docker CLI 插件)
- 系统内存建议 8GB+
- 可用磁盘空间 20GB+

### 首次部署

```bash
# 1. 克隆项目（如果还未克隆）
git clone <repository-url>
cd DataSemanticHub

# 2. 进入部署目录
cd deploy

# 3. 复制环境变量模板
cp .env.example .env

# 4. 编辑环境变量（重要：修改密码等敏感信息）
vim .env

# 5. 初始化 Go Workspace（如有新的 Go 模块）
./scripts/init-go-workspace.sh

# 6. 构建所有镜像
./scripts/build.sh

# 7. 启动所有服务
./scripts/start.sh
```

### 验证部署

```bash
# 查看服务状态
docker compose ps

# 所有服务应该都处于 Up 状态
```

### 访问服务

部署成功后，可以访问：
- **前端应用**: http://localhost:5173
- **System Service API**: http://localhost:8888
- **Grafana 监控**: http://localhost:3000 (默认账号: admin/admin)
- **Jaeger 追踪**: http://localhost:16686
- **Prometheus**: http://localhost:9090

---

## 服务说明

### Frontend (前端服务)

- **技术栈**: React + Vite + TypeScript
- **构建方式**: 多阶段构建，使用 Nginx 提供静态服务
- **Dockerfile**: `frontend/Dockerfile`

### System Service (Go 后端服务)

- **技术栈**: Go-Zero
- **端口**: 8888
- **功能**: 用户认证、系统管理
- **Dockerfile**: `backend/go/Dockerfile`
- **依赖**: MariaDB, Redis

### MariaDB (数据库)

- **版本**: MariaDB 11
- **持久化**: `./data/mariadb`
- **初始化脚本**: `init-scripts/mariadb/init.sql`
- **配置文件**: `config/mariadb/my.cnf`

### Redis (缓存)

- **版本**: Redis 7 Alpine
- **持久化**: AOF + RDB
- **数据目录**: `./data/redis`
- **配置文件**: `config/redis/redis.conf`

### Kafka + Zookeeper (消息队列)

- **Kafka 版本**: Confluent Platform 7.5.0
- **用途**: 异步消息处理、事件驱动
- **数据持久化**: `./data/kafka`, `./data/zookeeper`

### OpenSearch (搜索引擎)

- **版本**: OpenSearch 2.11.0
- **模式**: 单节点开发模式
- **安全**: 开发环境禁用（生产需启用）
- **数据目录**: `./data/opensearch`

### Jaeger (链路追踪)

- **版本**: All-in-one 1.51
- **UI**: http://localhost:16686
- **收集端点**: 
  - HTTP: 14268
  - UDP: 6831

### Prometheus + Grafana (监控)

- **Prometheus**: 指标收集和存储
- **Grafana**: 可视化仪表板
- **配置**: `config/prometheus/prometheus.yml`
- **数据源**: 已预配置 Prometheus

---

## 目录结构

```
deploy/
├── README.md                    # 本文档
├── docker-compose.yaml          # 主编排文件
├── .env.example                 # 环境变量模板
├── .env                         # 实际环境变量（不提交到 Git）
├── .gitignore                   # Git 忽略配置
│
├── frontend/                    # 前端 Docker 配置
│   └── Dockerfile
│
├── backend/                     # 后端 Docker 配置
│   └── go/
│       └── Dockerfile
│
├── config/                      # 服务配置文件
│   ├── mariadb/
│   │   └── my.cnf
│   ├── redis/
│   │   └── redis.conf
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── rules/
│   └── grafana/
│       ├── datasources/
│       │   └── prometheus.yml
│       └── dashboards/
│
├── init-scripts/                # 初始化脚本
│   └── mariadb/
│       └── init.sql
│
├── scripts/                     # 部署脚本
│   ├── build.sh                # 构建所有镜像
│   ├── start.sh                # 启动所有服务
│   ├── stop.sh                 # 停止所有服务
│   ├── clean.sh                # 清理环境
│   ├── logs.sh                 # 查看日志
│   └── init-go-workspace.sh    # 初始化 Go Workspace
│
└── data/                        # 数据持久化目录（gitignore）
    ├── mariadb/
    ├── redis/
    ├── kafka/
    ├── zookeeper/
    ├── opensearch/
    ├── prometheus/
    └── grafana/
```

---

## 环境变量配置

### 配置文件

环境变量配置文件：`deploy/.env`

**重要**: 首次部署时必须从模板复制并修改敏感信息：
```bash
cp .env.example .env
vim .env  # 修改密码等敏感配置
```

### 主要配置项

```bash
# 项目信息
PROJECT_NAME=DataSemanticHub
ENVIRONMENT=dev

# 数据库配置
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=datasemantichub
DB_USER=root
DB_PASSWORD=your_secure_password    # 必须修改

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=                      # 可选

# Kafka 配置
KAFKA_BROKERS=kafka:9092

# OpenSearch 配置
OPENSEARCH_HOSTS=http://opensearch:9200

# 认证配置
JWT_SECRET=your_jwt_secret_key       # 必须修改
JWT_EXPIRE=7200

# 可观测性
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_ENDPOINT=http://prometheus:9090
```

---

## 部署脚本

### build.sh - 构建镜像

构建所有 Docker 镜像：

```bash
./scripts/build.sh
```

支持单独构建指定服务：
```bash
./scripts/build.sh frontend
./scripts/build.sh system-service
```

### start.sh - 启动服务

启动所有服务：

```bash
./scripts/start.sh
```

脚本会：
1. 检查环境变量配置
2. 启动所有服务
3. 等待健康检查
4. 打印服务访问地址

### stop.sh - 停止服务

优雅停止所有服务：

```bash
./scripts/stop.sh
```

保留数据卷：
```bash
./scripts/stop.sh --keep-volumes
```

### clean.sh - 清理环境

清理容器、镜像和数据卷：

```bash
./scripts/clean.sh
```

**警告**: 此操作会删除所有数据，请谨慎使用！

保留数据卷：
```bash
./scripts/clean.sh --keep-data
```

### logs.sh - 查看日志

查看所有服务日志：
```bash
./scripts/logs.sh
```

查看指定服务日志：
```bash
./scripts/logs.sh system-service
./scripts/logs.sh mariadb
```

实时跟踪日志：
```bash
./scripts/logs.sh -f system-service
```

### init-go-workspace.sh - 初始化 Go Workspace

自动扫描并配置 Go 工作区：

```bash
./scripts/init-go-workspace.sh
```

此脚本会：
1. 扫描 `services/app/` 下的所有 Go 模块
2. 更新根目录 `go.work` 文件
3. 运行 `go work sync`

---

## 服务访问

### Web 界面

| 服务 | URL | 默认账号 |
|------|-----|----------|
| 前端应用 | http://localhost:5173 | - |
| Grafana | http://localhost:3000 | admin/admin |
| Jaeger UI | http://localhost:16686 | - |
| Prometheus | http://localhost:9090 | - |
| OpenSearch Dashboards | http://localhost:5601 | - |

### API 端点

```bash
# System Service API
curl http://localhost:8888/health

# Metadata Service API（预留）
curl http://localhost:8889/health
```

### 数据库连接

```bash
# MariaDB
mysql -h 127.0.0.1 -P 3306 -u root -p

# Redis
redis-cli -h 127.0.0.1 -p 6379
```

---

## 常见问题

### 1. 端口冲突

**问题**: 启动时提示端口已被占用

**解决**:
```bash
# 查看端口占用
lsof -i :3306
lsof -i :5173

# 修改 .env 文件中的端口配置
# 或停止占用端口的服务
```

### 2. 内存不足

**问题**: 服务启动失败，提示内存不足

**解决**:
- 增加 Docker 可用内存（推荐 8GB+）
- 分批启动服务
- 禁用可选服务（OpenSearch Dashboards）

### 3. 数据库连接失败

**问题**: 后端服务无法连接数据库

**解决**:
```bash
# 检查 MariaDB 是否启动
docker-compose ps mariadb

# 查看 MariaDB 日志
./scripts/logs.sh mariadb

# 验证数据库配置
docker-compose exec mariadb mysql -u root -p
```

### 4. 构建失败

**问题**: Docker 镜像构建失败

**解决**:
```bash
# 清理 Docker 缓存
docker builder prune

# 重新构建
./scripts/build.sh

# 检查网络连接（Go、Node 依赖下载）
```

### 5. Go Workspace 配置

**问题**: Go 模块找不到

**解决**:
```bash
# 重新初始化 workspace
./scripts/init-go-workspace.sh

# 手动验证
cd ..
cat go.work
go work sync
```

---

## 生产部署建议

### 安全加固

1. **修改所有默认密码**
   - MariaDB root 密码
   - Redis 密码
   - JWT Secret
   - Grafana 管理员密码

2. **启用 HTTPS/TLS**
   - 配置 SSL 证书
   - 使用 Nginx 作为反向代理

3. **OpenSearch 安全**
   - 启用安全插件
   - 配置认证和授权

### 性能优化

1. **资源限制**
   - 在 docker-compose.yaml 中配置 CPU 和内存限制
   - 根据实际负载调整

2. **数据库优化**
   - MariaDB: 配置缓冲池大小
   - Redis: 配置最大内存和淘汰策略

3. **Kafka 集群**
   - 生产环境使用多节点集群
   - 配置副本和分区策略

### 监控告警

1. **配置 Grafana 告警**
   - CPU、内存、磁盘使用率
   - 服务健康检查
   - 数据库连接数

2. **日志聚合**
   - 考虑使用 ELK 或 Loki
   - 集中式日志管理

### 备份策略

1. **数据库备份**
   ```bash
   # MariaDB 备份脚本
   docker-compose exec mariadb mysqldump -u root -p datasemantichub > backup.sql
   ```

2. **定期备份**
   - 配置 cron 定时任务
   - 备份到远程存储

---

## 后续扩展

### 添加新的 Go 服务

1. 在 `services/app/` 创建新服务
2. 运行 `./scripts/init-go-workspace.sh`
3. 在 `docker-compose.yaml` 添加服务定义
4. 重新构建和部署

### 添加 Java/Python 服务

1. 创建对应的 Dockerfile
2. 在 `docker-compose.yaml` 中取消注释
3. 配置环境变量
4. 部署服务

---

## 技术支持

如有问题，请：
1. 查看服务日志：`./scripts/logs.sh <service-name>`
2. 查看 Docker 状态：`docker-compose ps`
3. 提交 Issue 到项目仓库

---

**最后更新**: 2026-01-21
