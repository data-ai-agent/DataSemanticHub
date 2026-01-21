package users

import (
	"gorm.io/gorm"
)

// NewModel 创建用户 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormUserModel{
		db: db,
	}
}

// gormUserModel GORM 实现的用户 Model
type gormUserModel struct {
	db *gorm.DB
}
