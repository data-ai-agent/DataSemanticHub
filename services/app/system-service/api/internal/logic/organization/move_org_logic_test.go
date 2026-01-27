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

// setupMoveTestDB 创建测试数据库
func setupMoveTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{})
	require.NoError(t, err)

	return db
}

// createMoveTestOrg 创建测试组织
func createMoveTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// TestMoveOrg_NormalFlow_ReturnsSuccess 测试正常移动部门
func TestMoveOrg_NormalFlow_ReturnsSuccess(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据：root -> dept1, dept2
	root := createMoveTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createMoveTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	dept2 := createMoveTestOrg(t, db, root.Id, "市场部", "MARKET", 2)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 将 dept2 移动到 dept1 下
	req := &types.MoveOrgReq{
		Id:             dept2.Id,
		TargetParentId: dept1.Id,
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)

	// 验证数据库中的记录
	movedOrg, err := orgModel.FindOne(ctx, dept2.Id)
	require.NoError(t, err)
	assert.Equal(t, dept1.Id, movedOrg.ParentId)
	assert.Equal(t, "0,"+root.Id+","+dept1.Id, movedOrg.Ancestors)
}

// TestMoveOrg_MoveToRoot_ReturnsSuccess 测试移动到根节点
func TestMoveOrg_MoveToRoot_ReturnsSuccess(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	root := createMoveTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createMoveTestOrg(t, db, root.Id, "技术部", "TECH", 1)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 将 dept1 移动到根节点
	req := &types.MoveOrgReq{
		Id:             dept1.Id,
		TargetParentId: "0",
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	// 验证数据库中的记录
	movedOrg, err := orgModel.FindOne(ctx, dept1.Id)
	require.NoError(t, err)
	assert.Equal(t, "0", movedOrg.ParentId)
	assert.Equal(t, "0", movedOrg.Ancestors)
}

// TestMoveOrg_NodeNotFound_ReturnsError 测试移动不存在的节点
func TestMoveOrg_NodeNotFound_ReturnsError(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 使用不存在的节点ID
	nonExistentID, _ := uuid.NewV7()
	req := &types.MoveOrgReq{
		Id:             nonExistentID.String(),
		TargetParentId: "0",
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestMoveOrg_TargetParentNotFound_ReturnsError 测试目标父节点不存在
func TestMoveOrg_TargetParentNotFound_ReturnsError(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	org := createMoveTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 使用不存在的目标父节点ID
	nonExistentID, _ := uuid.NewV7()
	req := &types.MoveOrgReq{
		Id:             org.Id,
		TargetParentId: nonExistentID.String(),
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestMoveOrg_MoveToSelf_ReturnsError 测试移动到自己下
func TestMoveOrg_MoveToSelf_ReturnsError(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	org := createMoveTestOrg(t, db, "0", "技术部", "TECH", 1)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 尝试移动到自己下
	req := &types.MoveOrgReq{
		Id:             org.Id,
		TargetParentId: org.Id,
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestMoveOrg_MoveToDescendant_ReturnsError 测试移动到子孙节点下（环路检测）
func TestMoveOrg_MoveToDescendant_ReturnsError(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据：root -> dept1 -> team1 -> subgroup
	// 需要至少3层嵌套才能被 IsDescendant 检测到
	root := createMoveTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createMoveTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	team1 := createMoveTestOrg(t, db, dept1.Id, "后端组", "BACKEND", 1)
	subgroup := createMoveTestOrg(t, db, team1.Id, "Java组", "JAVA", 1)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 尝试将 dept1 移动到其孙子节点 subgroup 下（环路）
	// dept1 是 subgroup 的祖先（depth >= 2）
	req := &types.MoveOrgReq{
		Id:             dept1.Id,
		TargetParentId: subgroup.Id,
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestMoveOrg_WithDescendants_ReturnsSuccess 测试移动带有子孙节点的部门
func TestMoveOrg_WithDescendants_ReturnsSuccess(t *testing.T) {
	db := setupMoveTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据：root -> dept1 -> team1, team2; root -> dept2
	root := createMoveTestOrg(t, db, "0", "总公司", "ROOT", 0)
	dept1 := createMoveTestOrg(t, db, root.Id, "技术部", "TECH", 1)
	team1 := createMoveTestOrg(t, db, dept1.Id, "后端组", "BACKEND", 1)
	_ = createMoveTestOrg(t, db, dept1.Id, "前端组", "FRONTEND", 2)
	dept2 := createMoveTestOrg(t, db, root.Id, "市场部", "MARKET", 2)

	// 创建 Logic
	logic := NewMoveOrgLogic(ctx, svcCtx)

	// 将 dept1（及其子孙）移动到 dept2 下
	req := &types.MoveOrgReq{
		Id:             dept1.Id,
		TargetParentId: dept2.Id,
	}
	resp, err := logic.MoveOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.Success)

	// 验证 dept1 的 ancestors 已更新
	movedDept1, err := orgModel.FindOne(ctx, dept1.Id)
	require.NoError(t, err)
	assert.Equal(t, dept2.Id, movedDept1.ParentId)
	assert.Equal(t, "0,"+root.Id+","+dept2.Id, movedDept1.Ancestors)

	// 验证 team1 的 ancestors 也已更新
	movedTeam1, err := orgModel.FindOne(ctx, team1.Id)
	require.NoError(t, err)
	assert.Contains(t, movedTeam1.Ancestors, dept2.Id, "team1 的 ancestors 应包含新的父节点 dept2")
	assert.NotContains(t, movedTeam1.Ancestors, root.Id+","+dept1.Id, "team1 的 ancestors 不应包含旧的路径段")
}
