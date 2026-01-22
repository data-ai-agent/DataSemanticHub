package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.DataSourceEntity;
import com.eisoo.dc.common.metadata.entity.TaskScanEntity;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Set;

public interface DataSourceMapper extends MPJBaseMapper<DataSourceEntity> {
    List<String> selectAllId(@Param("includeIds") List<String> includeIds);

    @Select("SELECT * FROM t_data_source_info WHERE f_id = #{id}")
    DataSourceEntity selectById(@Param("id") String id);

    @Select("SELECT * FROM t_data_source_info WHERE f_catalog = #{catalog}")
    DataSourceEntity selectByCatalog(@Param("catalog") String catalog);

    @Delete("DELETE FROM t_data_source_info WHERE f_id = #{id}")
    int deleteById(@Param("id") String id);

    List<DataSourceEntity> selectByCatalogNameAndId(@Param("name") String name, @Param("id") String id);

    int updateById(@Param("entity") DataSourceEntity entity);

    List<DataSourceEntity> selectPage(
            @Param("includeIds") Set<String> includeIds,
            @Param("keyword") String keyword,
            @Param("connectors") List<String> connectors,
            @Param("offset") int offset,
            @Param("limit") int limit,
            @Param("sortOrder") String sortOrder,
            @Param("direction") String direction
    );

    long selectCount(@Param("includeIds") Set<String> includeIds,
                     @Param("keyword") String keyword,
                     @Param("connectors") List<String> connectors
    );

    List<DataSourceEntity> selectDataSources(
            @Param("id") String id,
            @Param("keyword") String keyword,
            @Param("connectors") List<String> connectors
    );

    int insert(@Param("entity") DataSourceEntity entity);
}