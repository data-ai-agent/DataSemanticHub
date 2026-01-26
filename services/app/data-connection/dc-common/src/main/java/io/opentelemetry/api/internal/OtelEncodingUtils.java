package io.opentelemetry.api.internal;

public class OtelEncodingUtils {
    public static boolean isValidBase16Character(char c) {
        return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    public static byte byteFromBase16(char first, char second) {
        return (byte) ((Character.digit(first, 16) << 4) + Character.digit(second, 16));
    }
}