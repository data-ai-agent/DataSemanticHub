package cn.aishu.telemetry.log;

/**
 * 爱数内部Link类的替代实现，用于编译兼容
 */
public class Link {
    private String traceId;
    private String spanId;

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getSpanId() {
        return spanId;
    }

    public void setSpanId(String spanId) {
        this.spanId = spanId;
    }
}