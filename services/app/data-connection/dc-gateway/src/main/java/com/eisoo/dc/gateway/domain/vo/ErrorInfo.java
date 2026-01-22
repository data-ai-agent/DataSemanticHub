package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * error domain
 */
public class ErrorInfo {
    @JsonProperty("message")
    private String message;

    @JsonProperty("errorCode")
    private int errorCode;

    @JsonProperty("errorName")
    private String errorName;

    @JsonProperty("semanticErrorName")
    private String semanticErrorName;

    @JsonProperty("errorType")
    private String errorType;

    @JsonProperty("errorLocation")
    private ErrorLocation errorLocation;

    private String nextUrl;

    private  String result;

    private String state;

    private String data;

    public static class ErrorLocation {
        @JsonProperty("lineNumber")
        private int lineNumber;

        @JsonProperty("columnNumber")
        private int columnNumber;

        public int getLineNumber() {
            return lineNumber;
        }

        public int getColumnNumber() {
            return columnNumber;
        }
    }

    public String getMessage() {
        return message;
    }


    public void setMessage(String message){
        this.message=message;
    }

    public int getErrorCode() {
        return errorCode;
    }

    public String getErrorName() {
        return errorName;
    }

    public String getSemanticErrorName() {
        return semanticErrorName;
    }

    public String getErrorType() {
        return errorType;
    }

    public ErrorLocation getErrorLocation() {
        return errorLocation;
    }

    public String getNextUrl(){return nextUrl;}

    public void setNextUrl(String nextUrl){
        this.nextUrl=nextUrl;
    }

    public String getResult(){return result;}

    public void setResult(String result){
        this.result=result;
    }

    public String getState(){return state;}

    public void setState(String state){
        this.state=state;
    }

    public String getData(){return data;}

    public void setData(String data) {
        this.data = data;
    }


}
