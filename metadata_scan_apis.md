# 元数据扫描相关接口

基于 swaggerApi-metadata.json 文件，以下是所有与元数据扫描相关的接口：

## 1. 新增元数据扫描任务
- **接口路径**: `POST /api/data-connection/v1/metadata/scan`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 创建新的元数据扫描任务
- **请求体参数**:
  - scan_name: 扫描任务名称
  - type: 扫描任务类型 (0: 数据源-即时扫描, 1: 特定表-即时扫描, 2: 数据源-定时扫描)
  - ds_info: 数据源信息 (包括数据源ID、类型、扫描策略等)
  - tables: 表ID列表 (当type为1或3时需要)
  - cron_expression: 定时表达式 (针对定时扫描)
  - status: 任务状态 (open/close)

## 2. 获取所有扫描任务列表
- **接口路径**: `GET /api/data-connection/v1/metadata/scan`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 获取所有元数据扫描任务列表
- **返回值示例**:
```
{
  "total_count": 10,
  "entries": [{
    "id": "d0027d29-1b12-4012-aee6-157ea5f725a0",
    "schedule_id": null,
    "name": "扫描一个数据源mysql",
    "type": 0,
    "ds_type": "opensearch",
    "create_user": "张三",
    "scan_status": "running",
    "task_status": "disable",
    "start_time": "2025-11-05 13:13:31",
    "task_process_info": {
      "table_count": 2,
      "success_count": 1,
      "fail_count": 1
    },
    "task_result_info": {
      "table_count": 20,
      "success_count": 10,
      "fail_count": 1,
      "fail_stage": 1,
      "error_stack": "null pointer"
    }
  }]
}
```

## 3. 查询扫描任务的表信息
- **接口路径**: `GET /api/data-connection/v1/metadata/scan/info/{taskId}`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 查询指定扫描任务的表信息
- **路径参数**:
  - taskId: 任务ID
- **查询参数**:
  - status: 状态过滤 (可选: wait, running, success, fail)
  - limit: 每页数量
  - offset: 偏移量
  - keyword: 搜索关键词

## 4. 更新定时扫描任务
- **接口路径**: `PUT /api/data-connection/v1/metadata/scan/schedule`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 更新定时扫描任务配置
- **请求体参数**:
  - schedule_id: 定时任务ID
  - cron_expression: 定时表达式
  - scan_strategy: 扫描策略
  - status: 状态 (open/close)

## 5. 查询定时扫描任务执行列表
- **接口路径**: `GET /api/data-connection/v1/metadata/scan/schedule/task/{scheduleId}`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 查询指定定时扫描任务的执行历史列表
- **路径参数**:
  - scheduleId: 定时任务ID
- **查询参数**:
  - limit: 每页数量
  - offset: 偏移量

## 6. 查询定时扫描任务状态
- **接口路径**: `GET /api/data-connection/v1/metadata/scan/schedule/{scheduleId}`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 查询指定定时扫描任务的状态信息
- **路径参数**:
  - scheduleId: 定时任务ID
- **查询参数**:
  - type: 类型

## 7. 查询扫描任务的table信息
- **接口路径**: `GET /api/data-connection/v1/metadata/scan/info/{taskId}`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 查询扫描任务的table信息

## 8. 批量创建并启动扫描任务
- **接口路径**: `POST /api/data-connection/v1/metadata/scan/batch`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 批量创建并启动扫描任务

## 9. 获取定时扫描任务执行列表
- **接口路径**: `GET /api/data-connection/v1/metadata/scan/schedule/exec/{scheduleId}`
- **接口标签**: 元数据管理-dc-metadata
- **功能**: 获取定时扫描任务执行列表