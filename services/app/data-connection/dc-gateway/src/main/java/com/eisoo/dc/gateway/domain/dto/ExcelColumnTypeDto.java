package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * @Author exx
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class ExcelColumnTypeDto {
    @ApiModelProperty(value = "表配置id", example = "", dataType = "java.lang.Long")
    private Long excelTableConfigId;

    @NotBlank(message = "表名" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @ApiModelProperty(value = "表名", example = "", dataType = "java.lang.String")
    private String tableName;

    private List<ColumnType> columnTypes;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @ApiModel
    public static class ColumnType {
        @ApiModelProperty(value = "列配置id", example = "", dataType = "java.lang.Long")
        private Long id;

        @NotBlank(message = "列名" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @ApiModelProperty(value = "列名", example = "", dataType = "java.lang.String")
        private String columnName;

        @ApiModelProperty(value = "列注释", example = "", dataType = "java.lang.String")
        private String columnComment;

        @NotBlank(message = "字段类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @ApiModelProperty(value = "字段类型", example = "", dataType = "java.lang.String")
        private String type;

        @ApiModelProperty(value = "列序号", example = "", dataType = "java.lang.Integer")
        private int orderNo;
    }
}
