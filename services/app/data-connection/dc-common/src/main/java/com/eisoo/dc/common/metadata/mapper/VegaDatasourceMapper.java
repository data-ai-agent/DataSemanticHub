package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.VegaDatasourceEntity;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/*
 * @Author paul
 *
 **/
public interface VegaDatasourceMapper extends MPJBaseMapper<VegaDatasourceEntity> {
    @Select("SELECT * FROM datasource WHERE id = #{id}")
    VegaDatasourceEntity selectById(@Param("id") String id);



    @Delete("DELETE FROM datasource WHERE id = #{id}")
    int deleteById(@Param("id") String id);

    List<VegaDatasourceEntity> selectByCatalogNameAndId(@Param("name") String name, @Param("id") String id);

    int updateById(@Param("entity") VegaDatasourceEntity entity);

    List<VegaDatasourceEntity> selectPage(
            @Param("excludedName") String excludedName,
            @Param("keyword") String keyword,
            @Param("type") String type,
            @Param("offset") int offset,
            @Param("limit") int limit,
            @Param("sortOrder") String sortOrder,
            @Param("direction") String direction
    );
    long selectCount(@Param("excludedName") String excludedName, @Param("keyword") String keyword, @Param("type") String type);

    int insert(@Param("entity") VegaDatasourceEntity entity);
}