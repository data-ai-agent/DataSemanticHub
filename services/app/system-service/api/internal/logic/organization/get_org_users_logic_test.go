package organization

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/organization"
	"github.com/DataSemanticHub/services/app/system-service/model/system/userdept"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupGetUsersTestDB 创建测试数据库
func setupGetUsersTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{}, &userdept.SysUserDept{}, &users.User{})
	require.NoError(t, err)

	return db
}

// createGetUsersTestOrg 创建测试组织
func createGetUsersTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// createGetUsersTestUser 创建测试用户
func createGetUsersTestUser(t *testing.T, db *gorm.DB, name string) *users.User {
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

// createGetUsersTestUserDept 创建测试用户部门关联
func createGetUsersTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) {
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

// TestGetOrgUsers_DepartmentNotFound_ReturnsError 测试部门不存在
func TestGetOrgUsers_DepartmentNotFound_ReturnsError(t *testing.T) {
	db := setupGetUsersTestDB(t)
	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
	}
	ctx := context.Background()

	logic := NewGetOrgUsersLogic(ctx, svcCtx)

	req := &types.GetOrgUsersReq{
		Id:        "non-existent-id",
		Recursive: false,
	}
	_, err := logic.GetOrgUsers(req)

	assert.Error(t, err)
}

// TestGetOrgUsers_NonRecursive_ReturnsDirectUsers 测试非递归查询部门用户
func TestGetOrgUsers_NonRecursive_ReturnsDirectUsers(t *testing.T) {
	db := setupGetUsersTestDB(t)
	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
	}
	ctx := context.Background()

	// 创建组织结构: root -> dept1, dept2
	root := createGetUsersTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createGetUsersTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	dept2 := createGetUsersTestOrg(t, db, root.Id, "市场部", "MARKET", 2)

	// 创建用户
	user1 := createGetUsersTestUser(t, db, "Alice")
	user2 := createGetUsersTestUser(t, db, "Bob")
	user3 := createGetUsersTestUser(t, db, "Charlie")

	// 设置用户部门: user1, user2 -> dept1; user3 -> dept2
	createGetUsersTestUserDept(t, db, user1.Id, dept1.Id, 1)
	createGetUsersTestUserDept(t, db, user2.Id, dept1.Id, 0)
	createGetUsersTestUserDept(t, db, user3.Id, dept2.Id, 1)

	logic := NewGetOrgUsersLogic(ctx, svcCtx)

	// 查询 dept1 的用户（非递归）
	req := &types.GetOrgUsersReq{
		Id:        dept1.Id,
		Recursive: false,
	}
	resp, err := logic.GetOrgUsers(req)

	require.NoError(t, err)
	assert.Len(t, resp.Users, 2)

	// 验证用户
	userNames := make(map[string]bool)
	for _, u := range resp.Users {
		userNames[u.UserName] = true
	}
	assert.True(t, userNames["Alice"])
	assert.True(t, userNames["Bob"])
	assert.False(t, userNames["Charlie"])
}

// TestGetOrgUsers_Recursive_ReturnsAllSubtreeUsers 测试递归查询所有子部门用户
func TestGetOrgUsers_Recursive_ReturnsAllSubtreeUsers(t *testing.T) {
	db := setupGetUsersTestDB(t)
	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
	}
	ctx := context.Background()

	// 创建组织结构: root -> dept1 -> team1; root -> dept2
	root := createGetUsersTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createGetUsersTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	team1 := createGetUsersTestOrg(t, db, dept1.Id, "后端组", "BACKEND", 1)
	dept2 := createGetUsersTestOrg(t, db, root.Id, "市场部", "MARKET", 2)

	// 创建用户
	user1 := createGetUsersTestUser(t, db, "Alice")
	user2 := createGetUsersTestUser(t, db, "Bob")
	user3 := createGetUsersTestUser(t, db, "Charlie")

	// 设置用户部门: user1 -> dept1, user2 -> team1, user3 -> dept2
	createGetUsersTestUserDept(t, db, user1.Id, dept1.Id, 1)
	createGetUsersTestUserDept(t, db, user2.Id, team1.Id, 1)
	createGetUsersTestUserDept(t, db, user3.Id, dept2.Id, 1)

	logic := NewGetOrgUsersLogic(ctx, svcCtx)

	// 递归查询 dept1 的用户（应包含 dept1 和 team1 的用户）
	req := &types.GetOrgUsersReq{
		Id:        dept1.Id,
		Recursive: true,
	}
	resp, err := logic.GetOrgUsers(req)

	require.NoError(t, err)
	assert.Len(t, resp.Users, 2)

	// 验证用户
	userNames := make(map[string]bool)
	for _, u := range resp.Users {
		userNames[u.UserName] = true
	}
	assert.True(t, userNames["Alice"])
	assert.True(t, userNames["Bob"])
	assert.False(t, userNames["Charlie"])
}

// TestGetOrgUsers_PrimaryAndAuxiliary_MarksIsPrimary 测试区分主部门和辅助部门
func TestGetOrgUsers_PrimaryAndAuxiliary_MarksIsPrimary(t *testing.T) {
	db := setupGetUsersTestDB(t)
	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
	}
	ctx := context.Background()

	// 创建组织
	dept1 := createGetUsersTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createGetUsersTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user1 := createGetUsersTestUser(t, db, "Alice")
	user2 := createGetUsersTestUser(t, db, "Bob")

	// 设置用户部门: user1 -> dept1 (主), dept2 (辅); user2 -> dept1 (辅)
	createGetUsersTestUserDept(t, db, user1.Id, dept1.Id, 1) // 主部门
	createGetUsersTestUserDept(t, db, user1.Id, dept2.Id, 0) // 辅助部门
	createGetUsersTestUserDept(t, db, user2.Id, dept1.Id, 0) // 辅助部门

	logic := NewGetOrgUsersLogic(ctx, svcCtx)

	// 查询 dept1 的用户
	req := &types.GetOrgUsersReq{
		Id:        dept1.Id,
		Recursive: false,
	}
	resp, err := logic.GetOrgUsers(req)

	require.NoError(t, err)
	assert.Len(t, resp.Users, 2)

	// 验证主部门标记
	userPrimaryStatus := make(map[string]bool)
	for _, u := range resp.Users {
		userPrimaryStatus[u.UserName] = u.IsPrimary
	}
	assert.True(t, userPrimaryStatus["Alice"], "Alice 应该是 dept1 的主部门用户")
	assert.False(t, userPrimaryStatus["Bob"], "Bob 应该是 dept1 的辅助部门用户")
}

// TestGetOrgUsers_AuxiliaryDepts_IncludesAuxUsers 测试包含辅助部门用户
func TestGetOrgUsers_AuxiliaryDepts_IncludesAuxUsers(t *testing.T) {
	db := setupGetUsersTestDB(t)
	orgModel := organization.NewModel(db)
	userDeptModel := userdept.NewModel(db)
	userModel := users.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
		UserDeptModel:  userDeptModel,
		UserModel:      userModel,
	}
	ctx := context.Background()

	// 创建组织
	dept1 := createGetUsersTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createGetUsersTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user1 := createGetUsersTestUser(t, db, "Alice")

	// 设置用户部门: user1 -> dept2 (主), dept1 (辅)
	createGetUsersTestUserDept(t, db, user1.Id, dept2.Id, 1) // 主部门
	createGetUsersTestUserDept(t, db, user1.Id, dept1.Id, 0) // 辅助部门

	logic := NewGetOrgUsersLogic(ctx, svcCtx)

	// 查询 dept1 的用户（应该包含辅助部门用户 Alice）
	req := &types.GetOrgUsersReq{
		Id:        dept1.Id,
		Recursive: false,
	}
	resp, err := logic.GetOrgUsers(req)

	require.NoError(t, err)
	assert.Len(t, resp.Users, 1)
	assert.Equal(t, "Alice", resp.Users[0].UserName)
	assert.False(t, resp.Users[0].IsPrimary, "Alice 对于 dept1 是辅助部门用户")
}
