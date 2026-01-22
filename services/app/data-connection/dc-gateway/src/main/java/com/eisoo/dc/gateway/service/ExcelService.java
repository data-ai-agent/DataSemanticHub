package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.ExcelTableConfigDto;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;

public interface ExcelService {

    ResponseEntity<?> files(HttpServletRequest request, String catalog);

    ResponseEntity<?> sheet(HttpServletRequest request, String catalog, String fileName);

    ResponseEntity<?> columns(HttpServletRequest request, ExcelTableConfigDto excelTableConfigDto);

    ResponseEntity<?> createTable(HttpServletRequest request, ExcelTableConfigDto excelTableConfigDto);

    ResponseEntity<?> deleteTable(String tableId);

}
