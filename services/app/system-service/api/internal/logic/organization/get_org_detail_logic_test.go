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

// setupDetailTestDB 创建测试数据库（避免与 get_org_tree_logic_test 冲突）
func setupDetailTestDB(t *testing.T) *gorm.DB {
	dbName := "file:test_" + t.Name() + "?mode=memory&cache=shared"
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&organization.SysOrganization{})
	require.NoError(t, err)

	return db
}

// createDetailTestOrg 创建测试组织（避免与 get_org_tree_logic_test 冲突）
func createDetailTestOrg(t *testing.T, db *gorm.DB, parentId, name, code string, sortOrder int, status int8) *organization.SysOrganization {
	id, _ := uuid.NewV7()
	now := time.Now().Format("2006-01-02 15:04:05")
	org := &organization.SysOrganization{
		Id:        id.String(),
		ParentId:  parentId,
		Name:      name,
		Code:      code,
		SortOrder: sortOrder,
		Type:      2,
		Status:    status,
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

// TestGetOrgDetail_ExistingOrg_ReturnsDetail 测试查询存在的部门
func TestGetOrgDetail_ExistingOrg_ReturnsDetail(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	root := createDetailTestOrg(t, db, "0", "总公司", "ROOT", 0, 1)
	dept1 := createDetailTestOrg(t, db, root.Id, "技术部", "TECH", 1, 1)

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.GetOrgDetailReq{
		Id: dept1.Id,
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Detail)

	detail := resp.Detail
	assert.Equal(t, dept1.Id, detail.Id)
	assert.Equal(t, "技术部", detail.Name)
	assert.Equal(t, "TECH", detail.Code)
	assert.Equal(t, root.Id, detail.ParentId)
	assert.Equal(t, "总公司", detail.ParentName, "应包含父组织名称")
	// ancestors 应该是 "0,<root.Id>" 的格式
	assert.Equal(t, "0,"+root.Id, detail.Ancestors, "ancestors 应包含完整的祖先路径")
	assert.Equal(t, 1, detail.SortOrder)
	assert.Equal(t, int8(2), detail.Type)
	assert.Equal(t, int8(1), detail.Status)
	assert.NotEmpty(t, detail.CreatedAt)
	assert.NotEmpty(t, detail.UpdatedAt)
}

// TestGetOrgDetail_NonExistingOrg_ReturnsError 测试查询不存在的部门
func TestGetOrgDetail_NonExistingOrg_ReturnsError(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 不创建任何数据

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	nonExistentID, _ := uuid.NewV7()
	req := &types.GetOrgDetailReq{
		Id: nonExistentID.String(),
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	assert.Error(t, err)
	assert.Nil(t, resp)
}

// TestGetOrgDetail_RootNode_ReturnsDetailWithoutParent 测试查询根节点（无父节点）
func TestGetOrgDetail_RootNode_ReturnsDetailWithoutParent(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建根节点
	root := createDetailTestOrg(t, db, "0", "总公司", "ROOT", 0, 1)

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.GetOrgDetailReq{
		Id: root.Id,
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Detail)

	detail := resp.Detail
	assert.Equal(t, "0", detail.ParentId, "根节点的父节点ID应为'0'")
	assert.Empty(t, detail.ParentName, "根节点不应有父组织名称")
}

// TestGetOrgDetail_WithLeader_ReturnsLeaderInfo 测试查询有负责人的部门
func TestGetOrgDetail_WithLeader_ReturnsLeaderInfo(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	leaderID, _ := uuid.NewV7()
	org := createDetailTestOrg(t, db, "0", "技术部", "TECH", 1, 1)
	org.LeaderId = leaderID.String()
	db.Save(org)

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.GetOrgDetailReq{
		Id: org.Id,
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Detail)

	detail := resp.Detail
	assert.Equal(t, leaderID.String(), detail.LeaderId)
	assert.Empty(t, detail.LeaderName, "TODO: 负责人名称查询功能未实现")
}

// TestGetOrgDetail_WithDesc_ReturnsCompleteDetail 测试查询有描述的部门
func TestGetOrgDetail_WithDesc_ReturnsCompleteDetail(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	org := createDetailTestOrg(t, db, "0", "技术部", "TECH", 1, 1)
	org.Desc = "负责产品研发和技术创新"
	db.Save(org)

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.GetOrgDetailReq{
		Id: org.Id,
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Detail)

	detail := resp.Detail
	assert.Equal(t, "负责产品研发和技术创新", detail.Desc)
}

// TestGetOrgDetail_DisabledOrg_ReturnsDetail 测试查询已停用的部门
func TestGetOrgDetail_DisabledOrg_ReturnsDetail(t *testing.T) {
	db := setupDetailTestDB(t)
	orgModel := organization.NewModel(db)
	treeService := organization.NewTreeService(orgModel)
	svcCtx := &svc.ServiceContext{
		OrgModel:       orgModel,
		OrgTreeService: treeService,
	}
	ctx := context.Background()

	// 创建测试数据
	org := createDetailTestOrg(t, db, "0", "技术部", "TECH", 1, 2) // status=2 表示停用

	// 创建 Logic
	logic := NewGetOrgDetailLogic(ctx, svcCtx)

	// 调用逻辑
	req := &types.GetOrgDetailReq{
		Id: org.Id,
	}
	resp, err := logic.GetOrgDetail(req)

	// 验证结果
	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotNil(t, resp.Detail)

	detail := resp.Detail
	assert.Equal(t, int8(2), detail.Status, "应返回停用状态")
}
