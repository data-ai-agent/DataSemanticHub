package com.eisoo.dc.gateway.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class Ext {
    @JsonProperty("account_type")
    private String accountType;

    @JsonProperty("client_type")
    private String clientType;

    @JsonProperty("login_ip")
    private String loginIp;

    @JsonProperty("udid")
    private String udid;

    @JsonProperty("visitor_type")
    private String visitorType;

    @Override
    public String toString() {
        return "Ext{" +
                "accountType='" + accountType + '\'' +
                ", clientType='" + clientType + '\'' +
                ", loginIp='" + loginIp + '\'' +
                ", udid='" + udid + '\'' +
                ", visitorType='" + visitorType + '\'' +
                '}';
    }
}
