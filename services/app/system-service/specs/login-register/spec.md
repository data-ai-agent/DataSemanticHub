# 登录注册功能规格文档 (Login/Register Specification)

> **Branch**: `feature/login-register`  
> **Spec Path**: `specs/login-register/`  
> **Created**: 2025-01-27  
> **Status**: Draft

---

## Overview

完善 DataSemanticHub 数据语义治理平台的用户认证体系，提供用户注册、登录、单点登录（SSO）和密码管理功能。前端页面已完成设计与开发，本规格文档明确后端接口需求及业务逻辑。

---

## User Stories

### Story 1: 用户注册 (P1)

AS a 新用户
I WANT 通过邮箱注册账号并填写基本信息
SO THAT 我可以使用 DataSemanticHub 平台进行数据语义治理

**独立测试**: 提交有效的注册信息后，系统创建用户账号并返回成功响应，用户可立即登录。

### Story 2: 用户登录 (P1)

AS a 已注册用户
I WANT 使用邮箱和密码登录系统
SO THAT 我可以访问我的工作台和功能模块

**独立测试**: 使用正确的邮箱和密码登录后，系统返回认证 Token，用户可访问受保护资源。

### Story 3: 单点登录 (P2)

AS a 企业用户
I WANT 通过 SSO 方式登录系统
SO THAT 我可以使用企业统一身份认证，无需单独管理密码

**独立测试**: 点击 SSO 登录按钮后，系统重定向至 IDP 认证页面，认证成功后返回系统并完成登录。

### Story 4: 忘记密码 (P3)

AS a 忘记密码的用户
I WANT 通过邮箱找回密码
SO THAT 我可以重置密码并重新登录

**独立测试**: 提交邮箱后，系统发送密码重置邮件，用户点击邮件链接可重置密码。

---

## Acceptance Criteria (EARS)

### 正常流程

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | 用户注册成功 | WHEN 用户提交所有必填字段（firstName, lastName, email, organization, password, confirmPassword）且邮箱格式正确、密码一致、已同意条款 | THE SYSTEM SHALL 创建用户账号，密码加密存储，返回 201 和用户基本信息 |
| AC-02 | 用户登录成功 | WHEN 用户提交正确的邮箱和密码 | THE SYSTEM SHALL 验证凭证，生成 JWT Token，返回 200 和 Token 信息 |
| AC-03 | 记住我登录 | WHEN 用户勾选"记住我"并成功登录 | THE SYSTEM SHALL 生成长期有效的 Refresh Token，Token 有效期延长 |
| AC-04 | 获取用户信息 | WHEN 已认证用户请求用户信息 | THE SYSTEM SHALL 返回 200 和当前用户的详细信息 |
| AC-05 | 用户退出登录 | WHEN 已认证用户请求退出登录 | THE SYSTEM SHALL 使当前 Token 失效，返回 200 |

### 异常处理

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-10 | 注册邮箱已存在 | WHEN 用户注册时使用的邮箱已被注册 | THE SYSTEM SHALL 返回 409 Conflict，提示"该邮箱已被注册" |
| AC-11 | 注册必填字段缺失 | WHEN 用户提交注册请求时缺少必填字段 | THE SYSTEM SHALL 返回 400 Bad Request，提示缺失的字段 |
| AC-12 | 注册邮箱格式错误 | WHEN 用户提交的邮箱不符合标准格式 | THE SYSTEM SHALL 返回 400 Bad Request，提示"邮箱格式不正确" |
| AC-13 | 注册密码不一致 | WHEN 用户提交的密码与确认密码不一致 | THE SYSTEM SHALL 返回 400 Bad Request，提示"两次输入的密码不一致" |
| AC-14 | 注册未同意条款 | WHEN 用户未勾选"我同意服务条款与隐私政策" | THE SYSTEM SHALL 返回 400 Bad Request，提示"请同意服务条款与隐私政策" |
| AC-15 | 登录凭证错误 | WHEN 用户提交错误的邮箱或密码 | THE SYSTEM SHALL 返回 401 Unauthorized，提示"用户名或密码错误"（不泄露账户是否存在） |
| AC-16 | 登录必填字段缺失 | WHEN 用户提交登录请求时缺少邮箱或密码 | THE SYSTEM SHALL 返回 400 Bad Request，提示缺失的字段 |
| AC-17 | 未授权访问 | WHEN 未认证用户访问需要认证的接口 | THE SYSTEM SHALL 返回 401 Unauthorized，提示"请先登录" |
| AC-18 | Token 无效或过期 | WHEN 用户使用无效或过期的 Token 访问接口 | THE SYSTEM SHALL 返回 401 Unauthorized，提示"Token 无效或已过期" |

---

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-01 | 并发注册相同邮箱 | 仅第一个请求成功，其他请求返回 409 Conflict |
| EC-02 | 密码包含特殊字符 | 系统应支持常见特殊字符，但需明确密码复杂度要求 |
| EC-03 | 邮箱大小写处理 | 邮箱应统一转换为小写存储和比较，避免大小写导致的重复注册 |
| EC-04 | 密码长度边界 | 密码长度应在合理范围内（建议 8-128 字符），超出范围返回 400 |
| EC-05 | 组织名称超长 | 组织名称应有长度限制（建议 1-100 字符），超出返回 400 |
| EC-06 | 姓名包含特殊字符 | 姓名应支持常见字符（中文、英文、空格、连字符），特殊字符需验证 |
| EC-07 | 登录频繁失败 | 连续多次登录失败后，应实施临时锁定机制（如 5 次失败后锁定 15 分钟） |
| EC-08 | Token 刷新机制 | Refresh Token 过期后，用户需重新登录；Refresh Token 应支持单次使用或有效期管理 |

---

## Business Rules

| ID | Rule | Description |
|----|------|-------------|
| BR-01 | 邮箱唯一性 | 每个邮箱只能注册一个账号，邮箱作为登录凭证必须唯一 |
| BR-02 | 密码加密存储 | 密码必须使用 bcrypt 等安全算法加密存储，禁止明文存储 |
| BR-03 | 密码复杂度 | 密码应满足最低复杂度要求（建议：至少 8 位，包含字母和数字） |
| BR-04 | 条款同意 | 用户注册时必须同意服务条款与隐私政策，否则无法完成注册 |
| BR-05 | 登录安全 | 登录失败时统一提示"用户名或密码错误"，不泄露账户是否存在的信息 |
| BR-06 | Token 有效期 | 普通登录 Token 有效期建议 24 小时，"记住我"登录 Token 有效期建议 7 天 |
| BR-07 | 自动登录 | 注册成功后，系统应自动完成登录并返回 Token，用户无需再次登录 |
| BR-08 | SSO 支持 | MVP 阶段 SSO 功能可预留接口，或仅做静态展示，后续版本实现完整流程 |

---

## Data Considerations

| Field | Description | Constraints |
|-------|-------------|-------------|
| id | 用户唯一标识 | UUID v7，主键，CHAR(36) |
| firstName | 用户名字（名） | 必填，1-50 字符，支持中文、英文、空格、连字符 |
| lastName | 用户姓氏（姓） | 必填，1-50 字符，支持中文、英文、空格、连字符 |
| email | 登录邮箱 | 必填，唯一，标准邮箱格式，存储时统一小写 |
| organization | 所属组织/团队 | 可选，1-100 字符 |
| password | 登录密码 | 必填，8-128 字符，bcrypt 加密存储 |
| passwordHash | 密码哈希值 | 系统生成，bcrypt 算法，60 字符 |
| rememberMe | 记住我选项 | 布尔值，影响 Token 有效期 |
| status | 用户状态 | 启用/禁用，默认启用 |
| createdAt | 创建时间 | 系统生成，TIMESTAMP |
| updatedAt | 更新时间 | 系统生成，TIMESTAMP |
| lastLoginAt | 最后登录时间 | 可选，TIMESTAMP |

---

## Success Metrics

| ID | Metric | Target |
|----|--------|--------|
| SC-01 | 注册接口响应时间 | < 300ms (P99) |
| SC-02 | 登录接口响应时间 | < 200ms (P99) |
| SC-03 | 测试覆盖率 | ≥ 80% |
| SC-04 | 密码加密强度 | bcrypt cost ≥ 10 |

---

## Open Questions

- [ ] 密码复杂度具体要求是什么？（最小长度、是否必须包含数字/字母/特殊字符）
- [ ] "记住我"功能的 Token 有效期具体是多长？
- [ ] SSO 功能在 MVP 阶段是否需要实现，还是仅预留接口？
- [ ] 忘记密码功能在 MVP 阶段是否需要实现完整流程？
- [ ] 是否需要邮箱验证功能（注册后发送验证邮件）？
- [ ] 用户状态管理（启用/禁用）是否需要管理员接口？

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-27 | - | 初始版本 |
