package menu_audit_logs

import "github.com/jinguoxing/idrm-go-base/errorx"

var (
	// ErrMenuAuditLogNotFound 审计日志不存在
	ErrMenuAuditLogNotFound = errorx.New(200142, "审计日志不存在")
)
