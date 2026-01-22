package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.common.deserializer.BooleanDeserializer;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
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
public class ExcelTableConfigDto {
    @NotBlank(message = "数据源id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("datasource_id")
    @ApiModelProperty(value = "数据源id", example = "", dataType = "java.lang.String")
    private String dataSourceId;

    @NotBlank(message = "数据源" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @ApiModelProperty(value = "数据源", example = "", dataType = "java.lang.String")
    private String catalog;

    @NotBlank(message = "excel文件名" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("file_name")
    @ApiModelProperty(value = "excel文件名", example = "", dataType = "java.lang.String")
    private String fileName;

    @JsonProperty("table_name")
    @ApiModelProperty(value = "加载所有sheet", example = "", dataType = "java.lang.String")
    private String tableName;

    @ApiModelProperty(value = "sheet名称", example = "", dataType = "java.lang.String")
    private String sheet;

    @JsonProperty("all_sheet")
    @ApiModelProperty(value = "加载所有sheet", example = "", dataType = "java.lang.Boolean")
    @JsonDeserialize(using = BooleanDeserializer.class)
    private boolean allSheet = false;

    @JsonProperty("sheet_as_new_column")
    @ApiModelProperty(value = "是否把sheet作为列", example = "", dataType = "java.lang.Boolean")
    @JsonDeserialize(using = BooleanDeserializer.class)
    private boolean sheetAsNewColumn = false;

    @JsonProperty("start_cell")
    @ApiModelProperty( value = "起始单元格", example = "", dataType = "java.lang.String")
    @NotBlank(message = "起始单元格" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String startCell;

    @JsonProperty("end_cell")
    @ApiModelProperty(value = "结束单元格", example = "", dataType = "java.lang.String")
    @NotBlank(message = "结束单元格" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String endCell;

    @JsonProperty("has_headers")
    @ApiModelProperty(value = "是否有表头", example = "", dataType = "java.lang.Boolean")
    @JsonDeserialize(using = BooleanDeserializer.class)
    private boolean hasHeaders = false;

    private List<ColumnType> columns;

    public void setTableName(Object value) {
        if (value != null && !(value instanceof String)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        this.tableName = value != null ? value.toString().trim() : null;
    }


    public int[] getRowAndCloumnIndex(String coordinate) {
        int[] rowCol = new int[2];
        // 将字母列数转化为数字
        String colStr = coordinate.replaceAll("[^a-zA-Z]", "").toUpperCase();
        int col = 0;
        for (int i = colStr.length() - 1; i >= 0; i--) {
            char c = colStr.charAt(i);
            col += (c - 'A' + 1) * Math.pow(26, colStr.length() - 1 - i);
        }
        // 解析行数
        int row = Integer.parseInt(coordinate.replaceAll("[^0-9]", ""));
        rowCol[0] = row;
        rowCol[1] = col;
        return rowCol;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @ApiModel
    public static class ColumnType {
        @NotBlank(message = "列名" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @ApiModelProperty(value = "列名", example = "", dataType = "java.lang.String")
        private String column;

        @NotBlank(message = "字段类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @ApiModelProperty(value = "字段类型", example = "", dataType = "java.lang.String")
        private String type;
    }
}
