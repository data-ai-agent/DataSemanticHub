package rolebindings

import "github.com/jinguoxing/idrm-go-base/errorx"

var (
	// ErrRoleBindingNotFound 角色绑定不存在
	ErrRoleBindingNotFound = errorx.New(30210, "角色绑定不存在")
)
