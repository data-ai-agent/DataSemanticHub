package com.eisoo.dc.common.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 *
 * @author Tian.lan
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IndexBaseClientCfg {
    private String protocol;
    private String host;
    private Integer port;
    private String userName;
    private String passWord;
}
