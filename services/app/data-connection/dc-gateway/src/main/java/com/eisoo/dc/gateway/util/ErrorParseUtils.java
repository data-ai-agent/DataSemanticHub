package com.eisoo.dc.gateway.util;

import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.gateway.common.Message;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ErrorParseUtils {

    public static AiShuException finerErrorInfo(String errorMessage, String errorName) {
        if (errorMessage.contains("Too many queued queries for")) {
            return new AiShuException(ErrorCodeEnum.SystemBusy, errorMessage, Message.MESSAGE_SYSTEM_BUSY);
        }

        Pattern pattern = Pattern.compile("View (\\S+) is stale; it must be re-created");
        Matcher matcher = pattern.matcher(errorMessage);
        if (matcher.find()) {
            return new AiShuException(ErrorCodeEnum.TableFieldError, errorMessage, Message.MESSAGE_QUERY_VIEW_STALE_SOLUTION);
        }

        pattern = Pattern.compile("(Table|Schema|View) (\\S+) does not exist");
        matcher = pattern.matcher(errorMessage);
        if (matcher.find()) {
            // matcher.group(1) 是 "Table" 或 "Schema"
            String type = matcher.group(1);
            switch (type){
                case "Schema":
                    return new AiShuException(ErrorCodeEnum.SchemaNotExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
                case "Table":
                    return new AiShuException(ErrorCodeEnum.TableNotExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
                case "View":
                    return new AiShuException(ErrorCodeEnum.ViewNotExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            }
        }

        pattern = Pattern.compile("(Table|Schema|View) (\\S+) already exists");
        matcher = pattern.matcher(errorMessage);
        if (matcher.find()) {
            // matcher.group(1) 是 "Table" 或 "Schema"
            String type = matcher.group(1);
            switch (type){
                case "Schema":
                    return new AiShuException(ErrorCodeEnum.SchemaExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
                case "Table":
                    return new AiShuException(ErrorCodeEnum.TableExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
                case "View":
                    return new AiShuException(ErrorCodeEnum.ViewExist, errorMessage, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            }
        }
        return new AiShuException(ErrorCodeEnum.SqlSyntaxError, errorMessage, errorName);
    }
}
