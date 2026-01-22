package com.eisoo.dc.gateway.service;

import com.aishu.af.vega.sql.extract.SqlExtractUtil;
import com.eisoo.dc.gateway.domain.vo.RowColumnRuleVo;

import java.util.Set;

public interface RewriteSqlService {

    RowColumnRuleVo rewriteSql(String sourceSql, String userId, String action, String token);

    RowColumnRuleVo getSqlByTable(SqlExtractUtil.TableName tableName, String userId, Set<String> allColumnSet, String action, String token, String rowRule);

}
