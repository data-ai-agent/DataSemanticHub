package rolebindings

import (
	"gorm.io/gorm"
)

// NewModel 创建角色绑定 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormRoleBindingModel{
		db: db,
	}
}

// gormRoleBindingModel GORM 实现的角色绑定 Model
type gormRoleBindingModel struct {
	db *gorm.DB
}
