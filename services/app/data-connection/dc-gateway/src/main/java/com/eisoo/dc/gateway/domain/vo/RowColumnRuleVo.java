package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RowColumnRuleVo {
    @JsonProperty("total_count")
    private int totalCount;

    @JsonProperty("entries")
    private List<Entry> entries;

    private int statusCode;

    private String message;

    private String ruleSql;

    private String targetSql;

    @Setter
    @Getter
    static public class Entry {
        @JsonProperty("id")
        private String id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("logic_view_id")
        private String formViewId;

        @JsonProperty("logic_view_name")
        private String formViewName;

        @JsonProperty("columns")
        private List<String> columns;

        @JsonProperty("row_filter_clause")
        private String rowRule;

        @Override
        public String toString() {
            return "Entry{" +
                    "id='" + id + '\'' +
                    ", name='" + name + '\'' +
                    ", formViewId='" + formViewId + '\'' +
                    ", formViewName='" + formViewName + '\'' +
                    ", columns=" + columns +
                    ", rowRule='" + rowRule + '\'' +
                    '}';
        }
    }
}
