package com.eisoo.dc.common.metadata.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * @author Tian.lan
 */
@Data
@AllArgsConstructor
public class OpenSearchEntity {
    private String health;
    private String status;
    private String uuid;
    private String pri;
    private String rep;
    @JsonAlias("docs.count")
    private String docsCount;
    @JsonAlias("docs.deleted")
    private String docsDeleted;
    @JsonAlias("store.size")
    private String storeSize;
    @JsonAlias("pri.store.size")
    private String priStoreSize;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OpenSearchField {
        @JsonAlias("name")
        private String name;
        @JsonAlias("type")
        private String type;
        @JsonAlias("fields.keyword.type")
        private String keywordType;
        @JsonAlias("fields.keyword.ignore_above")
        private Integer ignoreAbove;
        @JsonAlias("norms")
        private Boolean norms;
        @JsonAlias("analyzer")
        private String analyzer;
    }

}