package com.eisoo.dc.metadata.domain.dto;

import com.eisoo.dc.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class SourceTypeDto {
    @ApiModelProperty(value = "原始数据类型索引", example = "", dataType = "java.lang.Integer")
    @NotBlank(message = "原始数据类型索引" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private Integer index;
    @ApiModelProperty(value = "原始数据类型", example = "", dataType = "java.lang.String")
    @NotBlank(message = "原始数据类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("source_type")
    private String sourceType;
    @ApiModelProperty(value = "数据类型长度", example = "", dataType = "java.lang.Long")
    private Long precision;
    @ApiModelProperty(value = "数据类型精度", example = "", dataType = "java.lang.Long")
    @JsonProperty("decimal_digits")
    private Long decimalDigits;

}
