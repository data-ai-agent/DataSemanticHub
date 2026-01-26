package io.opentelemetry.context;

public class Context {
    private static final Context ROOT = new Context();

    public static Context current() {
        return ROOT;
    }
}