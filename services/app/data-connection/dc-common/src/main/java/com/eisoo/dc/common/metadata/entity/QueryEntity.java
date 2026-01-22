package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.TableField;
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
@TableName("query_info")
public class QueryEntity implements Serializable {
    /**
     *任务编号
     */
    @TableField(value = "query_id")
    private String queryId;

    /**
     * 查询结果集
     */
    @TableField(value = "result")
    private String result;

    /**
     * 错误详情
     */
    @TableField(value = "msg")
    private String msg;


}
