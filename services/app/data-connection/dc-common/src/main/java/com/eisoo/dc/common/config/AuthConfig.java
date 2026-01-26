package com.eisoo.dc.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * 认证配置类
 */
@Data
@Component
@Configuration
@ConfigurationProperties(prefix = "auth")
public class AuthConfig {
    
    private Token token = new Token();
    
    @Data
    public static class Token {
        private Validation validation = new Validation();
        
        @Data
        public static class Validation {
            /**
             * 是否启用token验证，默认为true
             */
            private boolean enabled = true;
            
            public boolean isEnabled() {
                return enabled;
            }
            
            public void setEnabled(boolean enabled) {
                this.enabled = enabled;
            }
        }
    }
}