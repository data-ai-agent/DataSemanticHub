package io.opentelemetry.api.trace;

public class TraceState {
    private static final TraceState DEFAULT = new TraceState();

    private TraceState() {}

    public static TraceState getDefault() {
        return DEFAULT;
    }

    public boolean isEmpty() {
        return true;
    }
}