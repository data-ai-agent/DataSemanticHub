package com.eisoo.dc.main.controller;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Api(tags = "健康检查")
@RestController
@RequestMapping("/api/data-connection/v1/health")
public class HealthController {
    @ApiOperation(value = "就绪探针", notes = "就绪探针接口")
    @GetMapping("/ready")
    public ResponseEntity<String> ready(){
        return ResponseEntity.ok("OK");
    }
    @ApiOperation(value = "存活探针", notes = "存活探针接口")
    @GetMapping("/alive")
    public ResponseEntity<String> alive(){
        return ResponseEntity.ok("OK");
    }
}
