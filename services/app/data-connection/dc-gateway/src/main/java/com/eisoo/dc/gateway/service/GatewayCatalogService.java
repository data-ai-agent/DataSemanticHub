package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.CatalogDto;
import org.springframework.http.ResponseEntity;

public interface GatewayCatalogService {
    ResponseEntity<?> create(CatalogDto params);

    String showCatalogInfo(String catalogName);
}
