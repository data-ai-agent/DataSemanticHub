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

// setupRemoveAuxDeptTestDB 创建测试数据库
func setupRemoveAuxDeptTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{}, &userdept.SysUserDept{}, &users.User{})
	require.NoError(t, err)

	return db
}

// createRemoveAuxDeptTestOrg 创建测试组织
func createRemoveAuxDeptTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// createRemoveAuxDeptTestUser 创建测试用户
func createRemoveAuxDeptTestUser(t *testing.T, db *gorm.DB, name string) *users.User {
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

// createRemoveAuxDeptTestUserDept 创建测试用户部门关联
func createRemoveAuxDeptTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) {
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

// TestRemoveUserAuxDept_DepartmentNotFound_ReturnsError 测试部门不存在
func TestRemoveUserAuxDept_DepartmentNotFound_ReturnsError(t *testing.T) {
	db := setupRemoveAuxDeptTestDB(t)
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

	logic := NewRemoveUserAuxDeptLogic(ctx, svcCtx)

	req := &types.RemoveUserAuxDeptReq{
		UserId: "test-user-id",
		DeptId: "non-existent-dept",
	}
	_, err := logic.RemoveUserAuxDept(req)

	assert.Error(t, err)
}

// TestRemoveUserAuxDept_SuccessfullyRemovesAuxiliaryDepartment 测试成功删除辅助部门
func TestRemoveUserAuxDept_SuccessfullyRemovesAuxiliaryDepartment(t *testing.T) {
	db := setupRemoveAuxDeptTestDB(t)
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
	dept1 := createRemoveAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createRemoveAuxDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user := createRemoveAuxDeptTestUser(t, db, "Alice")

	// 设置主部门和辅助部门
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept2.Id, 0)

	logic := NewRemoveUserAuxDeptLogic(ctx, svcCtx)

	// 删除辅助部门 dept2
	req := &types.RemoveUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.RemoveUserAuxDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证辅助部门已删除
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 0)

	// 验证主部门未改变
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
}

// TestRemoveUserAuxDept_RemoveNonExistentRelation_ReturnsError 测试删除不存在的关联
func TestRemoveUserAuxDept_RemoveNonExistentRelation_ReturnsError(t *testing.T) {
	db := setupRemoveAuxDeptTestDB(t)
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
	dept1 := createRemoveAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建用户
	user := createRemoveAuxDeptTestUser(t, db, "Alice")

	// 只设置主部门，不设置辅助部门
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewRemoveUserAuxDeptLogic(ctx, svcCtx)

	// 尝试删除不存在的辅助部门
	req := &types.RemoveUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept1.Id,
	}
	_, err := logic.RemoveUserAuxDept(req)

	assert.Error(t, err)
}

// TestRemoveUserAuxDept_RemovePrimaryDepartmentAsAuxiliary_ReturnsError 测试删除主部门（应该失败）
func TestRemoveUserAuxDept_RemovePrimaryDepartmentAsAuxiliary_ReturnsError(t *testing.T) {
	db := setupRemoveAuxDeptTestDB(t)
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
	dept1 := createRemoveAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建用户
	user := createRemoveAuxDeptTestUser(t, db, "Alice")

	// 只设置主部门
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewRemoveUserAuxDeptLogic(ctx, svcCtx)

	// 尝试删除主部门（应该失败，因为主部门不能作为辅助部门删除）
	req := &types.RemoveUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept1.Id,
	}
	_, err := logic.RemoveUserAuxDept(req)

	assert.Error(t, err)

	// 验证主部门仍然存在
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
}

// TestRemoveUserAuxDept_RemoveOneOfMultipleAuxiliaryDepartments 测试删除多个辅助部门中的一个
func TestRemoveUserAuxDept_RemoveOneOfMultipleAuxiliaryDepartments(t *testing.T) {
	db := setupRemoveAuxDeptTestDB(t)
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
	dept1 := createRemoveAuxDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createRemoveAuxDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)
	dept3 := createRemoveAuxDeptTestOrg(t, db, "0", "财务部", "FINANCE", 3)

	// 创建用户
	user := createRemoveAuxDeptTestUser(t, db, "Alice")

	// 设置主部门和多个辅助部门
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept1.Id, 1)
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept2.Id, 0)
	createRemoveAuxDeptTestUserDept(t, db, user.Id, dept3.Id, 0)

	logic := NewRemoveUserAuxDeptLogic(ctx, svcCtx)

	// 删除辅助部门 dept2
	req := &types.RemoveUserAuxDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.RemoveUserAuxDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证还有一个辅助部门 dept3
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept3.Id, auxDepts[0].DeptId)

	// 验证主部门未改变
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
}
