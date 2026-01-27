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

// setupCreateTestDB 创建测试数据库
func setupCreateTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{})
	require.NoError(t, err)

	return db
}

// createCreateTestOrg 创建测试组织
func createCreateTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int) *organization.SysOrganization {
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

// TestCreateOrg_NormalFlow_ReturnsOrgId 测试正常创建部门
func TestCreateOrg_NormalFlow_ReturnsOrgId(t *testing.T) {
	db := setupCreateTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建父节点
	root := createCreateTestOrg(t, db, "0", "总公司", "ROOT", 0)

	// 创建 Logic
	logic := NewCreateOrgLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.CreateOrgReq{
		ParentId:  root.Id,
		Name:      "技术部",
		Code:      "TECH",
		SortOrder: 1,
		Type:      2,
		Desc:      "负责技术研发",
	}
	resp, err := logic.CreateOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Id)

	// 验证数据库中的记录
	org, err := orgModel.FindOne(ctx, resp.Id)
	require.NoError(t, err)
	assert.Equal(t, "技术部", org.Name)
	assert.Equal(t, "TECH", org.Code)
	assert.Equal(t, root.Id, org.ParentId)
	assert.Equal(t, "0,"+root.Id, org.Ancestors)
	assert.Equal(t, 1, org.SortOrder)
	assert.Equal(t, int8(2), org.Type)
	assert.Equal(t, int8(1), org.Status)
	assert.Equal(t, "负责技术研发", org.Desc)
}

// TestCreateOrg_RootNode_ReturnsOrgId 测试创建根节点
func TestCreateOrg_RootNode_ReturnsOrgId(t *testing.T) {
	db := setupCreateTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建 Logic
	logic := NewCreateOrgLogic(ctx, svcCtx)

	// 调用逻辑（创建根节点）
	req := &types.CreateOrgReq{
		ParentId:  "0",
		Name:      "总公司",
		Code:      "ROOT",
		SortOrder: 0,
		Type:      1,
	}
	resp, err := logic.CreateOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Id)

	// 验证数据库中的记录
	org, err := orgModel.FindOne(ctx, resp.Id)
	require.NoError(t, err)
	assert.Equal(t, "总公司", org.Name)
	assert.Equal(t, "0", org.ParentId)
	assert.Equal(t, "0", org.Ancestors)
	assert.Equal(t, int8(1), org.Type)
}

// TestCreateOrg_ParentNotFound_ReturnsError 测试父节点不存在
func TestCreateOrg_ParentNotFound_ReturnsError(t *testing.T) {
	db := setupCreateTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建 Logic
	logic := NewCreateOrgLogic(ctx, svcCtx)

	// 调用逻辑（使用不存在的父节点ID）
	nonExistentID, _ := uuid.NewV7()
	req := &types.CreateOrgReq{
		ParentId:  nonExistentID.String(),
		Name:      "技术部",
		Code:      "TECH",
		SortOrder: 1,
		Type:      2,
	}
	resp, err := logic.CreateOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestCreateOrg_DuplicateName_ReturnsError 测试同级名称重复
func TestCreateOrg_DuplicateName_ReturnsError(t *testing.T) {
	db := setupCreateTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建父节点
	root := createCreateTestOrg(t, db, "0", "总公司", "ROOT", 0)
	// 创建第一个子节点
	_ = createCreateTestOrg(t, db, root.Id, "技术部", "TECH", 1)

	// 创建 Logic
	logic := NewCreateOrgLogic(ctx, svcCtx)

	// 尝试创建同名的部门
	req := &types.CreateOrgReq{
		ParentId:  root.Id,
		Name:      "技术部",
		Code:      "TECH2",
		SortOrder: 2,
		Type:      2,
	}
	resp, err := logic.CreateOrg(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestCreateOrg_WithLeader_ReturnsOrgId 测试创建有负责人的部门
func TestCreateOrg_WithLeader_ReturnsOrgId(t *testing.T) {
	db := setupCreateTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建父节点
	root := createCreateTestOrg(t, db, "0", "总公司", "ROOT", 0)
	// 创建负责人ID
	leaderID, _ := uuid.NewV7()

	// 创建 Logic
	logic := NewCreateOrgLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.CreateOrgReq{
		ParentId:  root.Id,
		Name:      "技术部",
		Code:      "TECH",
		LeaderId:  leaderID.String(),
		SortOrder: 1,
		Type:      2,
	}
	resp, err := logic.CreateOrg(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)

	// 验证数据库中的记录
	org, err := orgModel.FindOne(ctx, resp.Id)
	require.NoError(t, err)
	assert.Equal(t, leaderID.String(), org.LeaderId)
}
