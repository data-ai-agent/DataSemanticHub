package com.eisoo.dc.gateway.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class ColumnListDto {
    List<ColumnDto> data;
    @Data
    public static class ColumnDto {
        private String fieldName;
        private String fieldTypeName;

        private Integer fieldLength;
        private Integer fieldPrecision;
        private String fieldComment;
    }

}
