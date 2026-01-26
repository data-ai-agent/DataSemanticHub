package io.opentelemetry.api.trace;

public class TraceFlags {
    private static final TraceFlags DEFAULT = new TraceFlags((byte) 0);
    private static final TraceFlags SAMPLED = new TraceFlags((byte) 1);

    private final byte byteValue;

    private TraceFlags(byte byteValue) {
        this.byteValue = byteValue;
    }

    public static TraceFlags getDefault() {
        return DEFAULT;
    }

    public static TraceFlags fromByte(byte byteValue) {
        return byteValue == 1 ? SAMPLED : DEFAULT;
    }

    public byte asByte() {
        return byteValue;
    }

    public String asHex() {
        return Integer.toHexString(byteValue & 0xFF);
    }
}