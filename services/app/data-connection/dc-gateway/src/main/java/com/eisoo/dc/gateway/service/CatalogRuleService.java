package com.eisoo.dc.gateway.service;

import com.eisoo.dc.gateway.domain.dto.CatalogRuleDto;
import org.springframework.http.ResponseEntity;

public interface CatalogRuleService {
    ResponseEntity<?> OperatorList(String operator);
    ResponseEntity<?> configRule(CatalogRuleDto catalogRuleDto, String user);
    ResponseEntity<?> QueryOperatorList();
    ResponseEntity<?> RuleList();
}
