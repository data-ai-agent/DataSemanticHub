package io.opentelemetry.api.trace;

import io.opentelemetry.context.Context;

public interface Span {
    static Span fromContext(Context context) {
        return new NoOpSpan();
    }

    Span setStatus(StatusCode statusCode, String s);

    void end();

    SpanContext getSpanContext();

    static SpanBuilder builder() {
        return new NoOpSpanBuilder();
    }

    static Span wrap(SpanContext spanContext) {
        return new NoOpSpan();
    }

    Context storeInContext(Context context);

    // 添加 setAttribute 方法
    Span setAttribute(String key, String value);

    class NoOpSpan implements Span {
        @Override
        public Span setStatus(StatusCode statusCode, String s) {
            return this;
        }

        @Override
        public void end() {}

        @Override
        public SpanContext getSpanContext() {
            return SpanContext.getInvalid();
        }

        @Override
        public Context storeInContext(Context context) {
            return context;
        }

        @Override
        public Span setAttribute(String key, String value) {
            return this;
        }
    }

    class NoOpSpanBuilder implements SpanBuilder {
        @Override
        public SpanBuilder setParent(Context context) {
            return this;
        }

        @Override
        public SpanBuilder setNoParent() {
            return this;
        }

        @Override
        public SpanBuilder setSpanKind(SpanKind spanKind) {
            return this;
        }

        @Override
        public Span startSpan() {
            return new NoOpSpan();
        }
    }
}