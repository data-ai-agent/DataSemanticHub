// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListUsersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 用户列表查询
func NewListUsersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListUsersLogic {
	return &ListUsersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListUsersLogic) ListUsers(req *types.ListUsersReq) (resp *types.ListUsersResp, err error) {
	// 1. 参数校验（分页参数已在 handler 层通过 validator 校验）
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 {
		req.PageSize = 10
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	// 2. 构建 Model 层查询请求
	findReq := &users.FindListReq{
		Page:           req.Page,
		PageSize:       req.PageSize,
		Keyword:        req.Keyword,
		DeptId:         req.DeptId,
		AccountSource:  req.AccountSource,
		PermissionRole: req.PermissionRole,
		SortField:      req.SortField,
		SortOrder:      req.SortOrder,
	}

	// 处理 Status 筛选（支持 0 值，使用指针以区分未设置和设置为 0）
	// 由于 types.ListUsersReq 中 Status 是 int8 类型，0 值无法区分是否设置
	// 这里假设如果 Status 在有效范围内（0-4），则认为是设置了筛选条件
	if req.Status >= 0 && req.Status <= 4 {
		status := req.Status
		findReq.Status = &status
	}

	// 3. 调用 Model.FindList 查询用户列表
	userList, total, err := l.svcCtx.UserModel.FindList(l.ctx, findReq)
	if err != nil {
		l.Errorf("查询用户列表失败: %v", err)
		return nil, err
	}

	// 4. 构建响应数据
	usersResp := make([]types.User, 0, len(userList))
	for _, user := range userList {
		userResp := l.convertUserToResponse(user)
		usersResp = append(usersResp, userResp)
	}

	return &types.ListUsersResp{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
		Users:    usersResp,
	}, nil
}

// convertUserToResponse 将 Model 层的 User 转换为 API 层的 User
func (l *ListUsersLogic) convertUserToResponse(user *users.User) types.User {
	userResp := types.User{
		Id:            user.Id,
		Name:          user.Name,
		Email:         user.Email,
		Status:        user.Status,
		AccountSource: user.AccountSource,
		CreatedAt:     user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     user.UpdatedAt.Format(time.RFC3339),
	}

	// 处理可选字段
	if user.Phone != nil {
		userResp.Phone = *user.Phone
	}
	if user.DeptId != nil {
		userResp.DeptId = *user.DeptId
	}
	if user.LastLoginAt != nil {
		userResp.LastLogin = user.LastLoginAt.Format(time.RFC3339)
	}
	if user.CreatedBy != nil {
		userResp.CreatedBy = *user.CreatedBy
	}
	if user.UpdatedBy != nil {
		userResp.UpdatedBy = *user.UpdatedBy
	}

	return userResp
}
