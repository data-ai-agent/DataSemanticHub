package io.opentelemetry.sdk.trace.data;

import io.opentelemetry.api.trace.SpanContext;

public interface SpanData {
    SpanContext getSpanContext();
}