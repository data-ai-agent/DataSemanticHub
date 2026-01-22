package auditlogs

import "github.com/jinguoxing/idrm-go-base/errorx"

var (
	// ErrAuditLogNotFound 审计日志不存在
	ErrAuditLogNotFound = errorx.New(30211, "审计日志不存在")
)
