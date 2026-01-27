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

// setupSetPrimaryDeptTestDB 创建测试数据库
func setupSetPrimaryDeptTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{}, &userdept.SysUserDept{}, &users.User{})
	require.NoError(t, err)

	return db
}

// createSetPrimaryDeptTestOrg 创建测试组织
func createSetPrimaryDeptTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// createSetPrimaryDeptTestUser 创建测试用户
func createSetPrimaryDeptTestUser(t *testing.T, db *gorm.DB, name string) *users.User {
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

// createSetPrimaryDeptTestUserDept 创建测试用户部门关联
func createSetPrimaryDeptTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) {
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

// TestSetUserPrimaryDept_DepartmentNotFound_ReturnsError 测试部门不存在
func TestSetUserPrimaryDept_DepartmentNotFound_ReturnsError(t *testing.T) {
	db := setupSetPrimaryDeptTestDB(t)
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

	logic := NewSetUserPrimaryDeptLogic(ctx, svcCtx)

	req := &types.SetUserPrimaryDeptReq{
		UserId: "test-user-id",
		DeptId: "non-existent-dept",
	}
	_, err := logic.SetUserPrimaryDept(req)

	assert.Error(t, err)
}

// TestSetUserPrimaryDept_SuccessfullySetsPrimaryDepartment 测试成功设置主部门
func TestSetUserPrimaryDept_SuccessfullySetsPrimaryDepartment(t *testing.T) {
	db := setupSetPrimaryDeptTestDB(t)
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
	dept1 := createSetPrimaryDeptTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建用户
	user := createSetPrimaryDeptTestUser(t, db, "Alice")

	logic := NewSetUserPrimaryDeptLogic(ctx, svcCtx)

	// 设置 dept1 为主部门
	req := &types.SetUserPrimaryDeptReq{
		UserId: user.Id,
		DeptId: dept1.Id,
	}
	resp, err := logic.SetUserPrimaryDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证主部门已设置
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)
	assert.Equal(t, int8(1), primaryDept.IsPrimary)
}

// TestSetUserPrimaryDept_ReplacesOldPrimaryDepartment 测试替换旧的主部门
func TestSetUserPrimaryDept_ReplacesOldPrimaryDepartment(t *testing.T) {
	db := setupSetPrimaryDeptTestDB(t)
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
	dept1 := createSetPrimaryDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createSetPrimaryDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user := createSetPrimaryDeptTestUser(t, db, "Alice")

	// 设置初始主部门
	createSetPrimaryDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewSetUserPrimaryDeptLogic(ctx, svcCtx)

	// 将主部门改为 dept2
	req := &types.SetUserPrimaryDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.SetUserPrimaryDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证新主部门
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept2.Id, primaryDept.DeptId)
	assert.Equal(t, int8(1), primaryDept.IsPrimary)

	// 验证旧主部门已转换为辅助部门
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept1.Id, auxDepts[0].DeptId)
	assert.Equal(t, int8(0), auxDepts[0].IsPrimary)
}

// TestSetUserPrimaryDept_ConvertsOldAuxiliaryToPrimary 测试将辅助部门设置为主部门
func TestSetUserPrimaryDept_ConvertsOldAuxiliaryToPrimary(t *testing.T) {
	db := setupSetPrimaryDeptTestDB(t)
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
	dept1 := createSetPrimaryDeptTestOrg(t, db, "0", "技术部", "TECH", 1)
	dept2 := createSetPrimaryDeptTestOrg(t, db, "0", "市场部", "MARKET", 2)

	// 创建用户
	user := createSetPrimaryDeptTestUser(t, db, "Alice")

	// 设置主部门和辅助部门
	createSetPrimaryDeptTestUserDept(t, db, user.Id, dept1.Id, 1)
	createSetPrimaryDeptTestUserDept(t, db, user.Id, dept2.Id, 0)

	logic := NewSetUserPrimaryDeptLogic(ctx, svcCtx)

	// 将辅助部门 dept2 设置为主部门
	req := &types.SetUserPrimaryDeptReq{
		UserId: user.Id,
		DeptId: dept2.Id,
	}
	resp, err := logic.SetUserPrimaryDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证 dept2 现在是主部门
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept2.Id, primaryDept.DeptId)

	// 验证 dept1 已转换为辅助部门
	auxDepts, err := userDeptModel.FindAuxByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, dept1.Id, auxDepts[0].DeptId)
}

// TestSetUserPrimaryDept_SameDepartmentAsPrimary_NoError 测试设置当前主部门为主部门（无操作）
func TestSetUserPrimaryDept_SameDepartmentAsPrimary_NoError(t *testing.T) {
	db := setupSetPrimaryDeptTestDB(t)
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
	dept1 := createSetPrimaryDeptTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建用户
	user := createSetPrimaryDeptTestUser(t, db, "Alice")

	// 设置主部门
	createSetPrimaryDeptTestUserDept(t, db, user.Id, dept1.Id, 1)

	logic := NewSetUserPrimaryDeptLogic(ctx, svcCtx)

	// 重复设置相同的主部门
	req := &types.SetUserPrimaryDeptReq{
		UserId: user.Id,
		DeptId: dept1.Id,
	}
	resp, err := logic.SetUserPrimaryDept(req)

	require.NoError(t, err)
	assert.True(t, resp.Success)

	// 验证仍然只有一个主部门
	primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, user.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, primaryDept.DeptId)

	auxDepts, _ := userDeptModel.FindAuxByUserId(ctx, user.Id)
	assert.Len(t, auxDepts, 0)
}
