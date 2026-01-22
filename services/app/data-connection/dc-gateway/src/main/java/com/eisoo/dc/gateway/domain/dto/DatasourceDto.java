package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.*;
import java.io.Serializable;

/**
 * @Author paul.yan
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class DatasourceDto implements Serializable {
    @ApiModelProperty(value = "数据源名称", example = "mysql_133_144_1", dataType = "java.lang.String")
    @NotBlank(message = "数据源名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Size(min = 1, max = 128, message = "数据源名称长度必须在1-128个字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9\u4e00-\u9fa5-_]+$", message = "数据源名称仅支持中英文、数字、下划线和中划线")
    private String name;

    @ApiModelProperty(value = "数据源类型", example = "analytical", allowableValues = "records,analytical", dataType = "java.lang.String")
    @JsonProperty("source_type")
    private String sourceType;

    @ApiModelProperty(value = "连接地址", dataType = "java.lang.String")
    @NotBlank(message = "连接地址" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Size(max = 32, message = "长度最大为32个字符")
    private String host;

    @ApiModelProperty(value = "数据库名称", example = "af_openlookeng", dataType = "java.lang.String")
    @JsonProperty("database_name")
    @Size(max = 100, message = "长度最大为100个字符")
    private String databaseName;

    @ApiModelProperty(value = "数据库名称", example = "public", dataType = "java.lang.String")
    @Size(max = 100, message = "长度最大为100个字符")
    private String schema;

    @ApiModelProperty(value = "密码", example = "hGCcAVLScCkS/d2wNBq2G51VyjY0ho4GMPVafTTa8eftoDNmTmNV1D1loPU9DaLaNWzte2lMSiunycuilMaT7TOtinA6cAmZIbb4C4YZc0W5L+D+vZb910Hl6FTSGf2+PH55ccpLGvAegri5PuG02Hei0CyM7DL5o3k34jJPPQs=", dataType = "java.lang.String")
    //@NotBlank(message = "密码" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Size(max = 1024, message = "长度最大为1024个字符")
    private String password;

    @ApiModelProperty(value = "token", example = "", dataType = "java.lang.String")
    @Size(max = 100, message = "长度最大为100个字符")
    private String token;

    @ApiModelProperty(value = "端口号", example = "3306", dataType = "int")
    @Min(value = 0)
    @Max(value = 65535)
    private int port;

    @ApiModelProperty(value = "类型", example = "maria", dataType = "java.lang.String")
    @NotBlank(message = "类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Size(max = 30, message = "长度最大为30个字符")
    private String type;

    @ApiModelProperty(value = "用户名", example = "root", dataType = "java.lang.String")
    //@NotBlank(message = "用户名" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Size(max = 128, message = "长度最大为128个字符")
    private String username;

    @ApiModelProperty(value = "存储位置", example = "anyshare", dataType = "java.lang.String")
    @JsonProperty("excel_protocol")
    @Size(max = 100, message = "长度最大为100个字符")
    private String excelProtocol;

    @ApiModelProperty(value = "存储路径", example = "/opt/excel", dataType = "java.lang.String")
    @JsonProperty("excel_base")
    @Size(max = 1024, message = "长度最大为1024个字符")
    private String excelBase;



    public void setName(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.name = value != null ? value.toString().trim() : null;
    }
    public void setSourceType(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.sourceType = value != null ? value.toString().trim() : null;
    }
    public void setHost(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.host = value != null ? value.toString().trim() : null;
    }

    public String getDatabaseName() {
        return databaseName != null ? databaseName : "";
    }

    public void setDatabaseName(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.databaseName = value != null ? value.toString().trim() : "";
    }

    public String getSchema() {
        return schema != null ? schema : "";
    }

    public void setSchema(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.schema = value != null ? value.toString().trim() : "";
    }

    public String getPassword() {
        return password != null ? password : "";
    }

    public void setPassword(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.password = value != null ? value.toString().trim() : "";
    }
    public void setToken(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.token = value != null ? value.toString().trim() : null;
    }
    public void setPort(Object value) {
        if (value != null && !(value instanceof Integer)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.port = value != null ? (Integer) value : 0;
    }
    public void setType(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.type = value != null ? value.toString().trim() : null;
    }
    public String getUsername() {
        return username != null ? username : "";
    }
    public void setUsername(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.username = value != null ? value.toString().trim() : "";
    }
    public void setExcelProtocol(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.excelProtocol = value != null ? value.toString().trim() : null;
    }
    public void setExcelBase(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.excelBase = value != null ? value.toString().trim() : null;
    }

}
