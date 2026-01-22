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
public class TaskEntityQuery implements Serializable {
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



    public TaskEntityQuery(String taskId, String subtaskId, String state) {
        this.taskId = taskId;
        this.subtaskId = subtaskId;
        this.state = state;
    }
}
