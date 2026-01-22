package com.eisoo.dc.metadata.domain.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskCreateDto {
    @JsonProperty(value = "id", required = true)
    private String id;
    @JsonProperty(value = "ds_id", required = true)
    private String dsId;
    @JsonProperty(value = "status", required = true)
    private String status;
}
