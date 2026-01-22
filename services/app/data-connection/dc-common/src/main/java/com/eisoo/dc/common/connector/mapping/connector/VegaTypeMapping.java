package com.eisoo.dc.common.connector.mapping.connector;

import com.eisoo.dc.common.connector.TypeConfig;
import com.eisoo.dc.common.connector.mapping.TypeMapping;
import com.google.common.collect.Maps;

import java.util.Map;

/**
 * @Author zdh
 **/
public class VegaTypeMapping implements TypeMapping {
    @Override
    public Map<String, Long> getTypeMapping(TypeConfig targetType, Long columnSize, String connectorName) {
        Map<String, Long> type = Maps.newHashMap();
        if (targetType.getVegaType().equals("varchar")) {
            type.put(targetType.getVegaType(), columnSize);
        } else if (targetType.getVegaType().equals("decimal")) {
            type.put(targetType.getVegaType(), columnSize);
        } else {
            type.put(targetType.getVegaType(), null);
        }
        return type;
    }
}
