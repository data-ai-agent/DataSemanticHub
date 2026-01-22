package com.eisoo.dc.gateway.domain.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CatalogTypeDto {
    @JsonProperty("catalogName")
    private String catalogName;
    @JsonProperty("connectorName")
    private String connectorName;
}
