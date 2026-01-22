package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 
 * 
 * @author aishu.cn
 * @email xxxx@aishu.cn
 * @date 2023-02-23 17:12:30
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_dict")
public class DictEntity implements Serializable {
	/**
	 * 唯一id，自增ID
	 */
	@TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Integer id;

	/**
	 * 字典类型
1：数据源类型
2：Oracle字段类型
3：MySQL字段类型
4：PostgreSQL字段类型
5：SqlServer字段类型
6：Hive字段类型
7：HBase字段类型
8：MongoDB字段类型
9：FTP字段类型
10：HDFS字段类型
11：SFTP字段类型
12：CMQ字段类型
13：Kafka字段类型
14：API字段类型
	 */
	@TableField(value = "f_dict_type")
	private Integer dictType;

	/**
	 * 枚举值
	 */
	@TableField(value = "f_dict_key")
	private Integer dictKey;

	/**
	 * 枚举对应描述
	 */
	@TableField(value = "f_dict_value")
	private String dictValue;

	/**
	 * 枚举对应描述
	 */
	@TableField(value = "f_extend_property")
	private String extendProperty;

	/**
	 * 启用状态，1 启用，2 停用，默认为停用
	 */
	@TableField(value = "f_enable_status")
	private Integer enableStatus;
}
