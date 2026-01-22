package auditlogs

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB 创建测试数据库
func setupTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	require.NoError(t, err)

	// 自动迁移表结构
	err = db.AutoMigrate(&AuditLog{})
	require.NoError(t, err)

	return db
}

// TestFindByUserId_ValidUserId_ReturnsAuditLogs 测试根据用户ID查询审计日志
func TestFindByUserId_ValidUserId_ReturnsAuditLogs(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	changes := map[string]interface{}{
		"status": map[string]interface{}{
			"old": 1,
			"new": 2,
		},
	}
	changesJSON, _ := json.Marshal(changes)

	auditLog1 := &AuditLog{
		UserId:     userID.String(),
		Action:     "update",
		Operator:   "Admin User",
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}
	auditLog2 := &AuditLog{
		UserId:     userID.String(),
		Action:     "create",
		Operator:   "Admin User",
		OperatorId: operatorID.String(),
		Timestamp:  time.Now().Add(-1 * time.Hour),
	}

	// 插入测试数据
	_, err := model.Insert(ctx, auditLog1)
	require.NoError(t, err)
	_, err = model.Insert(ctx, auditLog2)
	require.NoError(t, err)

	// 查询审计日志
	result, total, err := model.FindByUserId(ctx, userID.String(), 1, 10)

	// 验证结果
	require.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, result, 2)
	assert.Equal(t, userID.String(), result[0].UserId)
	assert.Equal(t, "update", result[0].Action) // 应该按时间倒序，最新的在前
}

// TestFindByUserId_NoAuditLogs_ReturnsEmptyList 测试用户没有审计日志时返回空列表
func TestFindByUserId_NoAuditLogs_ReturnsEmptyList(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 查询不存在的用户ID
	userID, _ := uuid.NewV7()
	result, total, err := model.FindByUserId(ctx, userID.String(), 1, 10)

	// 验证结果
	require.NoError(t, err)
	assert.Equal(t, int64(0), total)
	assert.NotNil(t, result)
	assert.Len(t, result, 0)
}

// TestFindByUserId_Pagination_ReturnsCorrectPage 测试分页功能
func TestFindByUserId_Pagination_ReturnsCorrectPage(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据 - 插入多条审计日志
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	now := time.Now()

	for i := 0; i < 5; i++ {
		auditLog := &AuditLog{
			UserId:     userID.String(),
			Action:     "update",
			Operator:   "Admin User",
			OperatorId: operatorID.String(),
			Timestamp:  now.Add(time.Duration(i) * time.Minute),
		}
		_, err := model.Insert(ctx, auditLog)
		require.NoError(t, err)
	}

	// 查询第一页
	result1, total1, err := model.FindByUserId(ctx, userID.String(), 1, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(5), total1)
	assert.Len(t, result1, 2)

	// 查询第二页
	result2, total2, err := model.FindByUserId(ctx, userID.String(), 2, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(5), total2)
	assert.Len(t, result2, 2)

	// 验证两页结果不重复
	assert.NotEqual(t, result1[0].Id, result2[0].Id)
}

// TestInsert_ValidInput_ReturnsAuditLog 测试正常插入审计日志
func TestInsert_ValidInput_ReturnsAuditLog(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()
	changes := map[string]interface{}{
		"status": map[string]interface{}{
			"old": 0,
			"new": 1,
		},
	}
	changesJSON, _ := json.Marshal(changes)

	auditLog := &AuditLog{
		UserId:     userID.String(),
		Action:     "create",
		Operator:   "Admin User",
		OperatorId: operatorID.String(),
		Changes:    datatypes.JSON(changesJSON),
		Timestamp:  time.Now(),
	}

	// 执行插入
	result, err := model.Insert(ctx, auditLog)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Greater(t, result.Id, int64(0))
	assert.Equal(t, userID.String(), result.UserId)
	assert.Equal(t, "create", result.Action)
	assert.Equal(t, "Admin User", result.Operator)
	assert.Equal(t, operatorID.String(), result.OperatorId)
	assert.NotNil(t, result.Changes)
	assert.False(t, result.Timestamp.IsZero())
}

// TestInsert_OptionalChanges_ReturnsAuditLog 测试可选字段为空的情况
func TestInsert_OptionalChanges_ReturnsAuditLog(t *testing.T) {
	db := setupTestDB(t)
	model := NewModel(db)
	ctx := context.Background()

	// 准备测试数据 - 不包含 Changes 字段
	userID, _ := uuid.NewV7()
	operatorID, _ := uuid.NewV7()

	auditLog := &AuditLog{
		UserId:     userID.String(),
		Action:     "update",
		Operator:   "Admin User",
		OperatorId: operatorID.String(),
		Timestamp:  time.Now(),
		// Changes 为 nil
	}

	// 执行插入
	result, err := model.Insert(ctx, auditLog)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Greater(t, result.Id, int64(0))
	assert.Equal(t, userID.String(), result.UserId)
	assert.Equal(t, "update", result.Action)
}
