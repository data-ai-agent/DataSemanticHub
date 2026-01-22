package com.eisoo.dc.gateway.ruleConfig;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

/**
 * @Author paul
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OperatorConfig {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String ruleName;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<String> operators;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String description;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String defaultBehavior;
}
