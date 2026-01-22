package com.eisoo.dc.datasource.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 *
 */
@Data
@Configuration
public class AnyRobotConfigruation {

    @Value("${spring.application.name:data-connection}")
    String serviceName;

    @Value("${spring.application.version:1.0.0}")
    String serviceVersion;

    @Value("${anyrobot.trace.enabled:false}")
    Boolean traceEnabled;

    @Value("${anyrobot.trace.endpoint:}")
    String traceEndpointUrl;
}
