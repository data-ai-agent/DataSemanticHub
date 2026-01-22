package com.eisoo.dc.gateway.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class TaskQuery {
    @JsonProperty("task_id")
    private String taskId;
    private String state;
    private String progress;
    @JsonProperty("elapsed_time")
    private String elapsedTime;
    @JsonProperty("update_count")
    private long updateCount;
    @JsonProperty("schedule_time")
    private String scheduleTime;
    @JsonProperty("queued_time")
    private String queuedTime;
    @JsonProperty("cpu_time")
    private String cpuTime;

    public String getTaskId() {
        return taskId;
    }

    public TaskQuery(String taskId, String state, String progress) {
        this.taskId = taskId;
        this.state = state;
        this.progress = progress;
    }

     public TaskQuery(String taskId, String state, String progress,String elapsedTime,long updateCount,String scheduleTime,String queuedTime,String cpuTime) {
        this.taskId = taskId;
        this.state = state;
        this.progress = progress;
        this.elapsedTime=elapsedTime;
        this.updateCount=updateCount;
        this.scheduleTime=scheduleTime;
        this.queuedTime=queuedTime;
        this.cpuTime=cpuTime;
    }
}
