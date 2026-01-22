package com.eisoo.dc.common.auditLog;

import com.eisoo.dc.common.auditLog.enums.ObjectType;
import com.eisoo.dc.common.auditLog.enums.OperationType;
import com.eisoo.dc.common.auditLog.enums.OperatorType;
import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.util.StringUtils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * 日志数据结构
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLog {
    /**
     * 操作类型，枚举检查
     */
    private OperationType operation;

    /**
     * 描述信息，最大长度65535
     * 示例：向用户”张三“共享文件”电影“
     */
    private String description;

    /**
     * 操作时间（纳秒级时间戳）
     */
    @JsonProperty("op_time")
    private Long opTime;

    /**
     * 操作者信息
     */
    private Operator operator;

    /**
     * 操作对象信息（可选）
     */
    private LogObject object;

    /**
     * 日志来源信息
     */
    @JsonProperty("log_from")
    private LogFrom logFrom;

    /**
     * 详细信息（可选）
     */
    private Object detail;

    /**
     * 附加信息，最大长度65535（可选）
     */
    @JsonProperty("ex_msg")
    private String exMsg;

    /**
     * 日志级别：WARN, INFO等
     */
    private String level;

    /**
     * 外部唯一业务ID，用于防抖，格式不限 最长128
     */
    @JsonProperty("out_biz_id")
    private String outBizId;

    /**
     * 日志类型，枚举
     * ”login“: 登录审计日志，”operation“:操作审计日志，”management“:管理审计日志
     * 三种类型的审计日志：登录、管理、操作
     * 登录：所有的登录行为，包括客户端和管理控制台
     * 管理：管理员行为
     * 操作：普通用户行为
     */
    private String type;


    public static AuditLog newAuditLog(){
        return AuditLog.builder()
                .opTime(getEpochNanoTimestamp())
                .logFrom(new LogFrom(Constants.PACKAGE_NAME, new LogFromService(Constants.SERVICE_NAME)))
                .level(Constants.AUDIT_LOG_LEVEL_INFO)
                .outBizId(UUID.randomUUID().toString())
                .type(Constants.AUDIT_LOG_TYPE_OPERATION)
                .build();
    }

    /**
     * 获取当前时间的纳秒时间戳（UTC时区）
     * @return 从1970-01-01T00:00:00Z开始的纳秒数
     */
    public static long getEpochNanoTimestamp() {
        Instant now = Instant.now();
        return now.getEpochSecond() * 1_000_000_000L + now.getNano();
    }

    // WithOperation 设置操作类型
    public AuditLog withOperation(OperationType operation) {
        this.operation = operation;
        return this;
    }

    // WithOperator 设置操作人信息
    public AuditLog withOperator(Operator operator) {
        this.operator = operator;
        return this;
    }

    // WithObject 设置操作对象信息
    public AuditLog withObject(LogObject object) {
        this.object = object;
        return this;
    }


    /**
     * 自动生成描述信息
     * @return 生成的描述信息
     */
    public AuditLog generateDescription() {
        // 如果已有描述或缺少必要信息，则直接返回
        if (this.description != null || this.operator == null || this.object == null) {
            return this;
        }

        StringBuilder description = new StringBuilder();

        // 1. 生成操作者信息部分
        if (Objects.equals(this.operator.getOperatorType().getValue(), OperatorType.AUTHENTICATED_USER.getValue()) ||
                Objects.equals(this.operator.getOperatorType().getValue(), OperatorType.ANONYMOUS_USER.getValue())) {

            if (Objects.equals(this.operator.getOperatorType().getValue(), OperatorType.AUTHENTICATED_USER.getValue())) {
                description.append(String.format("用户(id=%s)",
                        StringUtils.defaultString(this.operator.getOperatorId())));
            } else {
                description.append(OperatorType.ANONYMOUS_USER.getDescription());
            }

            if (this.operator.getOperatorAgent() != null) {
                description.append(String.format("在客户端(type=%s,ip=%s,mac=%s)",
                        this.operator.getOperatorAgent().getOperatorAgentType(),
                        this.operator.getOperatorAgent().getOperatorAgentIp(),
                        this.operator.getOperatorAgent().getOperatorAgentMac()));
            }
        } else {
            description.append(String.format("内部服务(name=%s)",
                    StringUtils.defaultString(this.operator.getOperatorName())));
        }

        // 2. 添加操作动作
        switch (this.operation) {
            case CREATE:
                description.append("创建了");
                break;
            case UPDATE:
                description.append("更新了");
                break;
            case DELETE:
                description.append("删除了");
                break;
            default:
                description.append("操作了");
        }

        // 3. 添加操作对象信息
        String objectTypeStr;
        if (Objects.requireNonNull(this.object.getObjectType()) == ObjectType.DATA_SOURCE) {
            objectTypeStr = ObjectType.DATA_SOURCE.getDescription();
        } else {
            objectTypeStr = "对象";
        }
        description.append(String.format("%s(id=%s)", objectTypeStr, StringUtils.defaultString(this.object.getObjectId())));

        this.description = description.toString();
        return this;
    }
}
