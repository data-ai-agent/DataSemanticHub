# LLM 后端 API 规范

本文档定义了场景驱动建模功能所需的后端 API 接口规范。

---

## API 端点总览

| 端点 | 方法 | 功能 | 超时时间 |
|------|------|------|----------|
| `/api/llm/analyze-scenario` | POST | 分析场景描述，提取业务要素 | 30s |
| `/api/llm/upload-policy` | POST | 上传政策文件 | 60s |
| `/api/llm/parse-policy` | POST | 解析政策文件，提取场景 | 120s |
| `/api/llm/generate-objects` | POST | 生成业务对象建议 | 30s |

---

## 1. 分析场景描述

### 请求

**端点**: `POST /api/llm/analyze-scenario`

**Content-Type**: `application/json`

**Body**:
```json
{
  "description": "申请人持本人身份证、户口簿和医疗机构出具的残疾证明到县级残联提出申请...",
  "context": "残疾证申领流程",
  "provider": "openai",
  "model": "gpt-4o"
}
```

### 响应

**成功响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "elements": {
      "subjects": ["申请人", "县级残联", "医疗机构"],
      "actions": ["提交", "审核", "批准", "出具"],
      "objects": ["身份证", "户口簿", "残疾证明", "申请材料"],
      "states": ["待审核", "审核中", "已批准", "已拒绝"],
      "rules": ["必须持本人身份证", "需医疗机构出具证明"]
    },
    "confidence": 0.92,
    "suggestions": ["建议补充审核时限说明"]
  }
}
```

**错误响应** (400/500):
```json
{
  "success": false,
  "error": {
    "code": "LLM_API_ERROR",
    "message": "LLM 服务暂时不可用"
  }
}
```

### Prompt 提示词建议

```
你是一个业务分析专家。请分析以下业务场景描述，提取关键业务要素：

场景描述：
{description}

请识别：
1. **主体 (Subjects)**: 参与业务的人员或组织角色
2. **行为 (Actions)**: 主体执行的操作动词
3. **客体/材料 (Objects)**: 业务中涉及的实物或文档
4. **状态 (States)**: 业务流程中的状态变化
5. **规则 (Rules)**: 业务约束条件（如果...必须...）

以 JSON 格式返回，格式如下：
{
  "elements": { ... },
  "confidence": 0-1之间的数字,
  "suggestions": ["改进建议"]
}
```

---

## 2. 上传政策文件

### 请求

**端点**: `POST /api/llm/upload-policy`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: File (PDF/DOCX/图片)

### 响应

**成功响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://storage.example.com/uploads/policy_20260116_xxx.pdf",
    "fileName": "残疾人保障法.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2026-01-16T16:45:00Z"
  }
}
```

### 实现建议

1. 文件存储到临时目录或对象存储（OSS/S3）
2. 返回文件访问 URL 供后续解析使用
3. 设置文件过期时间（如 24 小时后自动删除）

---

## 3. 解析政策文件

### 请求

**端点**: `POST /api/llm/parse-policy`

**Content-Type**: `application/json`

**Body**:
```json
{
  "fileUrl": "https://storage.example.com/uploads/policy_xxx.pdf",
  "fileName": "残疾人保障法.pdf",
  "fileType": "pdf",
  "provider": "claude",
  "model": "claude-3-5-sonnet-20241022"
}
```

### 响应

**成功响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "id": "scene_001",
        "title": "残疾证申领流程",
        "description": "文档第2章第5条：申请人应当持本人身份证...",
        "elements": {
          "subjects": ["申请人", "县级残联"],
          "actions": ["提交申请", "审核", "批准"],
          "objects": ["身份证", "残疾证明"],
          "states": ["待审核", "已批准"]
        },
        "confidence": 0.92,
        "sourceLocation": {
          "chapter": "第2章",
          "article": "第5条",
          "pageNumber": 12
        }
      },
      {
        "id": "scene_002",
        "title": "残疾证补办流程",
        "description": "文档第3章第1条：残疾证遗失的...",
        "elements": { ... },
        "confidence": 0.88,
        "sourceLocation": { ... }
      }
    ],
    "metadata": {
      "totalPages": 50,
      "processedAt": "2026-01-16T16:50:00Z",
      "warnings": ["第10页OCR识别度较低"]
    }
  }
}
```

### Prompt 提示词建议

```
你是一个政策文档分析专家。请分析以下政策文档，将其切分为独立的业务场景。

文档内容：
{documentText}

任务：
1. 识别文档结构（章节、条款）
2. 将描述同一业务事项的段落聚合为一个"场景"
3. 为每个场景提取业务要素（主体、行为、客体、状态）
4. 评估每个场景的提取置信度

返回 JSON 数组，每个场景包含：
- title: 场景名称
- description: 场景描述原文
- elements: { subjects, actions, objects, states }
- confidence: 置信度
- sourceLocation: { chapter, article, pageNumber }
```

### 实现要点

1. **PDF 处理**: 使用 PyPDF2、PDFPlumber 或 Adobe API
2. **OCR**: 对于扫描件使用 Tesseract 或商用 OCR 服务
3. **长文本处理**: 
   - 对于超长文档，分段调用 LLM
   - 使用 Token 窗口滑动策略
   - Claude 支持 200K tokens，适合长文档

---

## 4. 生成业务对象

### 请求

**端点**: `POST /api/llm/generate-objects`

**Content-Type**: `application/json`

**Body**:
```json
{
  "elements": {
    "subjects": ["申请人", "县级残联"],
    "actions": ["提交", "审核"],
    "objects": ["身份证", "残疾证明"],
    "states": ["待审核", "已批准"]
  },
  "scenarioContext": "残疾证申领流程",
  "provider": "openai",
  "model": "gpt-4o"
}
```

### 响应

**成功响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "objects": [
      {
        "name": "申请人",
        "type": "Subject",
        "description": "发起残疾证申请的公民",
        "attributes": [
          {
            "name": "身份证号",
            "type": "string",
            "description": "18位身份证号码",
            "required": true
          },
          {
            "name": "姓名",
            "type": "string",
            "required": true
          }
        ],
        "behaviors": ["提交申请", "查询进度"]
      },
      {
        "name": "残疾证申请",
        "type": "BusinessObject",
        "description": "残疾证申请业务单据",
        "attributes": [
          {
            "name": "申请编号",
            "type": "string",
            "description": "唯一申请编号",
            "required": true
          },
          {
            "name": "申请时间",
            "type": "date",
            "required": true
          },
          {
            "name": "残疾证明",
            "type": "object",
            "description": "医疗机构出具的残疾证明文件"
          }
        ],
        "states": ["待审核", "审核中", "已批准", "已拒绝"]
      }
    ],
    "relationships": [
      {
        "from": "申请人",
        "to": "残疾证申请",
        "type": "创建"
      },
      {
        "from": "县级残联",
        "to": "残疾证申请",
        "type": "审核"
      }
    ]
  }
}
```

### Prompt 提示词建议

```
根据以下业务要素，生成标准化的业务对象定义。

业务要素：
- 主体: {subjects}
- 行为: {actions}
- 客体: {objects}
- 状态: {states}

场景上下文: {scenarioContext}

规则：
1. 主体类型为 "Subject"，需要基本属性和行为方法
2. 客体类型为 "BusinessObject"，需要属性和状态机
3. 推断属性的数据类型
4. 识别对象间的关联关系

返回 JSON 格式，包含 objects 和 relationships 数组。
```

---

## 通用规范

### 错误码

| 错误码 | 说明 |
|--------|------|
| `INVALID_REQUEST` | 请求参数错误 |
| `FILE_TOO_LARGE` | 文件超过大小限制 |
| `UNSUPPORTED_FILE_TYPE` | 不支持的文件类型 |
| `LLM_API_ERROR` | LLM 服务调用失败 |
| `LLM_TIMEOUT` | LLM 调用超时 |
| `OCR_FAILED` | OCR 识别失败 |
| `INSUFFICIENT_QUOTA` | API 配额不足 |

### 安全要求

1. **API Key 管理**: API Key 必须在后端管理，不暴露给前端
2. **文件上传限制**: 
   - 大小限制：10MB
   - 格式限制：PDF, DOCX, JPG, PNG
   - 病毒扫描
3. **速率限制**: 
   - 每个用户每分钟最多 10 次请求
   - 使用 Redis 实现速率限制

### 性能优化

1. **缓存策略**: 
   - 相同的场景描述缓存分析结果（1小时）
   - 使用 Redis 或内存缓存
2. **异步处理**: 
   - 大文件解析使用异步队列（Celery/Bull）
   - 返回任务 ID，前端轮询结果
3. **批量处理**: 
   - 支持批量场景分析
   - 使用 LLM 批量 API 降低成本

---

## 部署建议

### 推荐技术栈

- **后端框架**: FastAPI (Python) / Express.js (Node.js)
- **LLM SDK**: 
  - OpenAI: `openai` Python SDK
  - Claude: `anthropic` Python SDK
- **文件处理**: 
  - PDF: `PyPDF2`, `pdfplumber`
  - OCR: `pytesseract`, `EasyOCR`
- **任务队列**: Celery + Redis
- **存储**: MinIO / AWS S3

### 环境变量

```bash
# LLM API Keys (敏感信息，使用密钥管理服务)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# LLM Configuration
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=/tmp/uploads
FILE_EXPIRY_HOURS=24

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=3600
```

---

## 测试示例

### cURL 测试

```bash
# 1. 分析场景
curl -X POST http://localhost:3000/api/llm/analyze-scenario \
  -H "Content-Type: application/json" \
  -d '{
    "description": "申请人持本人身份证到县级残联提出申请",
    "provider": "openai"
  }'

# 2. 上传文件
curl -X POST http://localhost:3000/api/llm/upload-policy \
  -F "file=@policy.pdf"

# 3. 解析政策
curl -X POST http://localhost:3000/api/llm/parse-policy \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://storage.example.com/uploads/xxx.pdf",
    "fileName": "policy.pdf",
    "fileType": "pdf",
    "provider": "claude"
  }'
```

---

## 附录: LLM Provider 配置参考

### OpenAI
```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是业务分析专家"},
        {"role": "user", "content": prompt}
    ],
    response_format={"type": "json_object"}
)
```

### Claude
```python
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    messages=[
        {"role": "user", "content": prompt}
    ]
)
```
