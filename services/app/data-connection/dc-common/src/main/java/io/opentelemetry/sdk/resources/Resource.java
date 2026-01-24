package io.opentelemetry.sdk.resources;

public class Resource {
    private static final Resource EMPTY = new Resource();

    public static Resource getDefault() {
        return EMPTY;
    }

    public Resource merge(Resource serviceNameResource) {
        return this;
    }

    public static Resource create(Object attributes) {
        return new Resource();
    }
}