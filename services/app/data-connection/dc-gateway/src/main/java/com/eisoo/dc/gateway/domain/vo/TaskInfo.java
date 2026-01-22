package com.eisoo.dc.gateway.domain.vo;

import lombok.Data;

@Data
public class TaskInfo {
    private String taskId;
    private String subTaskId;
    private String state;
    private String query;

}
