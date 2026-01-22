package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.Arrays;

/**
 * token info
 */
@Getter
@Setter
public class IntrospectInfo {
    @JsonProperty("active")
    private boolean active;

    @JsonProperty("scope")
    private String scope;

    @JsonProperty("client_id")
    private String clientId;

    @JsonProperty("sub")
    private String sub;

    @JsonProperty("exp")
    private int exp;

    @JsonProperty("iat")
    private int iat;

    @JsonProperty("nbf")
    private int nbf;

    @JsonProperty("aud")
    private String[] aud;

    @JsonProperty("iss")
    private String iss;

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("token_use")
    private String tokenUse;

    @JsonProperty("ext")
    private Ext ext;

    @Override
    public String toString() {
        return "IntrospectInfo{" +
                "active=" + active +
                ", scope='" + scope + '\'' +
                ", clientId='" + clientId + '\'' +
                ", sub='" + sub + '\'' +
                ", exp=" + exp +
                ", iat=" + iat +
                ", nbf=" + nbf +
                ", aud=" + Arrays.toString(aud) +
                ", iss='" + iss + '\'' +
                ", tokenType='" + tokenType + '\'' +
                ", tokenUse='" + tokenUse + '\'' +
                ", ext=" + ext +
                '}';
    }
}
