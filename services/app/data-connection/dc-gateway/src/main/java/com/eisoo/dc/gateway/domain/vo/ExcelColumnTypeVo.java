package com.eisoo.dc.gateway.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * @Author exx
 **/
@Data
public class ExcelColumnTypeVo {
    private Long excelTableConfigId;
    private String tableName;
    private List<ColumnType> columnTypes;

    @Data
    public static class ColumnType {
        private Long id;
        private String columnName;
        private String columnComment;
        private String type;
        private int orderNo;
    }
}
