package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.Getter;

import java.io.Serializable;

@Data
@Getter
@TableName("hetu_tbls")
public class TblsEntity implements Serializable {
    /**
     * 唯一id，自增
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 视图源名称Id
     */
    @TableField(value = "database_id")
    private Long databaseId;

    /**
     * 数据表视图
     */
    @TableField(value = "table_name")
    private String tableName;

    /**
     *
     */
    @TableField(value = "type")
    private String type;

    /**
     *
     */
    @TableField(value = "view_original_text")
    private String viewOriginalText;

    /**
     * 创建时间
     */
    @TableField(value = "create_time")
    private Long createTime;

    /**
     * 所属人
     */
    @TableField(value = "owner")
    private String owner;

    /**
     * 描述信息,备注
     */
    @TableField(value = "comment")
    private String comment;
}
