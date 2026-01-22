package com.eisoo.dc.gateway.service.info;

import lombok.Data;

import java.util.Map;

/*
 * @Author zdh
 *
 **/
@Data
public class CatalogInfo {
    Map<String, String> properties;
    private String catalogName; // data source instance name
    private String connectorName; // data source type,for example:mysql,oracle

}
