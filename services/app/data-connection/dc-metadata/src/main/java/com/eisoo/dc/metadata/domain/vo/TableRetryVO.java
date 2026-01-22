package com.eisoo.dc.metadata.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @author Tian.lan
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TableRetryVO implements Serializable {
    private String id;
    private List<String> tables;
}
