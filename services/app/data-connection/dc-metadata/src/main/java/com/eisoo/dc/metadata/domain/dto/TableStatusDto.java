package com.eisoo.dc.metadata.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * @author Tian.lan
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TableStatusDto implements Serializable {
    private String id;
    @JsonProperty("data ")
    private List<TableStatus> tables;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TableStatus {
        @JsonProperty("table_id ")
        private String tableId;
        @JsonProperty("table_name")
        private String tableName;
        @JsonProperty("status")
        private String status;
        @JsonProperty("start_time")
        private Date startTime;
    }
}
