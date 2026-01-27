package organization

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/model/system/organization"
	"github.com/DataSemanticHub/services/app/system-service/model/system/userdept"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupCacheTestDB 创建测试数据库
func setupCacheTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{}, &userdept.SysUserDept{}, &users.User{})
	require.NoError(t, err)

	return db
}

// setupCacheTestRedis 创建测试Redis
func setupCacheTestRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	s := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})
	return s, client
}

// createCacheTestOrg 创建测试组织
func createCacheTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
	id, _ := uuid.NewV7()
	now := time.Now().Format("2006-01-02 15:04:05")
	org := &organization.SysOrganization{
		Id:        id.String(),
		ParentId:  parentId,
		Name:      name,
		Code:      code,
		SortOrder: sortOrder,
		Type:      2,
		Status:    1,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if parentId == "0" {
		org.Ancestors = "0"
	} else {
		var parent organization.SysOrganization
		err := db.Where("id = ?", parentId).First(&parent).Error
		require.NoError(t, err)
		org.Ancestors = parent.Ancestors + "," + parent.Id
	}

	err := db.Create(org).Error
	require.NoError(t, err)
	return org
}

// createCacheTestUser 创建测试用户
func createCacheTestUser(t *testing.T, db *gorm.DB, name string) *users.User {
	id, _ := uuid.NewV7()
	now := time.Now()
	user := &users.User{
		Id:            id.String(),
		FirstName:     name,
		LastName:      "Test",
		Name:          name,
		Email:         name + "@test.com",
		PasswordHash:  "hashed_password",
		AccountSource: "local",
		Status:        1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	err := db.Create(user).Error
	require.NoError(t, err)
	return user
}

// createCacheTestUserDept 创建测试用户部门关联
func createCacheTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) {
	id, _ := uuid.NewV7()
	userDept := &userdept.SysUserDept{
		Id:        id.String(),
		UserId:    userId,
		DeptId:    deptId,
		IsPrimary: isPrimary,
	}

	err := db.Create(userDept).Error
	require.NoError(t, err)
}

// TestOrgCache_BuildDeptCache_SuccessfullyBuildsCache 测试成功构建缓存
func TestOrgCache_BuildDeptCache_SuccessfullyBuildsCache(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建组织结构: root -> dept1 -> team1
	root := createCacheTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createCacheTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	team1 := createCacheTestOrg(t, db, dept1.Id, "后端组", "BACKEND", 1)

	// 创建用户并设置主部门
	user := createCacheTestUser(t, db, "Alice")
	createCacheTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 构建缓存
	err := logic.BuildDeptCache(user.Id)
	require.NoError(t, err)

	// 验证缓存内容
	key := fmt.Sprintf("user:dept:%s", user.Id)
	members, err := redisClient.SMembers(ctx, key).Result()
	require.NoError(t, err)
	assert.Len(t, members, 2) // dept1, team1
	assert.Contains(t, members, dept1.Id)
	assert.Contains(t, members, team1.Id)
}

// TestOrgCache_BuildDeptCache_UserWithNoPrimaryDepartment_SkipsCache 测试没有主部门的用户跳过缓存构建
func TestOrgCache_BuildDeptCache_UserWithNoPrimaryDepartment_SkipsCache(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建用户（没有主部门）
	user := createCacheTestUser(t, db, "Alice")

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 构建缓存（应该跳过）
	err := logic.BuildDeptCache(user.Id)
	require.NoError(t, err)

	// 验证缓存不存在
	key := fmt.Sprintf("user:dept:%s", user.Id)
	exists, _ := redisClient.Exists(ctx, key).Result()
	assert.Equal(t, int64(0), exists)
}

// TestOrgCache_InvalidateDeptCache_SuccessfullyInvalidatesCache 测试成功失效用户缓存
func TestOrgCache_InvalidateDeptCache_SuccessfullyInvalidatesCache(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建组织和用户
	dept1 := createCacheTestOrg(t, db, "0", "技术部", "TECH", 1)
	user := createCacheTestUser(t, db, "Alice")
	createCacheTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 先构建缓存
	_ = logic.BuildDeptCache(user.Id)

	// 验证缓存存在
	key := fmt.Sprintf("user:dept:%s", user.Id)
	exists, _ := redisClient.Exists(ctx, key).Result()
	assert.Equal(t, int64(1), exists)

	// 失效缓存
	err := logic.InvalidateDeptCache(user.Id)
	require.NoError(t, err)

	// 验证缓存已删除
	exists, _ = redisClient.Exists(ctx, key).Result()
	assert.Equal(t, int64(0), exists)
}

// TestOrgCache_InvalidateDeptCacheByDept_SuccessfullyInvalidatesMultipleUsers 测试成功失效部门的所有相关用户缓存
func TestOrgCache_InvalidateDeptCacheByDept_SuccessfullyInvalidatesMultipleUsers(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建组织和用户
	dept1 := createCacheTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createCacheTestOrg(t, db, "0", "市场部", "MARKET", 2)
	user1 := createCacheTestUser(t, db, "Alice")
	user2 := createCacheTestUser(t, db, "Bob")
	user3 := createCacheTestUser(t, db, "Charlie")

	// user1 -> dept1 (主), dept2 (辅)
	// user2 -> dept1 (主)
	// user3 -> dept2 (主)
	createCacheTestUserDept(t, db, user1.Id, dept1.Id, 1)
	createCacheTestUserDept(t, db, user1.Id, dept2.Id, 0)
	createCacheTestUserDept(t, db, user2.Id, dept1.Id, 1)
	createCacheTestUserDept(t, db, user3.Id, dept2.Id, 1)

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 为所有用户构建缓存
	_ = logic.BuildDeptCache(user1.Id)
	_ = logic.BuildDeptCache(user2.Id)
	_ = logic.BuildDeptCache(user3.Id)

	// 验证缓存存在
	key1 := fmt.Sprintf("user:dept:%s", user1.Id)
	key2 := fmt.Sprintf("user:dept:%s", user2.Id)
	exists1, _ := redisClient.Exists(ctx, key1).Result()
	exists2, _ := redisClient.Exists(ctx, key2).Result()
	assert.Equal(t, int64(1), exists1)
	assert.Equal(t, int64(1), exists2)

	// 失效 dept1 相关的所有用户缓存
	err := logic.InvalidateDeptCacheByDept(dept1.Id)
	require.NoError(t, err)

	// 验证 dept1 相关用户的缓存已删除（user1, user2）
	exists1, _ = redisClient.Exists(ctx, key1).Result()
	exists2, _ = redisClient.Exists(ctx, key2).Result()
	assert.Equal(t, int64(0), exists1)
	assert.Equal(t, int64(0), exists2)

	// 验证 dept2 用户的缓存仍然存在（user3）
	key3 := fmt.Sprintf("user:dept:%s", user3.Id)
	exists3, _ := redisClient.Exists(ctx, key3).Result()
	assert.Equal(t, int64(1), exists3)
}

// TestOrgCache_GetDeptCache_SuccessfullyRetrievesCache 测试成功获取缓存
func TestOrgCache_GetDeptCache_SuccessfullyRetrievesCache(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建组织和用户
	dept1 := createCacheTestOrg(t, db, "0", "技术部", "TECH", 1)
	user := createCacheTestUser(t, db, "Alice")
	createCacheTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 构建缓存
	_ = logic.BuildDeptCache(user.Id)

	// 获取缓存
	deptIds, err := logic.GetDeptCache(user.Id)
	require.NoError(t, err)
	assert.NotEmpty(t, deptIds)
	assert.Contains(t, deptIds, dept1.Id)
}

// TestOrgCache_GetDeptCache_CacheNotFound_ReturnsEmpty 测试缓存不存在时返回空列表
func TestOrgCache_GetDeptCache_CacheNotFound_ReturnsEmpty(t *testing.T) {
	db := setupCacheTestDB(t)
	s, redisClient := setupCacheTestRedis(t)
	defer s.Close()

	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
		RedisClient:    redisClient,
	}
	ctx := context.Background()

	// 创建用户（没有缓存）
	user := createCacheTestUser(t, db, "Alice")

	logic := NewOrgCacheLogic(ctx, svcCtx)

	// 获取缓存（应该返回空）
	deptIds, err := logic.GetDeptCache(user.Id)
	require.NoError(t, err)
	assert.Empty(t, deptIds)
}
