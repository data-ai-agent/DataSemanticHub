// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"context"
	"fmt"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/config"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/middleware"
	"github.com/DataSemanticHub/services/app/system-service/model/system/organization"
	"github.com/DataSemanticHub/services/app/system-service/model/system/userdept"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/redis/go-redis/v9"
	"github.com/zeromicro/go-zero/rest"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type ServiceContext struct {
	Config           config.Config
	DB               *gorm.DB
	RedisClient      *redis.Client
	UserModel        users.Model
	RoleBindingModel rolebindings.Model
	AuditLogModel    auditlogs.Model
	OrgModel         organization.Model
	OrgTreeService   organization.TreeService
	UserDeptModel    userdept.Model
	Authority        rest.Middleware
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 初始化数据库连接
	db, err := initDB(c)
	if err != nil {
		panic(fmt.Sprintf("数据库初始化失败: %v", err))
	}

	// 初始化 Redis 客户端
	redisClient := initRedis(c)

	// 初始化 Organization Model
	orgModel := organization.NewModel(db)

	// 初始化 Authority 中间件
	authority := middleware.NewAuthorityMiddleware().Handle

	return &ServiceContext{
		Config:           c,
		DB:               db,
		RedisClient:      redisClient,
		UserModel:        users.NewModel(db),
		RoleBindingModel: rolebindings.NewModel(db),
		AuditLogModel:    auditlogs.NewModel(db),
		OrgModel:         orgModel,
		OrgTreeService:   organization.NewTreeService(orgModel),
		UserDeptModel:    userdept.NewModel(db),
		Authority:        authority,
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

// initRedis 初始化 Redis 连接
func initRedis(c config.Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port),
		Password: c.Redis.Password,
		DB:       c.Redis.DB,
	})
}

// BuildDeptCache 构建用户数据权限缓存
func (s *ServiceContext) BuildDeptCache(ctx context.Context, userId string) error {
	// 1. 查询用户主部门
	primaryDept, err := s.UserDeptModel.FindPrimaryByUserId(ctx, userId)
	if err != nil {
		return fmt.Errorf("查询主部门失败: %w", err)
	}
	if primaryDept == nil {
		// 用户没有主部门，不构建缓存
		return nil
	}

	// 2. 查询主部门的所有子部门
	depts := []string{primaryDept.DeptId}
	descendants, err := s.OrgModel.FindSubtree(ctx, primaryDept.DeptId)
	if err != nil {
		return fmt.Errorf("查询子部门失败: %w", err)
	}
	for _, d := range descendants {
		depts = append(depts, d.Id)
	}

	// 3. 写入 Redis Set
	key := fmt.Sprintf("user:dept:%s", userId)
	members := make([]interface{}, len(depts))
	for i, deptId := range depts {
		members[i] = deptId
	}

	return s.RedisClient.SAdd(ctx, key, members...).Err()
}

// InvalidateDeptCache 失效指定用户的数据权限缓存
func (s *ServiceContext) InvalidateDeptCache(ctx context.Context, userId string) error {
	key := fmt.Sprintf("user:dept:%s", userId)
	return s.RedisClient.Del(ctx, key).Err()
}

// InvalidateDeptCacheByDept 失效指定部门的所有相关用户缓存
func (s *ServiceContext) InvalidateDeptCacheByDept(ctx context.Context, deptId string) error {
	// 1. 查询该部门的所有用户（主部门 + 辅助部门）
	users, err := s.UserDeptModel.FindUsersByDeptId(ctx, deptId, nil)
	if err != nil {
		return fmt.Errorf("查询部门用户失败: %w", err)
	}

	// 2. 批量删除这些用户的缓存
	for _, userDept := range users {
		key := fmt.Sprintf("user:dept:%s", userDept.UserId)
		if err := s.RedisClient.Del(ctx, key).Err(); err != nil {
			// 记录错误但继续处理其他用户
			fmt.Printf("删除用户缓存失败: userId=%s, error=%v\n", userDept.UserId, err)
		}
	}

	return nil
}
