package io.opentelemetry.api.trace;

public interface Tracer {
    Object spanBuilder(String s);
}