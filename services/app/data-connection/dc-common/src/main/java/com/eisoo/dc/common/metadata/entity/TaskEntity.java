package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.Getter;

import java.io.Serializable;

/*
 * @Author paul
 *
 **/
@Data
@Getter
@TableName("task_info")
public class TaskEntity implements Serializable {
    /**
     *任务编号
     */
    @TableId(value = "task_id")
    private String taskId;

    @TableField(value = "sub_task_id")
    private String subtaskId;

    /**
     * 任务状态
     */
    @TableField(value = "state")
    private String state;

    /**
     * 查询语句
     */
    @TableField(value = "query")
    private String query;

    /**
     * 创建时间
     */
    @TableField(value = "create_time")
    private String createTime;

    /**
     * 修改时间
     */
    @TableField(value = "update_time")
    private String updateTime;

    /**
     * 修改时间
     */
    @TableField(value = "type")
    private String type;

    @TableField(exist = false)
    private String msg;

    @TableField(value = "elapsed_time")
    private String elapsedTime;

    @TableField(value = "update_count")
    private long updateCount;
    @TableField(value = "schedule_time")
    private String scheduleTime;
    @TableField(value = "queued_time")
    private String queuedTime;
    @TableField(value = "cpu_time")
    private String cpuTime;


    /**
     * topic
     */
    @TableField(value = "topic")
    private String topic;
    @TableField(exist = false)
    private String progressPercentage;

    public TaskEntity(String taskId, String subtaskId, String state, String query, String createTime, String updateTime, String msg, String topic, String progressPercentage) {
        this.taskId = taskId;
        this.subtaskId = subtaskId;
        this.state = state;
        this.query = query;
        this.createTime = createTime;
        this.updateTime = updateTime;
        this.msg = msg;
        this.topic = topic;
        this.progressPercentage = progressPercentage;
    }
}
