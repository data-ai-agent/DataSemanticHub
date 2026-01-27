package userdept

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupUserDeptTestDB 创建测试数据库
func setupUserDeptTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&SysUserDept{})
	require.NoError(t, err)

	return db
}

// createTestUserDept 创建测试用户部门关联
func createTestUserDept(t *testing.T, db *gorm.DB, userId, deptId string, isPrimary int8) *SysUserDept {
	id, _ := uuid.NewV7()
	userDept := &SysUserDept{
		Id:        id.String(),
		UserId:    userId,
		DeptId:    deptId,
		IsPrimary: isPrimary,
	}

	err := db.Create(userDept).Error
	require.NoError(t, err)
	return userDept
}

// TestInsert_ValidInput_ReturnsUserDept 测试插入用户部门关联
func TestInsert_ValidInput_ReturnsUserDept(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	id, _ := uuid.NewV7()
	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	data := &SysUserDept{
		Id:        id.String(),
		UserId:    userId.String(),
		DeptId:    deptId.String(),
		IsPrimary: 1,
	}

	result, err := model.Insert(ctx, data)

	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, id.String(), result.Id)
	assert.Equal(t, userId.String(), result.UserId)
	assert.Equal(t, deptId.String(), result.DeptId)
	assert.Equal(t, int8(1), result.IsPrimary)
}

// TestFindOne_Exists_ReturnsUserDept 测试查找存在的用户部门关联
func TestFindOne_Exists_ReturnsUserDept(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()
	created := createTestUserDept(t, db, userId.String(), deptId.String(), 1)

	found, err := model.FindOne(ctx, created.Id)

	require.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, created.Id, found.Id)
	assert.Equal(t, userId.String(), found.UserId)
	assert.Equal(t, deptId.String(), found.DeptId)
}

// TestFindOne_NotFound_ReturnsError 测试查找不存在的用户部门关联
func TestFindOne_NotFound_ReturnsError(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	nonExistentID, _ := uuid.NewV7()
	_, err := model.FindOne(ctx, nonExistentID.String())

	assert.Error(t, err)
}

// TestSetPrimaryDept_NormalFlow_ReturnsSuccess 测试设置主部门
func TestSetPrimaryDept_NormalFlow_ReturnsSuccess(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	err := model.SetPrimaryDept(ctx, userId.String(), deptId.String())

	require.NoError(t, err)

	// 验证主部门已设置
	primary, err := model.FindPrimaryByUserId(ctx, userId.String())
	require.NoError(t, err)
	assert.NotNil(t, primary)
	assert.Equal(t, deptId.String(), primary.DeptId)
	assert.Equal(t, int8(1), primary.IsPrimary)
}

// TestSetPrimaryDept_ReplacesOldPrimary_ReturnsSuccess 测试替换旧主部门
func TestSetPrimaryDept_ReplacesOldPrimary_ReturnsSuccess(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	oldDeptId, _ := uuid.NewV7()
	newDeptId, _ := uuid.NewV7()

	// 设置初始主部门
	_ = createTestUserDept(t, db, userId.String(), oldDeptId.String(), 1)

	// 设置新主部门
	err := model.SetPrimaryDept(ctx, userId.String(), newDeptId.String())

	require.NoError(t, err)

	// 验证旧主部门已变为辅助部门
	oldDept, err := model.FindOne(ctx, userId.String())
	if err == nil {
		// 如果找到记录，应该是辅助部门
		assert.Equal(t, int8(0), oldDept.IsPrimary)
	}

	// 验证新主部门已设置
	newPrimary, err := model.FindPrimaryByUserId(ctx, userId.String())
	require.NoError(t, err)
	assert.Equal(t, newDeptId.String(), newPrimary.DeptId)
	assert.Equal(t, int8(1), newPrimary.IsPrimary)
}

// TestAddAuxDept_NormalFlow_ReturnsSuccess 测试添加辅助部门
func TestAddAuxDept_NormalFlow_ReturnsSuccess(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	primaryDeptId, _ := uuid.NewV7()
	auxDeptId, _ := uuid.NewV7()

	// 先设置主部门
	_ = createTestUserDept(t, db, userId.String(), primaryDeptId.String(), 1)

	// 添加辅助部门
	err := model.AddAuxDept(ctx, userId.String(), auxDeptId.String())

	require.NoError(t, err)

	// 验证辅助部门已添加
	auxDepts, err := model.FindAuxByUserId(ctx, userId.String())
	require.NoError(t, err)
	assert.Len(t, auxDepts, 1)
	assert.Equal(t, auxDeptId.String(), auxDepts[0].DeptId)
}

// TestAddAuxDept_Duplicate_ReturnsError 测试添加重复的辅助部门
func TestAddAuxDept_Duplicate_ReturnsError(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	// 先添加主部门
	_ = createTestUserDept(t, db, userId.String(), deptId.String(), 1)

	// 尝试再次添加相同部门（应该失败）
	err := model.AddAuxDept(ctx, userId.String(), deptId.String())

	assert.Error(t, err)
}

// TestRemoveAuxDept_NormalFlow_ReturnsSuccess 测试移除辅助部门
func TestRemoveAuxDept_NormalFlow_ReturnsSuccess(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	// 添加辅助部门
	_ = createTestUserDept(t, db, userId.String(), deptId.String(), 0)

	// 移除辅助部门
	err := model.RemoveAuxDept(ctx, userId.String(), deptId.String())

	require.NoError(t, err)

	// 验证已移除
	auxDepts, err := model.FindAuxByUserId(ctx, userId.String())
	require.NoError(t, err)
	assert.Len(t, auxDepts, 0)
}

// TestRemoveAuxDept_NotPrimary_ReturnsError 测试不能移除主部门
func TestRemoveAuxDept_NotPrimary_ReturnsError(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	// 添加主部门
	_ = createTestUserDept(t, db, userId.String(), deptId.String(), 1)

	// 尝试移除主部门（应该失败）
	err := model.RemoveAuxDept(ctx, userId.String(), deptId.String())

	assert.Error(t, err)
}

// TestFindByUserId_ReturnsAllDepts 测试查找用户所有部门
func TestFindByUserId_ReturnsAllDepts(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId1, _ := uuid.NewV7()
	deptId2, _ := uuid.NewV7()
	deptId3, _ := uuid.NewV7()

	// 创建多个部门关联
	_ = createTestUserDept(t, db, userId.String(), deptId1.String(), 1)
	_ = createTestUserDept(t, db, userId.String(), deptId2.String(), 0)
	_ = createTestUserDept(t, db, userId.String(), deptId3.String(), 0)

	// 查找所有部门
	depts, err := model.FindByUserId(ctx, userId.String())

	require.NoError(t, err)
	assert.Len(t, depts, 3)
}

// TestFindPrimaryByUserId_ReturnsPrimary 测试查找用户主部门
func TestFindPrimaryByUserId_ReturnsPrimary(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	primaryDeptId, _ := uuid.NewV7()
	auxDeptId, _ := uuid.NewV7()

	// 创建主部门和辅助部门
	_ = createTestUserDept(t, db, userId.String(), primaryDeptId.String(), 1)
	_ = createTestUserDept(t, db, userId.String(), auxDeptId.String(), 0)

	// 查找主部门
	primary, err := model.FindPrimaryByUserId(ctx, userId.String())

	require.NoError(t, err)
	assert.NotNil(t, primary)
	assert.Equal(t, primaryDeptId.String(), primary.DeptId)
	assert.Equal(t, int8(1), primary.IsPrimary)
}

// TestFindAuxByUserId_ReturnsAuxDepts 测试查找用户辅助部门
func TestFindAuxByUserId_ReturnsAuxDepts(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	primaryDeptId, _ := uuid.NewV7()
	auxDeptId1, _ := uuid.NewV7()
	auxDeptId2, _ := uuid.NewV7()

	// 创建主部门和辅助部门
	_ = createTestUserDept(t, db, userId.String(), primaryDeptId.String(), 1)
	_ = createTestUserDept(t, db, userId.String(), auxDeptId1.String(), 0)
	_ = createTestUserDept(t, db, userId.String(), auxDeptId2.String(), 0)

	// 查找辅助部门
	auxDepts, err := model.FindAuxByUserId(ctx, userId.String())

	require.NoError(t, err)
	assert.Len(t, auxDepts, 2)

	// 验证都是辅助部门
	for _, dept := range auxDepts {
		assert.Equal(t, int8(0), dept.IsPrimary)
	}
}

// TestFindUsersByDeptId_ReturnsUsers 测试查找部门用户
func TestFindUsersByDeptId_ReturnsUsers(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	deptId, _ := uuid.NewV7()
	userId1, _ := uuid.NewV7()
	userId2, _ := uuid.NewV7()

	// 创建用户部门关联
	_ = createTestUserDept(t, db, userId1.String(), deptId.String(), 1)
	_ = createTestUserDept(t, db, userId2.String(), deptId.String(), 0)

	// 查找部门所有用户
	users, err := model.FindUsersByDeptId(ctx, deptId.String(), nil)

	require.NoError(t, err)
	assert.Len(t, users, 2)
}

// TestFindUsersByDeptId_WithPrimaryFilter_ReturnsPrimaryUsers 测试查找部门主用户
func TestFindUsersByDeptId_WithPrimaryFilter_ReturnsPrimaryUsers(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	deptId, _ := uuid.NewV7()
	userId1, _ := uuid.NewV7()
	userId2, _ := uuid.NewV7()

	// 创建用户部门关联
	_ = createTestUserDept(t, db, userId1.String(), deptId.String(), 1)
	_ = createTestUserDept(t, db, userId2.String(), deptId.String(), 0)

	// 查找部门主用户
	primary := int8(1)
	users, err := model.FindUsersByDeptId(ctx, deptId.String(), &primary)

	require.NoError(t, err)
	assert.Len(t, users, 1)
	assert.Equal(t, userId1.String(), users[0].UserId)
}

// TestCountByDeptId_ReturnsCount 测试统计部门用户数
func TestCountByDeptId_ReturnsCount(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	deptId, _ := uuid.NewV7()
	userId1, _ := uuid.NewV7()
	userId2, _ := uuid.NewV7()
	userId3, _ := uuid.NewV7()

	// 创建用户部门关联
	_ = createTestUserDept(t, db, userId1.String(), deptId.String(), 1)
	_ = createTestUserDept(t, db, userId2.String(), deptId.String(), 0)
	_ = createTestUserDept(t, db, userId3.String(), deptId.String(), 0)

	// 统计部门用户数
	count, err := model.CountByDeptId(ctx, deptId.String(), 0)

	require.NoError(t, err)
	assert.Equal(t, int64(3), count)
}

// TestCountByDeptId_WithPrimaryFilter_ReturnsPrimaryCount 测试统计部门主用户数
func TestCountByDeptId_WithPrimaryFilter_ReturnsPrimaryCount(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	deptId, _ := uuid.NewV7()
	userId1, _ := uuid.NewV7()
	userId2, _ := uuid.NewV7()
	userId3, _ := uuid.NewV7()

	// 创建用户部门关联
	_ = createTestUserDept(t, db, userId1.String(), deptId.String(), 1)
	_ = createTestUserDept(t, db, userId2.String(), deptId.String(), 0)
	_ = createTestUserDept(t, db, userId3.String(), deptId.String(), 0)

	// 统计部门主用户数
	count, err := model.CountByDeptId(ctx, deptId.String(), 1)

	require.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

// TestDelete_HardDelete_ReturnsSuccess 测试删除
func TestDelete_HardDelete_ReturnsSuccess(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()
	created := createTestUserDept(t, db, userId.String(), deptId.String(), 1)

	// 删除
	err := model.Delete(ctx, created.Id)

	require.NoError(t, err)

	// 验证已删除（无法通过 FindOne 找到）
	_, err = model.FindOne(ctx, created.Id)
	assert.Error(t, err)
}

// TestTrans_WithCommit_CommitsTransaction 测试事务提交
func TestTrans_WithCommit_CommitsTransaction(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	// 执行事务
	err := model.Trans(ctx, func(ctx context.Context, m Model) error {
		data := &SysUserDept{
			UserId:    userId.String(),
			DeptId:    deptId.String(),
			IsPrimary: 1,
		}
		_, err := m.Insert(ctx, data)
		return err
	})

	require.NoError(t, err)

	// 验证数据已提交
	primary, err := model.FindPrimaryByUserId(ctx, userId.String())
	require.NoError(t, err)
	assert.NotNil(t, primary)
}

// TestTrans_WithRollback_RollsbackTransaction 测试事务回滚
func TestTrans_WithRollback_RollsbackTransaction(t *testing.T) {
	db := setupUserDeptTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	userId, _ := uuid.NewV7()
	deptId, _ := uuid.NewV7()

	// 先创建一条记录（确保表中有数据）
	_ = createTestUserDept(t, db, userId.String(), deptId.String(), 1)

	// 在事务中插入节点，但故意返回错误触发回滚
	newUserId, _ := uuid.NewV7()
	newDeptId, _ := uuid.NewV7()
	err := model.Trans(ctx, func(ctx context.Context, m Model) error {
		id, _ := uuid.NewV7()
		data := &SysUserDept{
			Id:        id.String(),
			UserId:    newUserId.String(),
			DeptId:    newDeptId.String(),
			IsPrimary: 1,
		}
		_, err := m.Insert(ctx, data)
		if err != nil {
			return err
		}

		// 故意返回错误触发回滚
		return errors.New("intentional error for rollback")
	})

	// 验证事务应失败
	assert.Error(t, err)

	// 验证数据已回滚（只有1条记录）
	var count int64
	db.Model(&SysUserDept{}).Count(&count)
	assert.Equal(t, int64(1), count, "事务应已回滚，只有1条记录")
}
