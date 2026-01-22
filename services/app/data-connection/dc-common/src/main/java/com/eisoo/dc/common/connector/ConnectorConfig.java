package com.eisoo.dc.common.connector;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectorConfig implements Serializable {
    private static final long serialVersionUID = 1L;
    @JsonProperty(value = "connector")
    private String connector;
    @JsonProperty(value = "type")
    private List<TypeConfig> type;
}
