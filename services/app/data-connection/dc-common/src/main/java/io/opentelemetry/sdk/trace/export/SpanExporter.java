package io.opentelemetry.sdk.trace.export;

import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.trace.data.SpanData;

import java.util.Collection;

public interface SpanExporter {
    CompletableResultCode export(Collection<SpanData> spans);

    CompletableResultCode flush();

    CompletableResultCode shutdown();
}