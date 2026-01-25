# Vanna API 配置说明

## 配置文件支持

Vanna API 现在支持通过 YAML 配置文件进行配置，同时保留环境变量的支持。**环境变量的优先级高于配置文件**。

## 配置文件位置

配置文件会按以下顺序查找：

1. `/app/config/config.yaml` - Docker 容器内挂载路径（推荐用于生产环境）
2. `vanna-api/config.yaml` - 代码目录（开发环境）
3. `config.yaml` - 上级目录
4. `/app/config.yaml` - Docker 容器内根路径

## 配置文件格式

参考 `config.yaml.example` 文件，复制为 `config.yaml` 并根据实际情况修改：

```yaml
# 数据库配置
db:
  host: mariadb
  port: 3306
  database: datasemantichub
  user: root
  password: ""  # 建议通过环境变量设置

# Vanna 配置
vanna:
  # Remote 模式（使用 Vanna API）
  api_key: ""
  model: ""
  
  # Ollama 模式（本地模型）
  use_ollama: false
  ollama:
    model: qwen2.5-coder:7b
    host: http://host.docker.internal:11434
  
  # 向量库路径
  chroma_db_path: /app/chroma_db

# LLM 配置（OpenAI/DeepSeek 模式）
llm:
  openai_api_key: ""
  model: gpt-3.5-turbo
  base_url: ""  # 用于 DeepSeek 等兼容服务

# 服务配置
server:
  port: 8891
  host: 0.0.0.0
```

## 配置优先级

配置值的优先级从高到低：

1. **环境变量** - 最高优先级
2. **配置文件** - 中等优先级
3. **默认值** - 最低优先级

例如，如果同时设置了环境变量 `LLM_MODEL` 和配置文件中的 `llm.model`，将使用环境变量的值。

## 使用方式

### 方式 1: 使用配置文件（推荐用于开发环境）

1. 复制示例配置文件：
   ```bash
   cp vanna-api/config.yaml.example vanna-api/config.yaml
   ```

2. 编辑 `config.yaml`，填入你的配置

3. 启动服务，配置会自动加载

### 方式 2: 使用环境变量（推荐用于生产环境）

在 `docker-compose.yaml` 或 `.env` 文件中设置环境变量：

```bash
# 数据库配置
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=datasemantichub
DB_USER=root
DB_PASSWORD=your_password

# LLM 配置
OPENAI_API_KEY=your_key
LLM_MODEL=gpt-3.5-turbo
LLM_BASE_URL=https://api.deepseek.com  # 可选
```

### 方式 3: Docker 挂载配置文件（推荐用于生产环境）

在 `docker-compose.yaml` 中已经配置了配置文件挂载：

```yaml
volumes:
  - ./config/vanna:/app/config:ro
```

将配置文件放在 `deploy/config/vanna/config.yaml`，容器启动时会自动加载。

## 配置项说明

### 数据库配置

- `db.host`: 数据库主机地址（默认: `mariadb`）
- `db.port`: 数据库端口（默认: `3306`）
- `db.database`: 数据库名称（默认: `datasemantichub`）
- `db.user`: 数据库用户名（默认: `root`）
- `db.password`: 数据库密码（**强烈建议通过环境变量设置**）

### Vanna 配置

#### 模式选择

Vanna 支持三种模式，按以下优先级选择：

1. **Remote 模式** - 如果设置了 `vanna.api_key` 和 `vanna.model`
2. **Ollama 模式** - 如果设置了 `vanna.use_ollama: true`
3. **OpenAI/DeepSeek 模式** - 默认模式，需要设置 `llm.openai_api_key`

#### Remote 模式

- `vanna.api_key`: Vanna API Key
- `vanna.model`: Vanna 模型名称

#### Ollama 模式

- `vanna.use_ollama`: 是否使用 Ollama（`true`/`false`）
- `vanna.ollama.model`: Ollama 模型名称（默认: `qwen2.5-coder:7b`）
- `vanna.ollama.host`: Ollama 服务地址（默认: `http://host.docker.internal:11434`）

#### OpenAI/DeepSeek 模式

- `llm.openai_api_key`: OpenAI API Key（或兼容服务的 API Key）
- `llm.model`: 模型名称（默认: `gpt-3.5-turbo`）
  - 可选值: `gpt-3.5-turbo`, `gpt-4`, `deepseek-chat` 等
- `llm.base_url`: API Base URL（可选，用于 DeepSeek 等兼容服务）
  - DeepSeek: `https://api.deepseek.com`
  - 其他兼容服务: 根据服务商文档设置

### 其他配置

- `vanna.chroma_db_path`: 向量库持久化路径（默认: `/app/chroma_db`）
- `server.port`: 服务端口（默认: `8891`）
- `server.host`: 服务监听地址（默认: `0.0.0.0`）

## 示例配置

### 使用 DeepSeek

```yaml
llm:
  openai_api_key: sk-xxxxxxxxxxxx
  model: deepseek-chat
  base_url: https://api.deepseek.com
```

### 使用本地 Ollama

```yaml
vanna:
  use_ollama: true
  ollama:
    model: qwen2.5-coder:7b
    host: http://host.docker.internal:11434
```

### 使用 Vanna Remote API

```yaml
vanna:
  api_key: your_vanna_api_key
  model: your_model_name
```

## 注意事项

1. **敏感信息**（如 API Key、密码）建议通过环境变量设置，不要直接写在配置文件中
2. 配置文件支持嵌套结构，使用点号分隔访问（如 `llm.model`）
3. 环境变量名会自动转换：`llm.model` → `LLM_MODEL`
4. 如果配置文件不存在，系统会使用环境变量和默认值，不会报错
