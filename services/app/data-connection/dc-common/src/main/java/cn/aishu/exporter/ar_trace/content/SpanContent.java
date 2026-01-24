package cn.aishu.exporter.ar_trace.content;

import io.opentelemetry.sdk.trace.data.SpanData;

/**
 * 爱数内部SpanContent的替代实现，用于编译兼容
 */
public class SpanContent {
    private SpanData spanData;

    public SpanContent(SpanData spanData) {
        this.spanData = spanData;
    }

    public SpanData getSpanData() {
        return spanData;
    }

    public void setSpanData(SpanData spanData) {
        this.spanData = spanData;
    }
}