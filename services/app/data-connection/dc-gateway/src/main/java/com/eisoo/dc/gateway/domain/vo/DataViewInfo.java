package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * view info
 */
@Getter
@Setter
public class DataViewInfo {
    @JsonProperty("total_count")
    private int totalCount;

    @JsonProperty("entries")
    private List<Entry> entries;

    private int statusCode;

    @Override
    public String toString() {
        return "DataViewInfo{" +
                "totalCount=" + totalCount +
                ", entries=" + entries +
                ", statusCode=" + statusCode +
                '}';
    }

    @Setter
    @Getter
    static public class Entry {
        @JsonProperty("id")
        private String id;

        @JsonProperty("technical_name")
        private String technicalName;

        @JsonProperty("business_name")
        private String businessName;

        @JsonProperty("type")
        private String type;

        @JsonProperty("datasource_id")
        private String datasourceId;

        @JsonProperty("datasource")
        private String datasource;

        @JsonProperty("datasource_type")
        private String datasourceType;

        @JsonProperty("status")
        private String status;

        @JsonProperty("publish_at")
        private long publishAt;

        @JsonProperty("edit_status")
        private String editStatus;

        @JsonProperty("metadata_form_id")
        private String metadataFormId;

        @JsonProperty("created_at")
        private long createdAt;

        @JsonProperty("created_by")
        private String createdBy;

        @JsonProperty("updated_at")
        private long updatedAt;

        @JsonProperty("updated_by")
        private String updatedBy;

        @JsonProperty("view_source_catalog_name")
        private String viewSourceCatalogName;

        @Override
        public String toString() {
            return "Entry{" +
                    "id='" + id + '\'' +
                    ", technicalName='" + technicalName + '\'' +
                    ", businessName='" + businessName + '\'' +
                    ", type='" + type + '\'' +
                    ", datasourceId='" + datasourceId + '\'' +
                    ", datasource='" + datasource + '\'' +
                    ", datasourceType='" + datasourceType + '\'' +
                    ", status='" + status + '\'' +
                    ", publishAt=" + publishAt +
                    ", editStatus='" + editStatus + '\'' +
                    ", metadataFormId='" + metadataFormId + '\'' +
                    ", createdAt=" + createdAt +
                    ", createdBy='" + createdBy + '\'' +
                    ", updatedAt=" + updatedAt +
                    ", updatedBy='" + updatedBy + '\'' +
                    ", viewSourceCatalogName='" + viewSourceCatalogName + '\'' +
                    '}';
        }
    }
}
