package com.eisoo.dc.metadata.service;

import com.eisoo.dc.metadata.domain.dto.TypeMappingDto;
import org.springframework.http.ResponseEntity;

public interface ConnectorService {
    ResponseEntity<?> getConnectorConfig(String connectorName);
    ResponseEntity<?> getConnectorsMapping(TypeMappingDto mappingDto);


}
