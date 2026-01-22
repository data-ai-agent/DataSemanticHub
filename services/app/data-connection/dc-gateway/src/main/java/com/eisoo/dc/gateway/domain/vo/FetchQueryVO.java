package com.eisoo.dc.gateway.domain.vo;

import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.deserializer.IntegerDeserializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author Tian.lan
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FetchQueryVO {
    @JsonDeserialize(using = IntegerDeserializer.class)
    private Integer type;
    @JsonProperty("catalog_name")
    private String catalogName;
    @JsonProperty("table_name")
    private List<String> tableName;
    private JSONObject dsl;
    private String sql;
    @JsonDeserialize(using = IntegerDeserializer.class)
    @JsonProperty("timeout")
    private Integer timeOut;
    @JsonDeserialize(using = IntegerDeserializer.class)
    @JsonProperty("batch_size")
    private Integer batchSize;

}
