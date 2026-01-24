package io.opentelemetry.sdk.trace.export;

import io.opentelemetry.sdk.trace.SpanProcessor;

public class SimpleSpanProcessor implements SpanProcessor {
    private SimpleSpanProcessor() {}

    public static SimpleSpanProcessor create(SpanExporter exporter) {
        return new SimpleSpanProcessor();
    }
}