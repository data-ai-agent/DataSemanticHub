package com.eisoo.dc.gateway.handler;

import com.eisoo.dc.common.exception.vo.Result;
import com.eisoo.dc.common.exception.vo.ServiceException;
import com.eisoo.dc.common.vo.CheckErrorVo;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.gateway.util.AiShuUtil;
import com.eisoo.dc.gateway.util.Results;
import com.fasterxml.jackson.databind.JsonMappingException.Reference;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;

import javax.validation.ConstraintViolationException;
import java.util.List;

/**
 * 全局异常处理类，捕获异常，并根据异常返回错误信息。
 */
@ControllerAdvice
@Slf4j
public class GatewayGlobalExceptionHandler {

//    @PostConstruct
//    public void init() {
//        Result.setServiceName("VirtualizationEngine");
//    }

    /**
     * 处理自定义的业务异常，程序员主动抛出BizException异常会被这个方法捕获
     */
    @ExceptionHandler(value = AiShuException.class)
    @ResponseBody
    public ResponseEntity<Result> AsExceptionHandler(AiShuException e) {
        log.debug("发生异常:", e);
        return Result.error(e);
    }
    @ExceptionHandler(value = ServiceException.class)
    @ResponseBody
    public ResponseEntity<String> AsExceptionHandler(ServiceException e) {
        log.debug("发生异常:", e);
        return Result.error(e);
    }


    /**
     * POST请求体参数校验，使用hibernate-validator
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = BindException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(BindException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, detail, Message.MESSAGE_PARAM_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = ConstraintViolationException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(ConstraintViolationException e) {
        log.debug("发生异常:", e);
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, e.getMessage(), Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = MissingPathVariableException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingPathVariableException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, detail, Message.MESSAGE_PATHVARIABLE_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = MaxUploadSizeExceededException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MaxUploadSizeExceededException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, detail, Message.MESSAGE_MaxUploadSizeExceededException));
    }

    @ExceptionHandler(value = MultipartException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MultipartException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, detail, Message.MESSAGE_MultipartException));
    }

    /**
     * Query 参数（Request Parameter） 校验
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = MissingServletRequestParameterException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingServletRequestParameterException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new AiShuException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }

    /**
     * part 参数（request part） 校验
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = MissingServletRequestPartException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingServletRequestPartException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new AiShuException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }


    /**
     * 请求头参数异常
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = HttpMediaTypeException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(HttpMediaTypeException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new AiShuException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }


    /**
     * 处理请求体为空或者参数不正确异常
     */
    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(HttpMessageNotReadableException e) {
        log.debug("发生异常:", e);
        Throwable cause = e.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException errorEntity = (InvalidFormatException) cause;
            List<Reference> pathList = errorEntity.getPath();
            List<CheckErrorVo> detail = Lists.newArrayList();
            detail.add(new CheckErrorVo(pathList.get(0).getFieldName(), String.format(Detail.FIELD_ERROR, pathList.get(0).getFieldName(), errorEntity.getValue())));
            return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, detail, Message.MESSAGE_PARAM_ERROR_SOLUTION));
        }
        return Result.error(new AiShuException(ErrorCodeEnum.InvalidParameter, null, Message.MESSAGE_PARAM_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = MethodArgumentTypeMismatchException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MethodArgumentTypeMismatchException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new AiShuException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }


    /**
     * 其他运行时异常
     */
    @ExceptionHandler(value = RuntimeException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(RuntimeException e) {
        log.warn("发生异常,原因是:", e);
        return Results.internalServerError(new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR));
    }

    @ExceptionHandler(value = DataAccessResourceFailureException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(DataAccessResourceFailureException e) {
        log.warn("发生异常,原因是:", e);
        return Results.internalServerError(new AiShuException(ErrorCodeEnum.DBError, Detail.DB_ERROR, Message.MESSAGE_DATABASE_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = NoHandlerFoundException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(NoHandlerFoundException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new AiShuException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }

    @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(HttpRequestMethodNotSupportedException e) {
        log.debug("发生异常:", e);
        String solution = String.format(Message.MESSAGE_REQUEST_METHOD_UNSUPPORTED_SOLUTION, e.getMethod(), e.getSupportedHttpMethods());
        return Result.error(new AiShuException(ErrorCodeEnum.HttpRequestMethodNotSupportedException, null, solution));
    }

    @ExceptionHandler(value = org.springframework.dao.DuplicateKeyException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(org.springframework.dao.DuplicateKeyException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new AiShuException(ErrorCodeEnum.Duplicated, detail, Message.MESSAGE_Duplicated_SOLUTION));
    }

    @ExceptionHandler(value = org.springframework.dao.DeadlockLoserDataAccessException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(org.springframework.dao.DeadlockLoserDataAccessException e) {
        log.debug("发生异常:", e);
        return Result.error(new AiShuException(ErrorCodeEnum.SystemBusy,e.getMessage(), Message.MESSAGE_SYSTEM_BUSY));
    }

    /**
     * 处理其他异常
     */
    @ExceptionHandler(value = Exception.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(Exception e) {
        log.error("发生异常:", e);
        return Result.error(new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR));
    }

    /**
     * 根据异常类型不同，返回不同的异常细节描述
     */
    private List<CheckErrorVo> getErrorDetailInfo(Exception e) {
        List<CheckErrorVo> detail = Lists.newArrayList();
        String key = "";
        String message = "";
        if (e instanceof MethodArgumentTypeMismatchException) {
            MethodArgumentTypeMismatchException errorEntity = (MethodArgumentTypeMismatchException) e;
            key = errorEntity.getName();
            message = String.format("参数%s的值%s与接口要求类型不匹配", errorEntity.getName(), errorEntity.getValue());
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof NoHandlerFoundException) {
            NoHandlerFoundException errorEntity = (NoHandlerFoundException) e;
            key = errorEntity.getRequestURL();
            message = "未找到该URL对应的处理方法";
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof BindException) {
            List<FieldError> allErrors = ((BindException) e).getBindingResult().getFieldErrors();
            for (FieldError errorEntity : allErrors) {
                key = AiShuUtil.camelToUnderline(errorEntity.getField());
                message = errorEntity.getDefaultMessage();
                detail.add(new CheckErrorVo(key, message));
            }
        } else if (e instanceof MissingServletRequestParameterException) {
            MissingServletRequestParameterException errorEntity = (MissingServletRequestParameterException) e;
            key = errorEntity.getParameterName();
            message = Message.MESSAGE_INPUT_NOT_EMPTY;
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof MissingServletRequestPartException) {
            MissingServletRequestPartException errorEntity = (MissingServletRequestPartException) e;
            key = errorEntity.getRequestPartName();
            message = Message.MESSAGE_INPUT_NOT_EMPTY;
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof org.springframework.dao.DuplicateKeyException) {
            key = ErrorCodeEnum.Duplicated.getErrorCode();
            message = ErrorCodeEnum.Duplicated.getDescription();
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof org.springframework.dao.DeadlockLoserDataAccessException) {
            key = ErrorCodeEnum.DeadlockException.getErrorCode();
            message = ErrorCodeEnum.DeadlockException.getDescription();
            detail.add(new CheckErrorVo(key, message));
        } 
        return detail;
    }
}
