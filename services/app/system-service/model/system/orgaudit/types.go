package orgaudit

// 操作类型常量
const (
	OperationCreate = "create" // 创建部门
	OperationDelete = "delete" // 删除部门
	OperationMove   = "move"   // 移动部门
	OperationUpdate = "update" // 更新部门（可选）
)

// 审计日志查询默认限制
const (
	DefaultQueryLimit = 100  // 默认查询最近100条
	MaxQueryLimit     = 1000 // 最大查询限制
)
