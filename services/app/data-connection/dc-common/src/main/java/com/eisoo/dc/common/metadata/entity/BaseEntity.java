package com.eisoo.dc.common.metadata.entity;


import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;

@Data
public class BaseEntity {

    /**
     * 数据源的逻辑删除标识码
     */
    @TableField(value = "f_delete_code")
    private Long deleteCode;

    @TableField(exist = false)
    Boolean isDeleted;
}
