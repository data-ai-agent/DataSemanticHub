package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.CatalogRuleEntity;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CatalogRuleMapper extends MPJBaseMapper<CatalogRuleEntity> {

    @Delete("DELETE FROM catalog_rule WHERE catalog_name = #{catalogName}")
    int deleteByCatalogName(@Param("catalogName") String catalogName);

    @Select("SELECT catalog_name,datasource_type,pushdown_rule,is_enabled from catalog_rule WHERE catalog_name = #{catalogName}")
    List<CatalogRuleEntity> selectRuleInfo(@Param("catalogName") String catalogName);

    @Select("SELECT catalog_name,datasource_type,pushdown_rule,is_enabled from catalog_rule ")
    List<CatalogRuleEntity> selectAll();

}
