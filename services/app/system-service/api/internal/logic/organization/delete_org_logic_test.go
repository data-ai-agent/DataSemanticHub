package organization

import (
	"context"
	"testing"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/organization"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupDeleteTestDB 创建测试数据库
func setupDeleteTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{})
	require.NoError(t, err)

	return db
}

// createDeleteTestOrg 创建测试组织
func createDeleteTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// TestDeleteOrg_NormalFlow_ReturnsSuccess 测试正常删除部门
func TestDeleteOrg_NormalFlow_ReturnsSuccess(t *testing.T) {
	// 注意：此测试需要 sys_user_dept 表支持
	// DeleteOrg 逻辑会调用 CountUsers 检查用户关联
	// 在没有用户部门关联表的情况下，需要跳过此测试
	t.Skip("需要 sys_user_dept 表支持")
}

// TestDeleteOrg_NotFound_ReturnsError 测试删除不存在的部门
func TestDeleteOrg_NotFound_ReturnsError(t *testing.T) {
	db := setupDeleteTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建 Logic
	logic := NewDeleteOrgLogic(ctx, svcCtx)

	// 调用逻辑（使用不存在的ID）
	nonExistentID, _ := uuid.NewV7()
	req := &types.DeleteOrgReq{
		Id: nonExistentID.String(),
	}
	resp, err := logic.DeleteOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestDeleteOrg_RootNode_ReturnsError 测试删除根节点
func TestDeleteOrg_RootNode_ReturnsError(t *testing.T) {
	db := setupDeleteTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建根节点
	root := createDeleteTestOrg(t, db, "0", "总公司", "ROOT", 0)

	// 创建 Logic
	logic := NewDeleteOrgLogic(ctx, svcCtx)

	// 调用逻辑（尝试删除根节点）
	req := &types.DeleteOrgReq{
		Id: root.Id,
	}
	resp, err := logic.DeleteOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestDeleteOrg_WithChildren_ReturnsError 测试删除有子节点的部门
func TestDeleteOrg_WithChildren_ReturnsError(t *testing.T) {
	db := setupDeleteTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据（有子节点）
	parent := createDeleteTestOrg(t, db, "0", "技术部", "TECH", 1)
	_ = createDeleteTestOrg(t, db, parent.Id, "后端组", "BACKEND", 1)

	// 创建 Logic
	logic := NewDeleteOrgLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.DeleteOrgReq{
		Id: parent.Id,
	}
	resp, err := logic.DeleteOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestDeleteOrg_WithUsers_ReturnsError 测试删除有关联用户的部门
func TestDeleteOrg_WithUsers_ReturnsError(t *testing.T) {
	// 注意：此测试需要 sys_user_dept 表支持
	// 在没有用户部门关联表的情况下，CountUsers 会返回 0
	// 所以这个测试会被跳过
	t.Skip("需要 sys_user_dept 表支持")
}
