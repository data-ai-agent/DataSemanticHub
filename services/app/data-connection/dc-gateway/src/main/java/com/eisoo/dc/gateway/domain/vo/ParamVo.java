package com.eisoo.dc.gateway.domain.vo;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ParamVo {
    @JsonProperty("task_id")
    private List<String> taskId;

    @JsonProperty("task_id")
    public void setTaskId(List<String> taskId) {
        if (taskId == null || taskId.isEmpty() || taskId.stream().allMatch(String::isEmpty)) {
            throw new IllegalArgumentException("task_id cannot be empty or contain only blank strings");
        }
        this.taskId = taskId;
    }
}
