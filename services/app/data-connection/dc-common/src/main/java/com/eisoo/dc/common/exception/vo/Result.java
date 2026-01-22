package com.eisoo.dc.common.exception.vo;

import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.util.CommonUtil;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Optional;

/**
 *
 */
@Data
@ApiModel(value = "接口返回对象", description = "接口返回对象")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1;

    /**
     * 返回代码
     */
    @ApiModelProperty(value = "返回代码")
    private String code;

    /**
     * 返回消息
     */
    @ApiModelProperty(value = "返回消息")
    private String description = "";

    /**
     * 返回消息
     */
    @ApiModelProperty(value = "总条数")
    private Long totalCount;

    /**
     * 触发原因
     */
    @ApiModelProperty(value = "错误细节")
    private Object detail;

    /**
     * 解决对策
     */
    @ApiModelProperty(value = "解决对策")
    private String solution = "";

    /**
     * 返回数据对象
     */
    @ApiModelProperty(value = "返回数据对象")
    private T data;


    private static String serviceName;

    public static void setServiceName(String serviceName) {
        Result.serviceName = serviceName;

    }


    /**
     * 操作成功返回消息、消息码和数据对象
     *
     * @return
     */
    public static <T> Result<T> success() {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getDescription());
        return r;
    }

    /**
     * 操作成功返回消息、消息码和数据对象
     *
     * @param data
     * @return
     */
    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getDescription());
        r.setData(data);
        return r;
    }

    /**
     * 操作成功返回消息、消息码和数据对象】数据对象总条数
     *
     * @param data
     * @return
     */
    public static <T> Result<T> success(T data, Long totalCount) {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getDescription());
        r.setData(data);
        r.setTotalCount(totalCount);
        return r;
    }

    /**
     * @param e
     * @return
     */
    public static ResponseEntity<String> error(ServiceException e) {
        return ResponseEntity.status(e.getHttpStatus()).body(e.getResult());
    }

    public static ResponseEntity<Result> error(AiShuException e) {
        return Result.error(e, null);
    }


    public static ResponseEntity<Result> error(AiShuException e, Object data) {
        return Result.error(e.getHttpStatus(), e, data);
    }


    public static ResponseEntity<Result> error(HttpStatus httpStatus, AiShuException e, Object data) {
        Result r = new Result();
        r.setCode(buildErrorCode(e));
        r.setDescription(Optional.ofNullable(e.getDescription()).orElse(""));
        r.setDetail(Optional.ofNullable(e.getErrorDetails()).orElse(new HashMap<>()));
        r.setSolution(Optional.ofNullable(e.getSolution()).orElse(""));
        r.setData(data);
        return ResponseEntity.status(httpStatus)
                .body(r);
    }

    private static String buildErrorCode(AiShuException e) {
        if (CommonUtil.isEmpty(serviceName)) {
            return e.getErrorCode();
        }
        return String.format("%s.%s", serviceName, e.getErrorCode());

    }
    public static ResponseEntity<Result> internalServerError(AiShuException e) {
        Result r = new Result();
        r.setCode(e.getErrorCode());
        r.setDescription(Optional.ofNullable(e.getDescription()).orElse(""));
        r.setDetail(Optional.ofNullable(e.getErrorDetails()).orElse(new HashMap<>()));
        r.setSolution(Optional.ofNullable(e.getSolution()).orElse(""));
        r.setData(null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(r);
    }

}
