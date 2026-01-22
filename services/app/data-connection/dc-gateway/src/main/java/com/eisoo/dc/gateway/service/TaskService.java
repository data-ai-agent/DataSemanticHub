package com.eisoo.dc.gateway.service;

import org.springframework.http.ResponseEntity;

public interface TaskService {
    ResponseEntity<?> statementTask(String statement, String user, String type);

    ResponseEntity<?> getTask(String taskId, String user);

    ResponseEntity<?> deleteTask(String taskId, String user);

    ResponseEntity<?> deleteOrigTask(String taskId, String user);

    ResponseEntity<?> scan(String statement, String user, String type);

    ResponseEntity<?> check(String statement,String user);

    ResponseEntity<?> cancelAllTask(String taskIdList, String user);


}
