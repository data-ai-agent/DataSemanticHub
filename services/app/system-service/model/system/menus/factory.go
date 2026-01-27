package menus

import (
	"gorm.io/gorm"
)

// NewModel 创建菜单 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormMenuModel{
		db: db,
	}
}

// gormMenuModel GORM 实现的菜单 Model
type gormMenuModel struct {
	db *gorm.DB
}
