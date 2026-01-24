package cn.aishu.telemetry.log.config;

import cn.aishu.exporter.common.output.HttpSender;

/**
 * 爱数内部SamplerLogConfig的替代实现，用于编译兼容
 */
public class SamplerLogConfig {
    private static Level level = Level.INFO;
    private static HttpSender sender;

    public static void setLevel(Level level) {
        SamplerLogConfig.level = level;
    }

    public static void setSender(HttpSender sender) {
        SamplerLogConfig.sender = sender;
    }

    public static Level getLevel() {
        return level;
    }

    public static HttpSender getSender() {
        return sender;
    }
}