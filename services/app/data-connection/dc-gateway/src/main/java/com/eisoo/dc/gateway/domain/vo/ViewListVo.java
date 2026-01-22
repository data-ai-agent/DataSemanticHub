package com.eisoo.dc.gateway.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * @Author zdh
 **/
@Data
public class ViewListVo {
    long total;
    long pages;
    List<Object> entries;
}
