# API Gateway 架构文档

## 📋 概述

DataSemanticHub 前端采用 **API Gateway 模式** 与后端服务通信。所有 API 请求通过 Nginx API Gateway 统一路由到不同的后端服务。

## 🏗️ 架构图

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│  Frontend   │─────▶│  Nginx Gateway   │─────▶│  System Service      │
│  (React)    │      │  (Port 80/5173)  │      │  (Port 8888)         │
│             │      │                  │      │                      │
│             │      │  Routes:         │      │  Agent Service       │
│             │      │  /api/v1/system/ │─────▶│  (Port 8891)         │
│             │      │  /api/v1/agent/  │      │                      │
│             │      │  /api/v1/metadata│      │  Metadata Service    │
│             │      │  /api/v1/data/   │      │  (Port 8889)         │
└─────────────┘      └──────────────────┘      └──────────────────────┘
```

## 🔀 路由规则

### Nginx 路由配置

| 前端请求路径           | 后端服务             | 服务端口 | 用途                          |
| ---------------------- | -------------------- | -------- | ----------------------------- |
| `/api/v1/system/*`     | `system-service`     | 8888     | 用户认证、权限管理、系统配置  |
| `/api/v1/agent/*`      | `agent-service`      | 8891     | AI Agent、问数、SQL生成       |
| `/api/v1/metadata/*`   | `metadata-service`   | 8889     | 元数据管理、数据目录（预留）  |
| `/api/v1/data/*`       | `data-connection`    | 8890     | 数据源连接管理（预留）        |

### 实际请求示例

```
前端请求：  /api/v1/system/user/login
           ↓
Nginx转发：  http://system-service:8888/api/v1/user/login
```

## 📁 前端代码结构

```
frontend/src/
├── config/
│   └── api.ts                    # API 配置中心（所有服务路由定义）
├── utils/
│   ├── httpClient.ts             # 基础 HTTP 客户端（JWT、错误处理）
│   └── serviceClient.ts          # 服务客户端工具（多服务支持）
└── services/
    ├── index.ts                  # 服务模块索引
    ├── auth.ts                   # System Service - 认证
    ├── profile.ts                # System Service - 用户信息
    ├── userManagement.ts         # System Service - 用户管理
    └── agent/
        └── agentService.ts       # Agent Service - AI功能
```

## 🚀 使用方法

### 1. 基础用法（推荐）

```typescript
// 1. 直接使用预定义的服务
import { authService, agentService } from '@/services';

// 登录
const loginResp = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// AI 对话
const chatResp = await agentService.chat({
  message: '查询销售额前10的商品'
});
```

### 2. 使用服务客户端

```typescript
import { systemServiceClient, agentServiceClient } from '@/services';

// System Service 请求
const response = await systemServiceClient('/user/info', {
  method: 'GET'
});

// Agent Service 请求
const aiResponse = await agentServiceClient('/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
```

### 3. 自定义服务客户端

```typescript
import { createServiceClient } from '@/utils/serviceClient';

// 创建自定义客户端
const customClient = createServiceClient('SYSTEM', {
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'value'
  }
});

const response = await customClient('/custom/endpoint');
```

### 4. 使用 API 路径辅助函数

```typescript
import { API_ENDPOINTS, getApiPath } from '@/config/api';

// 使用预定义的端点
const loginUrl = API_ENDPOINTS.SYSTEM.LOGIN;  // '/api/v1/system/user/login'

// 动态生成路径
const userDetailUrl = API_ENDPOINTS.SYSTEM.USER_DETAIL('123');  // '/api/v1/system/users/123'

// 使用辅助函数
const customPath = getApiPath('AGENT', '/custom');  // '/api/v1/agent/custom'
```

### 5. 批量请求（跨服务聚合）

```typescript
import { batchRequest, systemServiceClient, metadataServiceClient } from '@/services';

const [userInfo, catalogs] = await batchRequest([
  () => systemServiceClient('/user/info'),
  () => metadataServiceClient('/catalogs'),
]);
```

## 🔧 配置说明

### API_CONFIG (config/api.ts)

```typescript
export const API_CONFIG = {
  BASE_URL: '/api/v1',              // API 基础路径
  TIMEOUT: 10000,                   // 默认超时时间（毫秒）
  
  SERVICES: {
    SYSTEM: '/system',              // System Service 路由前缀
    AGENT: '/agent',                // Agent Service 路由前缀
    METADATA: '/metadata',          // Metadata Service 路由前缀
    DATA: '/data',                  // Data Service 路由前缀
  }
};
```

### 环境变量

在 `.env` 文件中配置：

```bash
# 覆盖默认的 API Base URL（可选）
VITE_API_BASE_URL=http://localhost:8888
```

## 🆕 添加新服务

### 步骤 1：在 Nginx 添加路由

编辑 `deploy/frontend/nginx.conf`：

```nginx
# New Service
location /api/v1/newservice/ {
    proxy_pass http://new-service:8892/api/v1/;
    include /etc/nginx/proxy_params;
}
```

### 步骤 2：在前端配置中添加服务

编辑 `frontend/src/config/api.ts`：

```typescript
export const API_CONFIG = {
  // ...
  SERVICES: {
    // ...
    NEWSERVICE: '/newservice',
  }
};

export const API_ENDPOINTS = {
  // ...
  NEWSERVICE: {
    EXAMPLE: getApiPath('NEWSERVICE', '/example'),
  }
};
```

### 步骤 3：创建服务客户端（可选）

编辑 `frontend/src/utils/serviceClient.ts`：

```typescript
export const newServiceClient = createServiceClient('NEWSERVICE', {
  timeout: 10000,
});
```

### 步骤 4：创建服务 API 层

创建 `frontend/src/services/newservice/newService.ts`：

```typescript
import { newServiceClient } from '../../utils/serviceClient';

export const newService = {
  async getData() {
    const response = await newServiceClient('/data');
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }
};
```

### 步骤 5：在索引文件中导出

编辑 `frontend/src/services/index.ts`：

```typescript
export * from './newservice/newService';
export { newServiceClient } from '../utils/serviceClient';
```

## 🐛 调试技巧

### 1. 查看请求路由

打开浏览器开发者工具 → Network 标签，查看实际请求的 URL：

```
Request URL: http://localhost:5173/api/v1/system/user/login
Status: 200
```

### 2. 检查 Nginx 日志

```bash
# 进入容器
docker exec -it datasemantichub-frontend sh

# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 3. 测试服务连通性

```bash
# 测试 System Service
curl http://system-service:8888/api/v1/health

# 测试 Agent Service
curl http://agent-service:8891/health
```

### 4. Mock 模式

开发环境会自动 fallback 到 Mock 模式（当服务不可用时）：

```typescript
// 在 services/auth.ts 中
if (import.meta.env.DEV && (response.status === 404 || response.status >= 500)) {
    console.warn('System Service connection failed, falling back to Mock Mode');
    return mockLogin(data);
}
```

## 📊 性能优化

### 1. 请求超时配置

不同服务配置不同的超时时间：

```typescript
// AI 服务可能需要更长时间
export const agentServiceClient = createServiceClient('AGENT', {
  timeout: 15000,  // 15秒
});

// 普通服务
export const systemServiceClient = createServiceClient('SYSTEM', {
  timeout: 10000,  // 10秒
});
```

### 2. 请求合并

使用 `batchRequest` 合并多个并发请求：

```typescript
const [data1, data2, data3] = await batchRequest([
  () => systemServiceClient('/endpoint1'),
  () => agentServiceClient('/endpoint2'),
  () => metadataServiceClient('/endpoint3'),
]);
```

### 3. Nginx 缓存（可选）

在 `nginx.conf` 中添加缓存配置：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/v1/metadata/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ...
}
```

## 🔒 安全最佳实践

1. **JWT Token 自动附加**：`httpClient` 自动从 localStorage 读取并添加 token
2. **CORS 统一处理**：在 Nginx 层统一配置 CORS 策略
3. **敏感信息不记录**：登录密码等敏感信息不打印到控制台
4. **HTTPS**：生产环境必须使用 HTTPS

## 📚 相关资源

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Go-Zero 框架](https://go-zero.dev/)
- [Vanna AI](https://vanna.ai/)

## ❓ 常见问题

### Q: 如何切换到直连模式（不通过网关）？

A: 修改 `frontend/src/utils/serviceClient.ts`，直接指定服务地址：

```typescript
const systemClient = async (endpoint: string, options?: RequestInit) => {
  return fetch(`http://localhost:8888/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      ...options?.headers,
    }
  });
};
```

### Q: 如何添加请求拦截器？

A: 在 `httpClient.ts` 中修改：

```typescript
export const httpClient = async (endpoint: string, options: RequestInit = {}) => {
  // 请求前拦截
  console.log('Request:', endpoint, options);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {...});
  
  // 响应后拦截
  console.log('Response:', response.status);
  
  return response;
};
```

---

**维护者**: AI Agent Team  
**更新时间**: 2026-01-24
