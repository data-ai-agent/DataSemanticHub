package io.opentelemetry.sdk;

import io.opentelemetry.api.trace.Tracer;

public class OpenTelemetrySdk {
    private static OpenTelemetrySdk instance;

    public static OpenTelemetrySdk.Builder builder() {
        return new Builder();
    }

    public Tracer getTracer(String instrumentationName) {
        return new NoOpTracer();
    }

    public static class Builder {
        public OpenTelemetrySdk build() {
            if (instance == null) {
                instance = new OpenTelemetrySdk();
            }
            return instance;
        }
    }

    private static class NoOpTracer implements Tracer {
        @Override
        public Object spanBuilder(String s) {
            return null;
        }
    }
}