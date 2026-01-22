package com.eisoo.dc.datasource.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ConnectorVo {
    @JsonProperty("type")
    private String type;
    @JsonProperty("olk_connector_name")
    private String olkConnectorName;
    @JsonProperty("show_connector_name")
    private String showConnectorName;
    @JsonProperty("connect_protocol")
    private String connectProtocol;
}
