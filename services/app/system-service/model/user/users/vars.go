package users

import "github.com/jinguoxing/idrm-go-base/errorx"

var (
	// ErrUserNotFound 用户不存在
	ErrUserNotFound = errorx.New(30100, "用户不存在")

	// ErrEmailExists 邮箱已被注册
	ErrEmailExists = errorx.New(30103, "该邮箱已被注册")
)
