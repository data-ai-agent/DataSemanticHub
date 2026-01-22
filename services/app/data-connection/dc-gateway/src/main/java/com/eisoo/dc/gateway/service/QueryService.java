package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.DownloadDto;
import com.eisoo.dc.gateway.domain.vo.FetchQueryVO;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.http.ResponseEntity;

public interface QueryService {
    ResponseEntity<?> statement(String statementType,String catalogName,String tableName,String statement,String user,int type,String userId,String action, String xPrestoSession) throws Exception;
    ResponseEntity<?> statement(String catalog,String schema,String table,String columns,long limit,int type,String user,String userId,String action) throws Exception;

    ResponseEntity<?> statement(String queryId,String slug,long token,String user) throws JsonProcessingException;

    ResponseEntity<?> statement(DownloadDto downloadDto, String user, String userId, String action) throws JsonProcessingException;

    ResponseEntity<?> statement(String statement,String user,String userId,String action) throws Exception;

    ResponseEntity<?> statement(String accountId, String accountType, FetchQueryVO fetchQueryVO);

    ResponseEntity<?> statement(String accountId, String accountType, String queryId, String slug, long token,Integer batchSize);
}
