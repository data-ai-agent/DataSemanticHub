package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * token info
 */
@Getter
@Setter
public class AuthTokenInfo {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("expires_in")
    private int expiresIn;

    @JsonProperty("scope")
    private String scope;

    @JsonProperty("token_type")
    private String tokenType;

    private String errorMsg;

    private int statusCode;

    @Override
    public String toString() {
        return "AuthTokenInfo{" +
                "accessToken='" + accessToken + '\'' +
                ", expiresIn=" + expiresIn +
                ", scope='" + scope + '\'' +
                ", tokenType='" + tokenType + '\'' +
                ", errorMsg='" + errorMsg + '\'' +
                ", statusCode=" + statusCode +
                '}';
    }
}
