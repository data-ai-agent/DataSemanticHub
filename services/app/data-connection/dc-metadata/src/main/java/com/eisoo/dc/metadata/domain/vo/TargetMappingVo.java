package com.eisoo.dc.metadata.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * @Author zdh
 **/
@Data
public class TargetMappingVo {
    @JsonProperty("target_connector")
    private String targetConnector;
    private List<TargetTypeVo> type;
}
