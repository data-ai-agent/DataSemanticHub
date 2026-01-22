package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.FieldScanEntity;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.Date;
import java.util.List;
import java.util.Set;

/**
 * @author Tian.lan
 */
public interface FieldScanMapper extends MPJBaseMapper<FieldScanEntity> {

    @Select("SELECT * FROM t_table_field_scan WHERE f_table_id = #{id} AND f_operation_type != 1")
    List<FieldScanEntity> selectByTableId(@Param("id") String tableId);

    List<FieldScanEntity> getFieldListByTableId(String tableId, String keyword);

    long selectCount(String tableId, String keyword);

    List<FieldScanEntity> selectPage(
            @Param("includeIds") Set<String> includeIds,
            @Param("keyword") String keyword,
            @Param("offset") int offset,
            @Param("limit") int limit,
            @Param("sortOrder") String sortOrder,
            @Param("direction") String direction
    );

    @Update("UPDATE t_table_field_scan SET f_operation_type=1, f_operation_time=#{operationTime} WHERE f_table_id = #{tableId}")
    int deleteByTableId(@Param("tableId") String tableId, @Param("operationTime") Date operationTime);
    int deleteByDsId(@Param("id") String id);
    List<FieldScanEntity> getAllFieldListByTableId(Set<String> includeIds);
}
