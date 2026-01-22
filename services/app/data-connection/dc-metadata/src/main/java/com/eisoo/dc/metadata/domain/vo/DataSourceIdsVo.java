package com.eisoo.dc.metadata.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
@AllArgsConstructor
@NoArgsConstructor
public class DataSourceIdsVo {
    @JsonProperty("ds_ids")
    private List<String> dsIds;
}
