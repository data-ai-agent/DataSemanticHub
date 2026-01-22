package com.eisoo.dc.common.connector;

import cn.hutool.core.io.IoUtil;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.common.constant.CatalogConstant;
import com.eisoo.dc.common.constant.Message;
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
import com.eisoo.dc.common.enums.ConnectorEnums;

/**
 * @Author zdh
 **/
@Component
public class ConnectorConfigCache {

    private static final Logger log = LoggerFactory.getLogger(ConnectorConfigCache.class);
    private static final Map<String, ConnectorConfig> connectorConfigMaps = Maps.newConcurrentMap();
    public static final Set<String> vegaTypes = Sets.newConcurrentHashSet();
    private static final Set<String> connectorNames = ConnectorEnums.getAllConnectors();

    @PostConstruct
    @SuppressWarnings("PMD.UnusedPrivateMethod")
    private void init() {
        log.info("connectorNames: {}", connectorNames);
        try {
            for (String connectorName : connectorNames) {
                String config = getConfigFile(connectorName);
                if (StringUtils.isNotBlank(config)) {
                    ObjectMapper mapper = new ObjectMapper();
                    ConnectorConfig connectorConfig = mapper.readValue(config, ConnectorConfig.class);
                    connectorConfig.getType().forEach(typeConfig -> {
                        if (!typeConfig.getVegaType().isEmpty()) {
                            vegaTypes.add(typeConfig.getVegaType());
                        }
                    });
                    connectorConfigMaps.put(connectorName, connectorConfig);
                }
            }
            log.info("-----------------------------------loadConnectorConfigs success---------------------------------------");
        } catch (Exception e) {
            log.error("Failed to load connector configs from directory: {}", CatalogConstant.CONNECTOR_CONFIG_PATH, e);
            throw new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
    }


    private String getConfigFile(String connectorName) {
        InputStream config = getFile(CatalogConstant.CONNECTOR_CONFIG_PATH + connectorName + ".json");
        String connectorConfig = null;
        if (StringUtils.isNotNull(config)) {
            connectorConfig = IoUtil.read(config, Charset.defaultCharset());
        }
        return connectorConfig;
    }

    public ConnectorConfig getConnectorConfig(String connectorName) {
        return connectorConfigMaps.get(connectorName);
    }

    public InputStream getFile(String path) {
        return ConnectorConfigCache.class.getResourceAsStream(path);
    }


}
