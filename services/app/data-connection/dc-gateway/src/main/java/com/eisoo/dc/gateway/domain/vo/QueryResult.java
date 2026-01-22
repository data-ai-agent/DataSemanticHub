package com.eisoo.dc.gateway.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;

public class QueryResult {
    @JsonProperty("error")
    private ErrorInfo error;

    public ErrorInfo getError() {
        return error;
    }
}
