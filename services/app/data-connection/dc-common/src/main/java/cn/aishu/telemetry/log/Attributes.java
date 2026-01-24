package cn.aishu.telemetry.log;

import java.util.Map;

/**
 * 爱数内部Attributes类的替代实现，用于编译兼容
 */
public class Attributes {
    private Map<String, Object> attributes;

    public Attributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
}