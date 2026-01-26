package io.opentelemetry.api.common;

public class Attributes {
    public static Attributes of(Object... keyValues) {
        return new Attributes();
    }
}