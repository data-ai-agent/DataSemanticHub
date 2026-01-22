package com.eisoo.dc.common.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HttpResInfo {

    private int httpStatus;

    private String result;

    public HttpResInfo(int httpStatus, String result) {
        this.httpStatus = httpStatus;
        this.result = result;
    }
}
