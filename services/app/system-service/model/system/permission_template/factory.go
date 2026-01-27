package permission_template

import (
	"gorm.io/gorm"
)

// NewModel 创建权限模板 Model 实例（GORM）
func NewModel(db *gorm.DB) Model {
	return &gormPermissionTemplateModel{
		db: db,
	}
}
