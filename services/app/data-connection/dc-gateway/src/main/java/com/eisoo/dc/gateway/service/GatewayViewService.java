package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.ViewDto;
import org.springframework.http.ResponseEntity;

public interface GatewayViewService {

    ResponseEntity<?> createView(ViewDto params, String user, boolean allowCreateExcelView);

    ResponseEntity<?> viewList(Long pageNum,Long pageSize,String catalogName,String schemaName,String viewName);

    ResponseEntity<?> replaceView(ViewDto params,String user);

    ResponseEntity<?> deleteView(ViewDto params,String user, boolean allowCreateExcelView);

}
