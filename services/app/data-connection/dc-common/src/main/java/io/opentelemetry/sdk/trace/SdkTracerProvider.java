package io.opentelemetry.sdk.trace;

import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;

public class SdkTracerProvider {
    private SdkTracerProvider() {}

    public static Builder builder() {
        return new Builder();
    }

    public void close() {}

    public static class Builder {
        public Builder addSpanProcessor(SimpleSpanProcessor simpleSpanProcessor) {
            return this;
        }

        public Builder setResource(Object resource) {
            return this;
        }

        public SdkTracerProvider build() {
            return new SdkTracerProvider();
        }
    }
}