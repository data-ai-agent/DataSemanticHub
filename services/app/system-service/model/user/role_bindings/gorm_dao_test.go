package rolebindings

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB 创建测试数据库
func setupTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	require.NoError(t, err)

	// 自动迁移表结构
	err = db.AutoMigrate(&RoleBinding{})
	require.NoError(t, err)

	return db
}

// TestFindByUserId_ValidUserId_ReturnsRoleBindings 测试根据用户ID查询角色绑定
func TestFindByUserId_ValidUserId_ReturnsRoleBindings(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	orgId1 := "org-001"
	orgId2 := "org-002"
	position1 := "Manager"
	permissionRole1 := "admin"

	roleBinding1 := &RoleBinding{
		UserId:         userID.String(),
		OrgId:          orgId1,
		Position:       &position1,
		PermissionRole: &permissionRole1,
	}
	roleBinding2 := &RoleBinding{
		UserId: userID.String(),
		OrgId:  orgId2,
	}

	// 插入测试数据
	_, err := model.Insert(ctx, roleBinding1)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding2)
	require.NoError(t, err)

	// 查询角色绑定
	result, err := model.FindByUserId(ctx, userID.String())

	// 验证结果
	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, userID.String(), result[0].UserId)
	assert.Equal(t, orgId1, result[0].OrgId)
	assert.NotNil(t, result[0].Position)
	assert.Equal(t, position1, *result[0].Position)
}

// TestFindByUserId_NoRoleBindings_ReturnsEmptyList 测试用户没有角色绑定时返回空列表
func TestFindByUserId_NoRoleBindings_ReturnsEmptyList(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 查询不存在的用户ID
	userID, _ := uuid.NewV7()
	result, err := model.FindByUserId(ctx, userID.String())

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result, 0)
}

// TestFindByUserId_MultipleUsers_ReturnsOnlyTargetUser 测试多个用户时只返回目标用户的角色绑定
func TestFindByUserId_MultipleUsers_ReturnsOnlyTargetUser(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据
	userID1, _ := uuid.NewV7()
	userID2, _ := uuid.NewV7()
	orgId := "org-001"

	roleBinding1 := &RoleBinding{
		UserId: userID1.String(),
		OrgId:  orgId,
	}
	roleBinding2 := &RoleBinding{
		UserId: userID2.String(),
		OrgId:  orgId,
	}

	// 插入测试数据
	_, err := model.Insert(ctx, roleBinding1)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding2)
	require.NoError(t, err)

	// 查询 userID1 的角色绑定
	result, err := model.FindByUserId(ctx, userID1.String())

	// 验证结果
	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, userID1.String(), result[0].UserId)
}

// TestInsert_ValidInput_ReturnsRoleBinding 测试正常插入角色绑定
func TestInsert_ValidInput_ReturnsRoleBinding(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	orgId := "org-001"
	position := "Manager"
	permissionRole := "admin"

	roleBinding := &RoleBinding{
		UserId:         userID.String(),
		OrgId:          orgId,
		Position:       &position,
		PermissionRole: &permissionRole,
	}

	// 执行插入
	result, err := model.Insert(ctx, roleBinding)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Greater(t, result.Id, int64(0))
	assert.Equal(t, userID.String(), result.UserId)
	assert.Equal(t, orgId, result.OrgId)
	assert.NotNil(t, result.Position)
	assert.Equal(t, position, *result.Position)
	assert.NotNil(t, result.PermissionRole)
	assert.Equal(t, permissionRole, *result.PermissionRole)
	assert.False(t, result.CreatedAt.IsZero())
	assert.False(t, result.UpdatedAt.IsZero())
}

// TestInsert_OptionalFields_ReturnsRoleBinding 测试可选字段为空的情况
func TestInsert_OptionalFields_ReturnsRoleBinding(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据 - 不包含可选字段
	userID, _ := uuid.NewV7()
	orgId := "org-001"

	roleBinding := &RoleBinding{
		UserId: userID.String(),
		OrgId:  orgId,
		// Position 和 PermissionRole 为 nil
	}

	// 执行插入
	result, err := model.Insert(ctx, roleBinding)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Greater(t, result.Id, int64(0))
	assert.Equal(t, userID.String(), result.UserId)
	assert.Equal(t, orgId, result.OrgId)
	assert.Nil(t, result.Position)
	assert.Nil(t, result.PermissionRole)
}

// TestDeleteByUserId_ValidUserId_DeletesAllRoleBindings 测试根据用户ID删除所有角色绑定
func TestDeleteByUserId_ValidUserId_DeletesAllRoleBindings(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据 - 一个用户有多个角色绑定
	userID, _ := uuid.NewV7()
	orgId1 := "org-001"
	orgId2 := "org-002"
	orgId3 := "org-003"
	position1 := "Manager"
	permissionRole1 := "admin"

	roleBinding1 := &RoleBinding{
		UserId:         userID.String(),
		OrgId:          orgId1,
		Position:       &position1,
		PermissionRole: &permissionRole1,
	}
	roleBinding2 := &RoleBinding{
		UserId: userID.String(),
		OrgId:  orgId2,
	}
	roleBinding3 := &RoleBinding{
		UserId: userID.String(),
		OrgId:  orgId3,
	}

	// 插入测试数据
	_, err := model.Insert(ctx, roleBinding1)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding2)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding3)
	require.NoError(t, err)

	// 验证插入成功
	beforeDelete, err := model.FindByUserId(ctx, userID.String())
	require.NoError(t, err)
	assert.Len(t, beforeDelete, 3)

	// 执行删除
	err = model.DeleteByUserId(ctx, userID.String())

	// 验证删除成功
	require.NoError(t, err)

	// 验证所有角色绑定已被删除
	afterDelete, err := model.FindByUserId(ctx, userID.String())
	require.NoError(t, err)
	assert.Len(t, afterDelete, 0)
}

// TestDeleteByUserId_NoRoleBindings_ReturnsNoError 测试删除不存在角色绑定的用户ID
func TestDeleteByUserId_NoRoleBindings_ReturnsNoError(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 使用不存在的用户ID
	userID, _ := uuid.NewV7()

	// 执行删除（应该成功，不会报错）
	err := model.DeleteByUserId(ctx, userID.String())

	// 验证删除操作成功（GORM 的 Delete 不会因为记录不存在而报错）
	require.NoError(t, err)
}

// TestDeleteByUserId_MultipleUsers_OnlyDeletesTargetUser 测试删除时只删除目标用户的角色绑定
func TestDeleteByUserId_MultipleUsers_OnlyDeletesTargetUser(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据 - 两个用户，每个用户有多个角色绑定
	userID1, _ := uuid.NewV7()
	userID2, _ := uuid.NewV7()
	orgId := "org-001"

	// 用户1的角色绑定
	roleBinding1 := &RoleBinding{
		UserId: userID1.String(),
		OrgId:  orgId,
	}
	roleBinding2 := &RoleBinding{
		UserId: userID1.String(),
		OrgId:  "org-002",
	}

	// 用户2的角色绑定
	roleBinding3 := &RoleBinding{
		UserId: userID2.String(),
		OrgId:  orgId,
	}
	roleBinding4 := &RoleBinding{
		UserId: userID2.String(),
		OrgId:  "org-003",
	}

	// 插入测试数据
	_, err := model.Insert(ctx, roleBinding1)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding2)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding3)
	require.NoError(t, err)
	_, err = model.Insert(ctx, roleBinding4)
	require.NoError(t, err)

	// 验证插入成功
	user1Before, err := model.FindByUserId(ctx, userID1.String())
	require.NoError(t, err)
	assert.Len(t, user1Before, 2)

	user2Before, err := model.FindByUserId(ctx, userID2.String())
	require.NoError(t, err)
	assert.Len(t, user2Before, 2)

	// 删除用户1的所有角色绑定
	err = model.DeleteByUserId(ctx, userID1.String())
	require.NoError(t, err)

	// 验证用户1的角色绑定已被删除
	user1After, err := model.FindByUserId(ctx, userID1.String())
	require.NoError(t, err)
	assert.Len(t, user1After, 0)

	// 验证用户2的角色绑定未被影响
	user2After, err := model.FindByUserId(ctx, userID2.String())
	require.NoError(t, err)
	assert.Len(t, user2After, 2)
	assert.Equal(t, userID2.String(), user2After[0].UserId)
	assert.Equal(t, userID2.String(), user2After[1].UserId)
}
