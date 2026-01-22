package com.eisoo.dc.gateway.service;

import org.springframework.http.ResponseEntity;

public interface TableDdlAndDmlService {
    ResponseEntity<?> createTableSql(String statement, String user);
    ResponseEntity<?> insertTableSql(String statement, String user);
    ResponseEntity<?> truncateTableSql(String statement, String user);
}
