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

// setupAddAuxDeptTestDB 创建测试数据库
func setupAddAuxDeptTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{}, &userdept.SysUserDept{}, &users.User{})
	require.NoError(t, err)

	return db
}

// createAddAuxDeptTestOrg 创建测试组织
func createAddAuxDeptTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// createAddAuxDeptTestUser 创建测试用户
func createAddAuxDeptTestUser(t *testing.T, db *gorm.DB, name string) *users.User {
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

// createAddAuxDeptTestUserDept 创建测试用户部门关联
func createAddAuxDeptTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) {
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

// TestAddUserAuxDept_DepartmentNotFound_ReturnsError 测试部门不存在
func TestAddUserAuxDept_DepartmentNotFound_ReturnsError(t *testing.T) {
	db := setupAddAuxDeptTestDB(t)
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

	logic := NewAddUserAuxDeptLogic(ctx, svcCtx)

	req := &types.AddUserAuxDeptReq{
		UserId: "test-user-id",
		DeptId: "non-existent-dept",
	}
	_, err := logic.AddUserAuxDept(req)

	assert.Error(t, err)
}

// TestAddUserAuxDept_SuccessfullyAddsAuxiliaryDepartment 测试成功添加辅助部门
func TestAddUserAuxDept_SuccessfullyAddsAuxiliaryDepartment(t *testing.T) {
	db := setupAddAuxDeptTestDB(t)
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

	// 创建部门
	dept1 := createAddAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createAddAuxDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user := createAddAuxDeptTestUser(t, db, "Alice")

	// 设置主部门
	createAddAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewAddUserAuxDeptLogic(ctx, svcCtx)

	// 添加 dept2 为辅助部门
	req := &types.AddUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.AddUserAuxDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证辅助部门已添加
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept2.Id, auxDepts[0].DeptId)
	assert.Equal(t, int8(0), auxDepts[0].IsPrimary)

	// 验证主部门未改变
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
}

// TestAddUserAuxDept_AddDuplicateAuxiliaryDepartment_ReturnsSuccess 测试添加重复的辅助部门（幂等操作）
func TestAddUserAuxDept_AddDuplicateAuxiliaryDepartment_ReturnsSuccess(t *testing.T) {
	db := setupAddAuxDeptTestDB(t)
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

	// 创建部门
	dept1 := createAddAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createAddAuxDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user := createAddAuxDeptTestUser(t, db, "Alice")

	// 设置主部门和辅助部门
	createAddAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)
	createAddAuxDeptTestUserDept(t, db, user.Id, dept2.Id, 0)

	logic := NewAddUserAuxDeptLogic(ctx, svcCtx)

	// 尝试重复添加 dept2（应该成功，幂等操作）
	req := &types.AddUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.AddUserAuxDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证仍然只有一个辅助部门
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept2.Id, auxDepts[0].DeptId)
}

// TestAddUserAuxDept_UserWithNoPrimaryDepartment_CanAddAuxiliary 测试没有主部门的用户可以添加辅助部门
func TestAddUserAuxDept_UserWithNoPrimaryDepartment_CanAddAuxiliary(t *testing.T) {
	db := setupAddAuxDeptTestDB(t)
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

	// 创建部门
	dept1 := createAddAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建用户（无部门）
	user := createAddAuxDeptTestUser(t, db, "Alice")

	logic := NewAddUserAuxDeptLogic(ctx, svcCtx)

	// 添加辅助部门
	req := &types.AddUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept1.Id,
	}
	resp, err := logic.AddUserAuxDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证辅助部门已添加
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept1.Id, auxDepts[0].DeptId)
	assert.Equal(t, int8(0), auxDepts[0].IsPrimary)
}

// TestAddUserAuxDept_AddMultipleAuxiliaryDepartments 测试添加多个辅助部门
func TestAddUserAuxDept_AddMultipleAuxiliaryDepartments(t *testing.T) {
	db := setupAddAuxDeptTestDB(t)
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

	// 创建部门
	dept1 := createAddAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createAddAuxDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)
	dept3 := createAddAuxDeptTestOrg(t, db, "0", "财务部", "FINANCE", 3)

	// 创建用户
	user := createAddAuxDeptTestUser(t, db, "Alice")

	// 设置主部门
	createAddAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewAddUserAuxDeptLogic(ctx, svcCtx)

	// 添加第一个辅助部门
	req1 := &types.AddUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp1, err1 := logic.AddUserAuxDept(req1)
	require.NoError(t, err1)
	assert.True(t, resp1.Success)

	// 添加第二个辅助部门
	req2 := &types.AddUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept3.Id,
	}
	resp2, err2 := logic.AddUserAuxDept(req2)
	require.NoError(t, err2)
	assert.True(t, resp2.Success)

	// 验证有两个辅助部门
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 2)

	// 验证主部门未改变
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
}
