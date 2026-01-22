package com.eisoo.dc.gateway.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class FieldInfoVo {
    @JsonProperty("key")
    public String key;
    @JsonProperty("value")
    public List<String> value;
    @JsonProperty("type")
    public String type;

}
