package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.FieldOldEntity;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

public interface FieldOldMapper extends MPJBaseMapper<FieldOldEntity> {
    List<FieldOldEntity> getFieldListByTableId(Long tableId, String keyword);

    long selectCount(Long tableId, String keyword);

    List<FieldOldEntity> selectPage(
            @Param("tableId") Long tableId,
            @Param("includeIds") Set<String> includeIds,
            @Param("keyword") String keyword,
            @Param("offset") int offset,
            @Param("limit") int limit,
            @Param("sortOrder") String sortOrder,
            @Param("direction") String direction
    );
    int deleteByDsId(@Param("id") String id);
}
