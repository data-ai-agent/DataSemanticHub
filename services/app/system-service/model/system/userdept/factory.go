package userdept

import (
	"gorm.io/gorm"
)

// NewModel 创建 UserDept Model 实例
func NewModel(db *gorm.DB) Model {
	return &gormDAO{db: db}
}
