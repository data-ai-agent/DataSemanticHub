package menus

import (
	"time"

	"gorm.io/gorm"
)

// Menu 菜单实体
type Menu struct {
	Id            string         `gorm:"primaryKey;size:36" json:"id"`                                                                            // UUID v7
	Name          string         `gorm:"size:128;not null" json:"name"`                                                                           // 菜单名称
	Code          string         `gorm:"size:128;not null" json:"code"`                                                                           // 菜单编码
	Type          string         `gorm:"size:20;not null;index" json:"type"`                                                                      // 类型：directory/page/external/button
	GroupId       *string        `gorm:"size:36;index" json:"group_id,omitempty"`                                                                 // 菜单分组ID
	ParentId      *string        `gorm:"size:36;index" json:"parent_id,omitempty"`                                                                // 父菜单ID（根节点为空）
	Path          *string        `gorm:"size:255;index" json:"path,omitempty"`                                                                    // 路由路径（page/directory使用）
	RouteName     *string        `gorm:"size:128;index" json:"route_name,omitempty"`                                                              // 路由名称
	ComponentKey  *string        `gorm:"size:128" json:"component_key,omitempty"`                                                                 // 页面组件标识
	ExternalUrl   *string        `gorm:"size:512" json:"external_url,omitempty"`                                                                  // 外部链接（external类型必填）
	OpenMode      *string        `gorm:"size:20" json:"open_mode,omitempty"`                                                                      // 打开方式：new/iframe/same
	PermissionKey *string        `gorm:"size:128;index" json:"permission_key,omitempty"`                                                          // 权限标识（可选）
	Icon          *string        `gorm:"size:64" json:"icon,omitempty"`                                                                           // 图标名称（如 Layout, Database）
	Visible       bool           `gorm:"default:1;not null;index" json:"visible"`                                                                 // 是否可见
	Enabled       bool           `gorm:"default:1;not null;index" json:"enabled"`                                                                 // 是否启用
	Order         int            `gorm:"not null;default:0" json:"order"`                                                                         // 同级排序
	ShowInNav     bool           `gorm:"default:1;not null" json:"show_in_nav"`                                                                   // 是否在导航中显示
	Cacheable     bool           `gorm:"default:0;not null" json:"cacheable"`                                                                     // 是否可缓存
	CreatedAt     time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)" json:"created_at"`                                // 创建时间
	CreatedBy     *string        `gorm:"size:36" json:"created_by,omitempty"`                                                                     // 创建人ID
	UpdatedAt     time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)" json:"updated_at"` // 更新时间
	UpdatedBy     *string        `gorm:"size:36" json:"updated_by,omitempty"`                                                                     // 更新人ID
	DeletedAt     gorm.DeletedAt `gorm:"type:datetime(3);index:uk_code_deleted" json:"-"`                                                         // 软删除（不返回）
}

// TableName 指定表名
func (Menu) TableName() string {
	return "menus"
}

// FindTreeReq 查询菜单树请求参数
type FindTreeReq struct {
	Keyword        string // 搜索关键词（name/code/path/permission_key）
	Enabled        *bool  // 是否启用（使用指针以支持 false 值筛选）
	Visible        *bool  // 是否可见（使用指针以支持 false 值筛选）
	PermissionBind string // 权限绑定状态：bound/unbound
	Type           string // 类型：directory/page/external/button
	GroupId        string // 分组ID
}

// OrderUpdate 排序更新
type OrderUpdate struct {
	Id    string
	Order int
}

// Statistics 菜单统计信息
type Statistics struct {
	Total             int64 // 总菜单数
	Enabled           int64 // 启用菜单数
	Hidden            int64 // 隐藏菜单数
	UnboundPermission int64 // 未绑定权限菜单数（高风险）
}
