// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user_management

import (
	"context"
	"encoding/json"
	"regexp"
	"strings"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/errorx"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	auditlogs "github.com/DataSemanticHub/services/app/system-service/model/user/audit_logs"
	rolebindings "github.com/DataSemanticHub/services/app/system-service/model/user/role_bindings"
	"github.com/DataSemanticHub/services/app/system-service/model/user/users"

	baseErrorx "github.com/jinguoxing/idrm-go-base/errorx"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type UpdateUserLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 更新用户
func NewUpdateUserLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateUserLogic {
	return &UpdateUserLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateUserLogic) UpdateUser(userId string, req *types.UpdateUserReq) (resp *types.EmptyResp, err error) {
	// 1. 参数校验
	if userId == "" {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户ID不能为空")
	}

	// 2. 查询用户是否存在
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		if err == users.ErrUserNotFound {
			return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
		}
		l.Errorf("查询用户信息失败: %v", err)
		return nil, baseErrorx.New(50000, "系统错误")
	}
	if user == nil {
		return nil, baseErrorx.New(errorx.ErrUserManagementUserNotFound, "用户不存在")
	}

	// 3. 手机号唯一性校验（如果提供）
	var phone *string
	if req.Phone != "" {
		phoneStr := strings.TrimSpace(req.Phone)
		// 手机号格式校验
		phoneRegex := regexp.MustCompile(`^1[3-9]\d{9}$`)
		if !phoneRegex.MatchString(phoneStr) {
			return nil, baseErrorx.New(20002, "手机号格式不正确")
		}

		// 检查手机号是否被其他用户使用
		existingUserByPhone, _ := l.svcCtx.UserModel.FindOneByPhone(l.ctx, phoneStr)
		if existingUserByPhone != nil && existingUserByPhone.Id != userId {
			return nil, baseErrorx.New(errorx.ErrUserManagementPhoneExists, "手机号已被其他用户使用")
		}
		phone = &phoneStr
	}

	// 4. 记录变更内容（用于审计日志）
	changes := make(map[string]interface{})
	oldValues := make(map[string]interface{})
	newValues := make(map[string]interface{})

	// 准备更新的用户数据
	updateData := &users.User{
		Id: userId,
	}

	// 检查并记录姓名变更
	if req.Name != "" {
		newName := strings.TrimSpace(req.Name)
		if newName != user.Name {
			oldValues["name"] = user.Name
			newValues["name"] = newName
			updateData.Name = newName
		}
	}

	// 检查并记录手机号变更
	if phone != nil {
		oldPhone := ""
		if user.Phone != nil {
			oldPhone = *user.Phone
		}
		if *phone != oldPhone {
			oldValues["phone"] = oldPhone
			newValues["phone"] = *phone
			updateData.Phone = phone
		}
	} else if req.Phone == "" && user.Phone != nil {
		// 清空手机号
		oldValues["phone"] = *user.Phone
		newValues["phone"] = ""
		updateData.Phone = nil
	}

	// 检查并记录部门ID变更
	if req.DeptId != "" {
		oldDeptId := ""
		if user.DeptId != nil {
			oldDeptId = *user.DeptId
		}
		if req.DeptId != oldDeptId {
			oldValues["dept_id"] = oldDeptId
			newValues["dept_id"] = req.DeptId
			deptId := req.DeptId
			updateData.DeptId = &deptId
		}
	}

	// 如果有变更，记录到 changes
	if len(oldValues) > 0 {
		for key, oldVal := range oldValues {
			changes[key] = map[string]interface{}{
				"old": oldVal,
				"new": newValues[key],
			}
		}
	}

	// 5. 获取当前操作人信息（从 context 中获取）
	var updatedBy *string
	if operatorIDValue := l.ctx.Value("user_id"); operatorIDValue != nil {
		if operatorIDStr, ok := operatorIDValue.(string); ok {
			updatedBy = &operatorIDStr
		}
	}
	updateData.UpdatedBy = updatedBy

	// 6. 使用事务更新用户、角色绑定和审计日志
	err = l.svcCtx.DB.WithContext(l.ctx).Transaction(func(tx *gorm.DB) error {
		// 6.1 更新用户基本信息（如果有变更）
		if len(changes) > 0 {
			// 只更新有变更的字段
			updateMap := make(map[string]interface{})
			if updateData.Name != "" && updateData.Name != user.Name {
				updateMap["name"] = updateData.Name
			}
			if updateData.Phone != nil {
				updateMap["phone"] = updateData.Phone
			} else if req.Phone == "" && user.Phone != nil {
				updateMap["phone"] = nil
			}
			if updateData.DeptId != nil {
				updateMap["dept_id"] = updateData.DeptId
			}
			if updatedBy != nil {
				updateMap["updated_by"] = updatedBy
			}

			if len(updateMap) > 0 {
				err := tx.WithContext(l.ctx).Model(&users.User{}).Where("id = ?", userId).Updates(updateMap).Error
				if err != nil {
					l.Errorf("更新用户信息失败: %v", err)
					return baseErrorx.New(50000, "更新用户信息失败")
				}
			}
		}

		// 6.2 处理角色绑定更新（如果提供）
		if req.RoleBindings != nil {
			roleBindingModel := l.svcCtx.RoleBindingModel.WithTx(tx)

			// 删除旧的角色绑定
			err := roleBindingModel.DeleteByUserId(l.ctx, userId)
			if err != nil {
				l.Errorf("删除旧角色绑定失败: %v", err)
				return baseErrorx.New(50000, "删除旧角色绑定失败")
			}

			// 创建新的角色绑定
			for _, rbInput := range req.RoleBindings {
				roleBinding := &rolebindings.RoleBinding{
					UserId: userId,
					OrgId:  rbInput.OrgId,
				}
				if rbInput.Position != "" {
					position := strings.TrimSpace(rbInput.Position)
					roleBinding.Position = &position
				}
				if rbInput.PermissionRole != "" {
					permissionRole := strings.TrimSpace(rbInput.PermissionRole)
					roleBinding.PermissionRole = &permissionRole
				}
				_, err := roleBindingModel.Insert(l.ctx, roleBinding)
				if err != nil {
					l.Errorf("创建角色绑定失败: %v", err)
					return baseErrorx.New(50000, "创建角色绑定失败")
				}
			}

			// 记录角色绑定变更
			if len(changes) == 0 {
				changes = make(map[string]interface{})
			}
			changes["role_bindings"] = map[string]interface{}{
				"action": "updated",
			}
		}

		// 6.3 记录审计日志（如果有变更）
		if len(changes) > 0 {
			auditLogModel := l.svcCtx.AuditLogModel.WithTx(tx)
			operatorName := "System"
			operatorID := "system"
			if updatedBy != nil {
				operatorID = *updatedBy
				// 尝试获取操作人姓名（使用非事务查询，避免嵌套事务问题）
				if operatorUser, err := l.svcCtx.UserModel.FindOne(l.ctx, operatorID); err == nil && operatorUser != nil {
					operatorName = operatorUser.Name
				}
			}

			changesJSON, _ := json.Marshal(changes)
			auditLog := &auditlogs.AuditLog{
				UserId:     userId,
				Action:     "update",
				Operator:   operatorName,
				OperatorId: operatorID,
				Changes:    datatypes.JSON(changesJSON),
				Timestamp:  time.Now(),
			}
			_, err = auditLogModel.Insert(l.ctx, auditLog)
			if err != nil {
				l.Errorf("记录审计日志失败: %v", err)
				// 审计日志失败不影响主流程，仅记录错误
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 7. 返回响应
	return &types.EmptyResp{}, nil
}
