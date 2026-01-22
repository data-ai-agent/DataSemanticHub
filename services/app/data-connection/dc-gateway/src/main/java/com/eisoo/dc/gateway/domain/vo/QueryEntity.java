package com.eisoo.dc.gateway.domain.vo;

import java.util.List;
import java.util.Map;

public class QueryEntity {
    private List<Map<String, String>> columns;
    private List<List<Object>> data;
    private String url;
    private String state;

    public QueryEntity(){}

    public QueryEntity(List<Map<String, String>> columns, List<List<Object>> data, String url, String state) {
        this.columns = columns;
        this.data = data;
        this.url=url;
        this.state=state;
    }

    public List<Map<String, String>> getColumns() {
        return columns;
    }

    public List<List<Object>> getData() {
        return data;
    }

    public String getUrl() {
        return url;
    }

    public String getState() {
        return state;
    }

    public void setColumns(List<Map<String, String>> columns) {
        this.columns = columns;
    }

    public void setData(List<List<Object>> data) {
        this.data = data;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setState(String state) {
        this.state = state;
    }
}
