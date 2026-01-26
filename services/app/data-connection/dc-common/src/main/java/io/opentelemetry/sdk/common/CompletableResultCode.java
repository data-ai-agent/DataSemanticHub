package io.opentelemetry.sdk.common;

public class CompletableResultCode {
    private static final CompletableResultCode SUCCESS_RESULT = new CompletableResultCode(true);
    private final boolean isSuccess;

    private CompletableResultCode(boolean isSuccess) {
        this.isSuccess = isSuccess;
    }

    public static CompletableResultCode ofSuccess() {
        return SUCCESS_RESULT;
    }

    public static CompletableResultCode ofFailure() {
        return new CompletableResultCode(false);
    }

    public CompletableResultCode succeed() {
        return this;
    }

    public boolean isSuccess() {
        return isSuccess;
    }
}