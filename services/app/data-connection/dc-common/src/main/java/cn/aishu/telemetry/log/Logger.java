package cn.aishu.telemetry.log;

import cn.aishu.telemetry.log.config.SamplerLogConfig;

import java.util.Map;

/**
 * 爱数内部Logger的替代实现，用于编译兼容
 */
public interface Logger {
    void trace(String message, Attributes attributes, Link link, Service service);
    void debug(String message, Attributes attributes, Link link, Service service);
    void info(String message, Attributes attributes, Link link, Service service);
    void warn(String message, Attributes attributes, Link link, Service service);
    void error(String message, Attributes attributes, Link link, Service service);
}