package menus

import "github.com/jinguoxing/idrm-go-base/errorx"

var (
	// ErrMenuNotFound 菜单不存在
	ErrMenuNotFound = errorx.New(200142, "菜单不存在")

	// ErrMenuCodeExists 菜单编码已存在
	ErrMenuCodeExists = errorx.New(200131, "菜单编码已存在")

	// ErrMenuNameRequired 菜单名称必填
	ErrMenuNameRequired = errorx.New(200130, "菜单名称必填")

	// ErrMenuTypeInvalid 菜单类型无效
	ErrMenuTypeInvalid = errorx.New(200132, "菜单类型无效")

	// ErrMenuPathRequired 路由路径必填（page/directory类型）
	ErrMenuPathRequired = errorx.New(200133, "路由路径必填")

	// ErrMenuExternalUrlRequired 外部链接必填（external类型）
	ErrMenuExternalUrlRequired = errorx.New(200134, "外部链接必填")

	// ErrMenuOpenModeRequired 打开方式必填（external类型）
	ErrMenuOpenModeRequired = errorx.New(200135, "打开方式必填")

	// ErrMenuCycleDetected 父子关系形成循环
	ErrMenuCycleDetected = errorx.New(200136, "父子关系形成循环")

	// ErrMenuOrderConflict 同级排序值冲突
	ErrMenuOrderConflict = errorx.New(200137, "同级排序值冲突")

	// ErrMenuHasChildren 菜单存在子节点，不能删除
	ErrMenuHasChildren = errorx.New(200138, "菜单存在子节点，不能删除")

	// ErrMenuMoveCycle 移动菜单导致循环
	ErrMenuMoveCycle = errorx.New(200139, "移动菜单导致循环")

	// ErrMenuGroupConstraint 分组约束不满足（父子必须同组）
	ErrMenuGroupConstraint = errorx.New(200140, "分组约束不满足")

	// ErrMenuRouteConflict 路由冲突（path/route_name已存在）
	ErrMenuRouteConflict = errorx.New(200141, "路由冲突")

	// ErrMenuDeleted 菜单已删除
	ErrMenuDeleted = errorx.New(200145, "菜单已删除")
)
