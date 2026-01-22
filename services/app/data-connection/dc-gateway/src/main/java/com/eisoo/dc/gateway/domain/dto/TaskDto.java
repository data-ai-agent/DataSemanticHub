package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * @Author paul
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class TaskDto implements Serializable {
    @ApiModelProperty(value = "任务编号", example = "", dataType = "java.lang.String")
    @NotBlank(message = "任务编号" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String taskId;
    @ApiModelProperty(value = "任务编号", example = "", dataType = "java.lang.String")
    @NotBlank(message = "子任务编号" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String subTaskId;
    @ApiModelProperty(value = "任务状态", example = "", dataType = "java.lang.String")
    @NotBlank(message = "任务状态" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String state;
    @ApiModelProperty(value = "错误信息", example = "", dataType = "java.lang.String")
    @NotBlank(message = "错误详情" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String msg;
}
