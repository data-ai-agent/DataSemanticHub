package com.eisoo.dc.common.connector.mapping;

import com.eisoo.dc.common.connector.TypeConfig;

import java.util.Map;

public interface TypeMapping {

    Map<String,Long> getTypeMapping(TypeConfig config, Long columnSize, String connectorName);
}
