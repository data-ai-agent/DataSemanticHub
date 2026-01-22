package com.eisoo.dc.common.exception.vo;

import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 自定义异常
 */
@Getter
public class AiShuException extends RuntimeException {
    /**
     * http状态码
     */
    private HttpStatus httpStatus;

    /**
     * 错误码
     */
    private String errorCode;

    /**
     * 错误描述
     */
    private String description;

    /**
     * 错误细节
     */
    private Object errorDetails;

    /**
     * 错误处理建议
     */
    private String solution;

    /**
     * 错误信息地址
     */
    private String errorLink;

    public AiShuException(HttpStatus httpStatus, String errorCode, String description, Object errorDetails, String solution) {
        super(String.valueOf(description));
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
        this.description = description;
        this.errorDetails = errorDetails;
        this.solution = solution;
        if (this.solution == null) {
            this.solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        }
    }

    public AiShuException(ErrorCodeEnum err) {
        this(err.getHttpStatus(), err.getErrorCode(), err.getDescription(), err.getErrorDetails(), err.getSolution());
    }

    public AiShuException(ErrorCodeEnum err, String detail) {
        this(err.getHttpStatus(), err.getErrorCode(), err.getDescription(), detail, err.getSolution());
    }

    public AiShuException(ErrorCodeEnum err, Object detail, String solution) {
        this(err.getHttpStatus(), err.getErrorCode(), err.getDescription(), detail, solution);
    }

    public AiShuException(ErrorCodeEnum err, String description, Object detail, String solution) {
        this(err.getHttpStatus(), err.getErrorCode(), description, detail, solution);
    }

    public AiShuException setSolution(String solution) {
        this.solution=solution;
        return this;
    }

    public AiShuException setDescription(String description) {
        this.description=description;
        return this;
    }


    public AiShuException(ErrorCodeEnum err, Throwable cause) {
        super(err.getDescription(), cause);
        this.httpStatus = err.getHttpStatus();
        this.errorCode = err.getErrorCode();
        this.description = err.getDescription();
        this.solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
    }


    @Override
    public Throwable fillInStackTrace() {
        return this;
    }

}
