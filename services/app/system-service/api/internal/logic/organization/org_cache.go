// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package organization

import (
	"context"
	"fmt"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
)

type OrgCacheLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// NewOrgCacheLogic 创建缓存管理逻辑
func NewOrgCacheLogic(ctx context.Context, svcCtx *svc.ServiceContext) *OrgCacheLogic {
	return &OrgCacheLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// BuildDeptCache 构建用户数据权限缓存
// 用户登录时调用，将主部门及所有子部门ID缓存到Redis
func (l *OrgCacheLogic) BuildDeptCache(userId string) error {
	// 1. 查询用户主部门
	primaryDept, err := l.svcCtx.UserDeptModel.FindPrimaryByUserId(l.ctx, userId)
	if err != nil {
		l.Errorf("查询主部门失败: userId=%s, error=%v", userId, err)
		return err
	}
	if primaryDept == nil {
		l.Infof("用户没有主部门，跳过缓存构建: userId=%s", userId)
		return nil
	}

	// 2. 查询主部门的所有子部门
	depts := []string{primaryDept.DeptId}
	descendants, err := l.svcCtx.OrgModel.FindSubtree(l.ctx, primaryDept.DeptId)
	if err != nil {
		l.Errorf("查询子部门失败: userId=%s, deptId=%s, error=%v", userId, primaryDept.DeptId, err)
		return err
	}

	for _, d := range descendants {
		if d.Id != primaryDept.DeptId {
			depts = append(depts, d.Id)
		}
	}

	// 3. 写入Redis Set
	key := fmt.Sprintf("user:dept:%s", userId)
	members := make([]interface{}, len(depts))
	for i, deptId := range depts {
		members[i] = deptId
	}

	err = l.svcCtx.RedisClient.SAdd(l.ctx, key, members...).Err()
	if err != nil {
		l.Errorf("写入Redis缓存失败: userId=%s, key=%s, error=%v", userId, key, err)
		return err
	}

	// 设置缓存过期时间（24小时）
	l.svcCtx.RedisClient.Expire(l.ctx, key, 86400)

	l.Infof("成功构建用户数据权限缓存: userId=%s, 部门数=%d", userId, len(depts))
	return nil
}

// InvalidateDeptCache 失效指定用户的数据权限缓存
// 用于用户主部门变更时主动失效旧缓存
func (l *OrgCacheLogic) InvalidateDeptCache(userId string) error {
	key := fmt.Sprintf("user:dept:%s", userId)
	err := l.svcCtx.RedisClient.Del(l.ctx, key).Err()
	if err != nil {
		l.Errorf("删除Redis缓存失败: userId=%s, key=%s, error=%v", userId, key, err)
		return err
	}

	l.Infof("成功失效用户数据权限缓存: userId=%s", userId)
	return nil
}

// InvalidateDeptCacheByDept 失效指定部门的所有相关用户缓存
// 用于组织架构变更（创建、删除、移动部门）时批量失效缓存
func (l *OrgCacheLogic) InvalidateDeptCacheByDept(deptId string) error {
	// 1. 查询该部门的所有用户（主部门 + 辅助部门）
	users, err := l.svcCtx.UserDeptModel.FindUsersByDeptId(l.ctx, deptId, nil)
	if err != nil {
		l.Errorf("查询部门用户失败: deptId=%s, error=%v", deptId, err)
		return err
	}

	// 2. 批量删除这些用户的缓存
	successCount := 0
	for _, userDept := range users {
		key := fmt.Sprintf("user:dept:%s", userDept.UserId)
		if err := l.svcCtx.RedisClient.Del(l.ctx, key).Err(); err != nil {
			l.Errorf("删除用户缓存失败: userId=%s, deptId=%s, error=%v", userDept.UserId, deptId, err)
		} else {
			successCount++
		}
	}

	l.Infof("成功失效部门相关用户缓存: deptId=%s, 影响用户数=%d", deptId, successCount)
	return nil
}

// GetDeptCache 获取用户的数据权限缓存
// 返回用户有权限访问的所有部门ID列表
func (l *OrgCacheLogic) GetDeptCache(userId string) ([]string, error) {
	key := fmt.Sprintf("user:dept:%s", userId)
	members, err := l.svcCtx.RedisClient.SMembers(l.ctx, key).Result()
	if err != nil {
		l.Errorf("获取Redis缓存失败: userId=%s, key=%s, error=%v", userId, key, err)
		return nil, err
	}

	return members, nil
}
