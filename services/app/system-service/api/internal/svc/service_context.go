// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"fmt"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type ServiceContext struct {
	Config          config.Config
	DB              *gorm.DB
	UserModel       users.Model
	RoleBindingModel rolebindings.Model
	AuditLogModel   auditlogs.Model
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 初始化数据库连接
	db, err := initDB(c)
	if err != nil {
		panic(fmt.Sprintf("数据库初始化失败: %v", err))
	}

	return &ServiceContext{
		Config:          c,
		DB:              db,
		UserModel:       users.NewModel(db),
		RoleBindingModel: rolebindings.NewModel(db),
		AuditLogModel:   auditlogs.NewModel(db),
	}
}

// initDB 初始化数据库连接
func initDB(c config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		c.DB.Default.Username,
		c.DB.Default.Password,
		c.DB.Default.Host,
		c.DB.Default.Port,
		c.DB.Default.Database,
		c.DB.Default.Charset,
	)

	// 配置 GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// 根据配置设置日志级别
	switch c.DB.Default.LogLevel {
	case "silent":
		gormConfig.Logger = logger.Default.LogMode(logger.Silent)
	case "error":
		gormConfig.Logger = logger.Default.LogMode(logger.Error)
	case "warn":
		gormConfig.Logger = logger.Default.LogMode(logger.Warn)
	case "info":
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(mysql.Open(dsn), gormConfig)
	if err != nil {
		return nil, err
	}

	// 配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(c.DB.Default.MaxIdleConns)
	sqlDB.SetMaxOpenConns(c.DB.Default.MaxOpenConns)
	if c.DB.Default.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(time.Duration(c.DB.Default.ConnMaxLifetime) * time.Second)
	}
	if c.DB.Default.ConnMaxIdleTime > 0 {
		sqlDB.SetConnMaxIdleTime(time.Duration(c.DB.Default.ConnMaxIdleTime) * time.Second)
	}

	return db, nil
}
