package com.eisoo.dc.gateway.domain.vo;

import lombok.Data;

import java.util.List;

@Data
public class AsyncQuery {
    public List<String> statement;
    public String topic;
    public List<String> taskIds;
}
