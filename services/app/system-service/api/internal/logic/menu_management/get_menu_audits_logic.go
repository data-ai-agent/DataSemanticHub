// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package menu_management

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/DataSemanticHub/services/app/system-service/api/internal/svc"
	"github.com/DataSemanticHub/services/app/system-service/api/internal/types"
	"github.com/DataSemanticHub/services/app/system-service/model/system/menu_audit_logs"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetMenuAuditsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMenuAuditsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMenuAuditsLogic {
	return &GetMenuAuditsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMenuAuditsLogic) GetMenuAudits(req *types.GetMenuAuditsReq) (resp *types.GetMenuAuditsResp, err error) {
	// 1. 参数校验
	if req.Id == "" {
		return nil, fmt.Errorf("菜单ID不能为空")
	}

	// 2. 构建查询请求
	findReq := &menu_audit_logs.FindListReq{
		MenuId:        req.Id,
		OperationType: req.OperationType,
		OperatorId:    req.OperatorId,
		Page:          req.Page,
		PageSize:      req.PageSize,
	}

	// 3. 处理时间范围筛选
	if req.StartTime != "" {
		startTime, err := time.Parse("2006-01-02 15:04:05", req.StartTime)
		if err != nil {
			// 尝试其他格式
			startTime, err = time.Parse("2006-01-02", req.StartTime)
			if err != nil {
				logx.Errorf("解析开始时间失败: %v", err)
				return nil, fmt.Errorf("开始时间格式错误")
			}
		}
		findReq.StartTime = &startTime
	}

	if req.EndTime != "" {
		endTime, err := time.Parse("2006-01-02 15:04:05", req.EndTime)
		if err != nil {
			// 尝试其他格式
			endTime, err = time.Parse("2006-01-02", req.EndTime)
			if err != nil {
				logx.Errorf("解析结束时间失败: %v", err)
				return nil, fmt.Errorf("结束时间格式错误")
			}
		}
		findReq.EndTime = &endTime
	}

	// 4. 查询审计日志列表
	logs, total, err := l.svcCtx.MenuAuditLogModel.FindList(l.ctx, findReq)
	if err != nil {
		logx.Errorf("查询审计日志失败: %v", err)
		return nil, fmt.Errorf("查询审计日志失败: %w", err)
	}

	// 5. 转换为响应类型
	auditLogs := make([]types.MenuAuditLog, len(logs))
	for i, log := range logs {
		auditLogs[i] = l.convertAuditLogToType(log)
	}

	resp = &types.GetMenuAuditsResp{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
		Logs:     auditLogs,
	}

	return
}

// convertAuditLogToType 将 Model 层的 MenuAuditLog 转换为 types.MenuAuditLog
func (l *GetMenuAuditsLogic) convertAuditLogToType(log *menu_audit_logs.MenuAuditLog) types.MenuAuditLog {
	auditLog := types.MenuAuditLog{
		Id:            log.Id,
		MenuId:        log.MenuId,
		OperationType: log.OperationType,
		CreatedAt:     log.CreatedAt.Format("2006-01-02 15:04:05.000"),
	}

	// 处理可选字段
	if log.OperatorId != nil {
		auditLog.OperatorId = *log.OperatorId
	}
	if log.OperatorName != nil {
		auditLog.OperatorName = *log.OperatorName
	}

	// 解析 ChangedFields JSON
	if len(log.ChangedFields) > 0 {
		var changedFields []string
		if err := json.Unmarshal(log.ChangedFields, &changedFields); err == nil {
			auditLog.ChangedFields = changedFields
		}
	}

	// 解析 OldValue JSON
	if len(log.OldValue) > 0 {
		var oldValue map[string]interface{}
		if err := json.Unmarshal(log.OldValue, &oldValue); err == nil {
			auditLog.OldValue = oldValue
		}
	}

	// 解析 NewValue JSON
	if len(log.NewValue) > 0 {
		var newValue map[string]interface{}
		if err := json.Unmarshal(log.NewValue, &newValue); err == nil {
			auditLog.NewValue = newValue
		}
	}

	if log.Remark != nil {
		auditLog.Remark = *log.Remark
	}

	return auditLog
}
