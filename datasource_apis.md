# 数据源管理API接口（增删改查）

## 1. 新增数据源（Create）
**接口路径**: `POST /api/data-connection/v1/datasource`
- **功能**: 新增数据源
- **描述**: 创建一个新的数据源连接
- **请求体**: DataSourceVo对象，包含数据源名称、类型、配置等信息
- **验证**: 名称不能为空，长度1-128字符，支持中英文、数字、下划线和中划线

## 2. 查询数据源列表（Read）
**接口路径**: `GET /api/data-connection/v1/datasource`
- **功能**: 查询数据源列表
- **描述**: 获取所有数据源的列表，支持分页、关键词搜索、类型筛选等
- **参数**:
  - limit: 每页数量，默认-1（查全部）
  - offset: 偏移量，默认0
  - keyword: 搜索关键词，模糊匹配数据源名称、连接地址
  - type: 数据源类型（structured、no-structured、other），多个类型用逗号分隔
  - direction: 排序方向（asc/desc），默认desc
  - sort: 排序字段（updated_at/created_at/name），默认created_at

## 3. 查询数据源详情（Read）
**接口路径**: `GET /api/data-connection/v1/datasource/{id}`
- **功能**: 查询指定ID的数据源详情
- **描述**: 根据数据源ID获取单个数据源的详细信息
- **路径参数**: id（数据源ID，最大长度36字符）

## 4. 更新数据源（Update）
**接口路径**: `PUT /api/data-connection/v1/datasource/{id}`
- **功能**: 更新数据源
- **描述**: 根据数据源ID更新数据源配置信息
- **路径参数**: id（数据源ID，最大长度36字符）
- **请求体**: DataSourceVo对象

## 5. 删除数据源（Delete）
**接口路径**: `DELETE /api/data-connection/v1/datasource/{id}`
- **功能**: 删除数据源
- **描述**: 根据数据源ID删除指定数据源
- **路径参数**: id（数据源ID，最大长度36字符）

## 6. 测试数据源连接（辅助功能）
**接口路径**: `POST /api/data-connection/v1/datasource/test`
- **功能**: 测试数据源连接
- **描述**: 测试数据源配置是否正确，连接是否可用
- **请求体**: TestDataSourceVo对象

## 7. 查询所有支持的数据源类型（辅助功能）
**接口路径**: `GET /api/data-connection/v1/datasource/connectors`
- **功能**: 查询所有支持的数据源类型
- **参数**:
  - type: 数据源类型（structured、no-structured、other）