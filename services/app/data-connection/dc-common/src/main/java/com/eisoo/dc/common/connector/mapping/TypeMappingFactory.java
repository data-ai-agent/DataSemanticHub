package com.eisoo.dc.common.connector.mapping;

import com.eisoo.dc.common.connector.mapping.connector.DefaultTypeMapping;
import com.eisoo.dc.common.connector.mapping.connector.VegaTypeMapping;
import com.eisoo.dc.common.constant.CatalogConstant;
import org.springframework.stereotype.Component;

/**
 * @Author zdh
 **/
@Component
public class TypeMappingFactory {

    public TypeMapping getConnector(String connectorName) {
        switch (connectorName) {
            case CatalogConstant.CONNECTOR_VEGA:
                return new VegaTypeMapping();
            default:
                return new DefaultTypeMapping();
        }
    }
}
