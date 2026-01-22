package com.eisoo.dc.gateway.configuration;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 *
 */
@Data
@Configuration
public class GatewayAnyRobotConfigruation {

    @Value("${spring.application.name:virtual-engine}")
    String serviceName;

    @Value("${spring.application.version:1.0.0}")
    String serviceVersion;

    @Value("${anyrobot.trace.enabled:false}")
    Boolean traceEnabled;

    @Value("${anyrobot.trace.endpoint:}")
    String traceEndpointUrl;
}
