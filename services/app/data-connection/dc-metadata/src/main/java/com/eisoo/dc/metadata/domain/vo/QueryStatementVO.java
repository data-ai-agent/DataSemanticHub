package com.eisoo.dc.metadata.domain.vo;

import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.deserializer.StringDeserializer;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * @author Tian.lan
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
@AllArgsConstructor
public class QueryStatementVO implements Serializable {

    @ApiModelProperty(value = "查询数据源id", example = "0-1-2", dataType = "java.lang.String")
    @JsonDeserialize(using = StringDeserializer.class)
    @NotBlank(message = "查询数据源id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("ds_id")
    private String dsId;

    @ApiModelProperty(value = "查询索引", example = "as-operation-log-antivirus", dataType = "java.lang.String")
    @JsonDeserialize(using = StringDeserializer.class)
    @NotBlank(message = "查询索引" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("index")
    private String index;

    @ApiModelProperty(value = "查询DSL语句", example = "select * from t", dataType = "java.lang.String")
    @NotBlank(message = "查询DSL语句" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonDeserialize(using = StringDeserializer.class)
    @JsonProperty("statement")
    private String statement;

}
