package com.eisoo.dc.gateway.domain.vo;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Data;

import java.util.List;

@Data
public class QueryParam {
    private String catalogName;
    private String schema;
    private String table;
    @JsonDeserialize(using = LimitDeserializer.class)
    private String limit;
    @JsonDeserialize(using = GroupLimitDeserializer.class)
    private String groupLimit;
    private List<FieldInfoVo> fields;
    private String topic;
}
