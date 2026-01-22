package com.eisoo.dc.common.metadata.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.eisoo.dc.common.metadata.entity.TblsEntity;
import com.eisoo.dc.common.vo.ViewTableVo;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface TblsMapper extends BaseMapper<TblsEntity> {

    void deleteByView(String catalogName,String viewName);

    String existView(String catalogName,String viewName);

    ViewTableVo existViewByCatalog(String catalogName);

    void updateView(@Param("catalogName") String catalogName,
                    @Param("viewName") String viewName,
                    @Param("user") String user);

    IPage<ViewTableVo> queryList(IPage page, @Param("catalogName") String catalogName,
                                 @Param("schemaName") String schemaName,
                                 @Param("viewName") String viewName);

    List<ViewTableVo> queryAll(@Param("catalogName") String catalogName,
                               @Param("schemaName") String schemaName,
                               @Param("viewName") String viewName);
}
