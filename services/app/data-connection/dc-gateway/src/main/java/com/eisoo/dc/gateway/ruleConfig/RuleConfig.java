package com.eisoo.dc.gateway.ruleConfig;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @Author paul
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RuleConfig implements Serializable {
    private static final long serialVersionUID = 1L;
    @JsonProperty("rules")
    private List<OperatorConfig> rules;
}
