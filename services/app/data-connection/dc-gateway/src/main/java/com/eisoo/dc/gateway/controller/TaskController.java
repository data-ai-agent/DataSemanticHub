package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.gateway.common.QueryConstant;
import com.eisoo.dc.gateway.service.TaskService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Api(tags = "任务管理")
@RestController
//@RequestMapping("/api/vega-gateway")
@Validated
public class TaskController {

    @Autowired(required = false)
    private TaskService taskService;

    @ApiOperation(value = "异步查询", notes = "异步查询接口")
    @PostMapping("/api/vega-gateway/v1/task")
    public ResponseEntity<?> task(@Validated @RequestBody String statement, @RequestHeader(name="X-Presto-User",required = false) String user,@RequestParam(value = "type", required = false) String type) {
        return taskService.statementTask(statement, QueryConstant.DEFAULT_ASYNC_TASK_USER, type);
    }

//    @ApiOperation(value = "全表数据探查", notes = "全表数据探查接口")
//    @PostMapping("/api/virtual_engine_service/v1/data_exploration")
//    public ResponseEntity<?> data_exploration(@Validated @RequestBody String statement, @RequestHeader(name="X-Presto-User",required = false) String user,@RequestParam(value = "type", required = false, defaultValue = "1") String type) {
//        return taskService.scan(statement, Constants.DEFAULT_ASYNC_TASK_USER, type);
//    }

    @ApiOperation(value = "语法检查", notes = "SQL语法检查")
    @PostMapping("/api/vega-gateway/v1/check")
    public ResponseEntity<?> check(@Validated @RequestBody String statement, @RequestHeader(name="X-Presto-User",required = false) String user) {
        return taskService.check(statement,user);
    }

    @ApiOperation(value = "查询Task的状态", notes = "task状态接口")
    @GetMapping("/api/vega-gateway/v1/task/{taskId}")
    public ResponseEntity<?> getTask(@PathVariable("taskId") String taskId
            ,@RequestHeader(name="X-Presto-User",required = false) String user){
        return taskService.getTask(taskId,user);
    }

    @ApiOperation(value = "删除Task", notes = "task删除接口")
    @DeleteMapping("/api/vega-gateway/v1/task/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable("taskId") String taskId
            ,@RequestHeader(name="X-Presto-User",required = false) String user){
        return taskService.deleteTask(taskId,user);
    }
    @ApiOperation(value = "删除Task", notes = "task删除接口")
    @DeleteMapping("/api/virtual_engine_service/v1/task/{taskId}")
    public ResponseEntity<?> deleteOrigTask(@PathVariable("taskId") String taskId
            ,@RequestHeader(name="X-Presto-User",required = false) String user){
        return taskService.deleteOrigTask(taskId,user);
    }

    @ApiOperation(value = "取消任务", notes = "批量取消任务")
    @PutMapping("/api/vega-gateway/v1/task")
    public ResponseEntity<?> cancelAllTask(@Validated @RequestBody String statement
            ,@RequestHeader(name="X-Presto-User",required = false) String user){
        return taskService.cancelAllTask(statement,user);
    }

    /*@ApiOperation(value = "全表数据探查", notes = "全表数据探查接口")
    @PostMapping("/v1/data_exploration")
    public ResponseEntity<?> exploration(@Validated @RequestBody String statement, @RequestHeader(name="X-Presto-User",required = false) String user,@RequestParam(value = "type", required = false, defaultValue = "0") int type) {
        return taskService.explore(statement,user,type);
    }*/

}
