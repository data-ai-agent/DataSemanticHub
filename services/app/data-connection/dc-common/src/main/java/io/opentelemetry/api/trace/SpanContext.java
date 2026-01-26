package io.opentelemetry.api.trace;

public class SpanContext {
    private static final SpanContext INVALID_CONTEXT = new SpanContext("", "", TraceFlags.getDefault(), TraceState.getDefault());

    private final String traceId;
    private final String spanId;
    private final TraceFlags traceFlags;
    private final TraceState traceState;

    private SpanContext(String traceId, String spanId, TraceFlags traceFlags, TraceState traceState) {
        this.traceId = traceId;
        this.spanId = spanId;
        this.traceFlags = traceFlags;
        this.traceState = traceState;
    }

    public static SpanContext getInvalid() {
        return INVALID_CONTEXT;
    }

    public static SpanContext create(String traceId, String spanId, TraceFlags traceFlags, TraceState traceState) {
        return new SpanContext(traceId, spanId, traceFlags, traceState);
    }

    public static SpanContext createFromRemoteParent(String traceId, String spanId, TraceFlags traceFlags, TraceState traceState) {
        return new SpanContext(traceId, spanId, traceFlags, traceState);
    }

    public String getTraceId() {
        return traceId;
    }

    public String getSpanId() {
        return spanId;
    }

    public TraceFlags getTraceFlags() {
        return traceFlags;
    }

    public TraceState getTraceState() {
        return traceState;
    }

    public boolean isValid() {
        return traceId != null && spanId != null && !traceId.isEmpty() && !spanId.isEmpty();
    }
}