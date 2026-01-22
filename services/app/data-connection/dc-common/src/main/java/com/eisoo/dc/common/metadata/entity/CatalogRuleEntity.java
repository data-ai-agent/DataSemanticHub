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
@TableName("catalog_rule")
public class CatalogRuleEntity implements Serializable {
    /**
     *编号
     */
    @TableId(value = "id", type = IdType.AUTO)
    private String id;

    /**
     * catalog名称
     */
    @TableField(value = "catalog_name")
    private String catalogName;

    /**
     * 类似
     */
    @TableField(value = "datasource_type")
    private String datasourceType;

    /**
     * 规则名称
     */
    @TableField(value = "pushdown_rule")
    private String pushdownRule;

    /**
     * 是否启用
     */
    @TableField(value = "is_enabled")
    private String isEnabled;

    /**
     * 创建时间
     */
    @TableField(value = "create_time")
    private String createTime;

    /**
     * 更新时间
     */
    @TableField(value = "update_time")
    private String updateTime;
}
