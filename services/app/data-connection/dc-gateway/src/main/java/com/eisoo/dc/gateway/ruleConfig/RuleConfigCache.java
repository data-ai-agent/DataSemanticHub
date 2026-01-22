package com.eisoo.dc.gateway.ruleConfig;

import cn.hutool.core.io.IoUtil;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.gateway.common.CatalogConstant;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.Map;
import java.util.Set;

/**
 * @Author zdh
 **/
@Component
public class RuleConfigCache {

    private static final Logger log = LoggerFactory.getLogger(RuleConfigCache.class);
    private static final Map<String, OperatorConfig> ruleConfigMaps = Maps.newConcurrentMap();
    private static final Set<String> ruleNames = Sets.newConcurrentHashSet();

    private final  String RuleNameList="FilterNode,ProjectNode,AggregationNode,TopNNode,LimitNode,JoinNode,GroupIdNode,MarkDistinctNode,UnionNode";

    @PostConstruct
    @SuppressWarnings("PMD.UnusedPrivateMethod")
    private void init() {

        setRuleNames(RuleNameList);

        ruleNames.stream().forEach(ruleNames -> {
            try {
                String config = getConfigRuleFile();
                if (StringUtils.isNotBlank(config)) {
                    ObjectMapper mapper = new ObjectMapper();
                    RuleConfig ruleConfig = mapper.readValue(config, RuleConfig.class);
                    ruleConfigMaps.put(ruleNames, ruleConfig.getRules().stream().filter(operatorConfig -> operatorConfig.getRuleName().equals(ruleNames)).findFirst().orElse(null));
                }
            } catch (JsonProcessingException e) {
                log.error("catalog rule config cache parse json error");
                throw new AiShuException(ErrorCodeEnum.InternalError, Detail.CATALOG_RULE_CACHE_JSON_ANALYZE_ERROR, Message.MESSAGE_INTERNAL_ERROR);
            }
        });
    }



    private String getConfigRuleFile() {
        InputStream config = getFile(CatalogConstant.RULE_CONFIG_PATH + ".json");
        String ruleConfig = null;
        if (StringUtils.isNotNull(config)) {
            ruleConfig = IoUtil.read(config, Charset.defaultCharset());
        }
        return ruleConfig;
    }

    public OperatorConfig getRuleConfig(String connectorName) {
        return ruleConfigMaps.get(connectorName);
    }

    public Set<String> getRuleNames() {
        return ruleNames;
    }

    private void setRuleNames(String ruleNameList) {
        String[] names = StringUtils.split(ruleNameList, ",");
        for (String name : names) {
            ruleNames.add(name);
        }
    }

    public InputStream getFile(String path) {
        InputStream inputStream = RuleConfigCache.class.getResourceAsStream(path);
        return inputStream;
    }


}
