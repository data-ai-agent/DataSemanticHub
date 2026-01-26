package io.opentelemetry.api.trace;

import io.opentelemetry.context.Context;

public interface SpanBuilder {
    SpanBuilder setParent(Context context);

    SpanBuilder setNoParent();

    SpanBuilder setSpanKind(SpanKind spanKind);

    Span startSpan();
}