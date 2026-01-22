package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.SchemaDto;
import org.springframework.http.ResponseEntity;

/**
 * @Author zdh
 **/
public interface SchemaService {

    ResponseEntity<?> createSchema(SchemaDto params, String user);

    ResponseEntity<?> dropSchema(SchemaDto params, String user);
}
