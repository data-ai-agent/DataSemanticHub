package com.eisoo.dc.common.exception.vo;

import lombok.Getter;

@Getter
public class ServiceException extends RuntimeException {
    private final int httpStatus;
    private final String result;

    public ServiceException(int httpStatus, String result) {
        super(result);
        this.httpStatus = httpStatus;
        this.result = result;
    }
}