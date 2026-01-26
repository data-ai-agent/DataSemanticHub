package io.opentelemetry.api.internal;

public class TemporaryBuffers {
    public static char[] chars(int length) {
        return new char[length];
    }
}