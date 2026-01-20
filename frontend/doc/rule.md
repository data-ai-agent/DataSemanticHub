下面给你一套**可直接喂给规则引擎使用的 JSON 配置**（含 DSL 语义），覆盖：

* 表级 Gate（硬门控）
* 表级 Rule Scoring（打分）
* AI 介入条件（何时调用 AI）
* 字段级分类规则（优先级 + 硬覆盖）
* 规则 vs AI 冲突处理
* 状态/行为升级触发（从字段到对象候选）
* 人工确认队列阈值（Auto/Review/Reject）

> 你可以把它当作“规则引擎的配置文件”，引擎只需要实现：
> **match → score → decide → emit_suggestions**。

---

## 1) 规则 DSL/JSON 总体结构（建议文件名：`semantic-recognition-rules.v1.json`）

```json
{
  "version": "1.0",
  "engine": {
    "mode": "hybrid",
    "description": "Bottom-up 语义识别规则：表级+字段级，支持 AI + 规则混合判定"
  },
  "inputs": {
    "table": {
      "required_fields": [
        "table_name",
        "table_comment",
        "columns",
        "constraints",
        "row_count"
      ]
    },
    "column": {
      "required_fields": [
        "column_name",
        "data_type",
        "comment",
        "is_nullable",
        "is_pk",
        "is_fk",
        "references"
      ]
    }
  },
  "dictionaries": {},
  "pipelines": {},
  "rulesets": {},
  "scoring": {},
  "ai": {},
  "decision": {},
  "outputs": {}
}
```

---

## 2) 字典与正则库（可维护、可扩展）

```json
{
  "dictionaries": {
    "table_exclude_name_patterns": [
      "(?i).*_log$",
      "(?i)^log_.*",
      "(?i).*_tmp$",
      "(?i).*_temp$",
      "(?i).*_trace$",
      "(?i).*_audit$",
      "(?i).*_backup$"
    ],
    "table_relation_name_patterns": [
      "(?i).*_rel$",
      "(?i).*_map$",
      "(?i).*_mapping$",
      "(?i).*_link$"
    ],
    "table_detail_name_patterns": [
      "(?i).*_detail$",
      "(?i).*_item$",
      "(?i).*_line$"
    ],
    "technical_column_patterns": [
      "(?i)^is_deleted$",
      "(?i)^deleted$",
      "(?i)^delete_flag$",
      "(?i)^version$",
      "(?i)^row_version$",
      "(?i)^etl_time$",
      "(?i)^dw_load_time$",
      "(?i)^create_by$",
      "(?i)^update_by$",
      "(?i)^created_by$",
      "(?i)^updated_by$"
    ],
    "lifecycle_column_patterns": [
      "(?i)^create_time$",
      "(?i)^created_at$",
      "(?i)^update_time$",
      "(?i)^updated_at$",
      "(?i)^effective_date$",
      "(?i)^start_date$",
      "(?i)^end_date$"
    ],
    "status_column_keywords": [
      "status",
      "state",
      "phase",
      "stage",
      "flag"
    ],
    "event_time_keywords": [
      "time",
      "date",
      "at"
    ],
    "event_verb_keywords": [
      "pay",
      "paid",
      "approve",
      "approved",
      "ship",
      "shipped",
      "deliver",
      "delivered",
      "cancel",
      "cancelled",
      "submit",
      "submitted",
      "create",
      "created"
    ],
    "id_suffix_patterns": [
      "(?i).*_id$",
      "(?i).*_no$",
      "(?i).*_code$",
      "(?i).*_sn$"
    ]
  }
}
```

---

## 3) Pipeline：执行顺序（必须固定）

```json
{
  "pipelines": {
    "bottom_up_recognition": {
      "stages": [
        "table_gate",
        "table_scoring",
        "ai_table_judge",
        "table_ensemble_decision",
        "column_rule_classify",
        "ai_column_refine",
        "column_conflict_resolve",
        "upgrade_suggestions",
        "human_queue_assignment"
      ]
    }
  }
}
```

---

## 4) 表级 Gate 规则（硬门控，先挡掉“必错表”）

```json
{
  "rulesets": {
    "table_gate": {
      "type": "gate",
      "rules": [
        {
          "id": "TG-01-exclude-by-name",
          "priority": 100,
          "if": {
            "any": [
              { "regex_match": { "field": "table_name", "pattern_ref": "table_exclude_name_patterns" } }
            ]
          },
          "then": {
            "gate": "REJECT",
            "reason": "表名命中日志/临时/审计等排除模式"
          }
        },
        {
          "id": "TG-02-exclude-relation-tables",
          "priority": 90,
          "if": {
            "any": [
              { "regex_match": { "field": "table_name", "pattern_ref": "table_relation_name_patterns" } }
            ]
          },
          "then": {
            "gate": "REJECT",
            "reason": "疑似关系映射表（rel/map/link）"
          }
        },
        {
          "id": "TG-03-review-no-pk",
          "priority": 80,
          "if": {
            "all": [
              { "equals": { "field": "constraints.has_primary_key", "value": false } }
            ]
          },
          "then": {
            "gate": "REVIEW",
            "reason": "无主键，无法稳定标识对象"
          }
        },
        {
          "id": "TG-04-pass-default",
          "priority": 1,
          "if": { "always": true },
          "then": {
            "gate": "PASS",
            "reason": "未命中硬排除，允许进入打分与 AI 判定"
          }
        }
      ]
    }
  }
}
```

---

## 5) 表级打分规则（Rule Score，提供可解释“分数构成”）

> 输出 `rule_score` 范围建议 0~1。

```json
{
  "scoring": {
    "table_rule_score": {
      "type": "weighted_sum",
      "min": 0,
      "max": 1,
      "features": [
        {
          "id": "TRS-01-has-pk",
          "weight": 0.25,
          "when": { "equals": { "field": "constraints.has_primary_key", "value": true } },
          "score": 1,
          "evidence": "存在主键"
        },
        {
          "id": "TRS-02-has-lifecycle",
          "weight": 0.20,
          "when": { "any_column_regex_match": { "pattern_ref": "lifecycle_column_patterns" } },
          "score": 1,
          "evidence": "存在生命周期字段"
        },
        {
          "id": "TRS-03-detail-penalty",
          "weight": -0.20,
          "when": { "regex_match": { "field": "table_name", "pattern_ref": "table_detail_name_patterns" } },
          "score": 1,
          "evidence": "疑似明细表命名"
        },
        {
          "id": "TRS-04-too-few-columns-penalty",
          "weight": -0.15,
          "when": { "lt": { "field": "columns.count", "value": 3 } },
          "score": 1,
          "evidence": "字段数过少"
        },
        {
          "id": "TRS-05-has-comment-bonus",
          "weight": 0.10,
          "when": { "not_empty": { "field": "table_comment" } },
          "score": 1,
          "evidence": "有表备注"
        }
      ]
    }
  }
}
```

---

## 6) AI 介入条件（何时调用 AI 表判定 / 字段判定）

```json
{
  "ai": {
    "table_judge": {
      "enabled": true,
      "invoke_when": {
        "all": [
          { "not_in": { "field": "gate", "values": ["REJECT"] } }
        ]
      },
      "input_projection": {
        "fields": ["table_name", "table_comment", "constraints", "columns.sample_top_n:30"]
      },
      "expected_output": [
        "ai_object_likeness_score",
        "suggested_object_name",
        "risk_flags",
        "evidence_spans",
        "reasoning_summary"
      ]
    },
    "column_refine": {
      "enabled": true,
      "invoke_when": {
        "any": [
          { "lt": { "field": "column.rule_confidence", "value": 0.75 } },
          { "in": { "field": "column.rule_class", "values": ["AMBIGUOUS", "POSSIBLE_FK", "STATUS_CANDIDATE", "EVENT_HINT"] } }
        ]
      },
      "input_projection": {
        "fields": [
          "table_name",
          "table_comment",
          "column.column_name",
          "column.data_type",
          "column.comment",
          "peer_columns.sample_top_n:20",
          "constraints"
        ]
      },
      "expected_output": [
        "semantic_role",
        "semantic_name_cn",
        "confidence",
        "suggested_enum_values",
        "evidence_spans",
        "reasoning_summary"
      ]
    }
  }
}
```

---

## 7) 表级 AI+规则合成判定（Ensemble Decision）

```json
{
  "decision": {
    "table_ensemble": {
      "final_score_formula": {
        "type": "linear",
        "terms": [
          { "field": "ai_object_likeness_score", "weight": 0.55 },
          { "field": "rule_score", "weight": 0.45 }
        ]
      },
      "thresholds": [
        { "if": { "gte": { "field": "final_score", "value": 0.80 } }, "then": "SUGGEST_OBJECT" },
        { "if": { "gte": { "field": "final_score", "value": 0.60 } }, "then": "NEEDS_REVIEW" },
        { "if": { "always": true }, "then": "DO_NOT_SUGGEST" }
      ],
      "emit": {
        "suggestion_type": "TABLE_OBJECT",
        "fields": [
          "table_name",
          "suggested_object_name",
          "final_score",
          "rule_score",
          "ai_object_likeness_score",
          "risk_flags",
          "evidence"
        ]
      }
    }
  }
}
```

---

## 8) 字段级规则分类（Rule-first，带优先级与硬覆盖）

> 输出 `rule_class` + `rule_confidence`，再由 AI 细化。

```json
{
  "rulesets": {
    "column_classify": {
      "type": "classifier",
      "rules": [
        {
          "id": "CR-01-technical-field",
          "priority": 100,
          "if": { "regex_match": { "field": "column_name", "pattern_ref": "technical_column_patterns" } },
          "then": { "class": "TECHNICAL_FIELD", "confidence": 0.99, "hard": true }
        },
        {
          "id": "CR-02-primary-key",
          "priority": 95,
          "if": { "equals": { "field": "is_pk", "value": true } },
          "then": { "class": "IDENTIFIER", "confidence": 0.99, "hard": true }
        },
        {
          "id": "CR-03-foreign-key-by-constraint",
          "priority": 90,
          "if": { "equals": { "field": "is_fk", "value": true } },
          "then": { "class": "FOREIGN_KEY", "confidence": 0.95, "hard": true }
        },
        {
          "id": "CR-04-status-by-name",
          "priority": 70,
          "if": { "contains_any": { "field": "column_name", "keywords_ref": "status_column_keywords" } },
          "then": { "class": "STATUS_CANDIDATE", "confidence": 0.75, "hard": false }
        },
        {
          "id": "CR-05-event-hint-by-time+verb",
          "priority": 65,
          "if": {
            "all": [
              { "contains_any": { "field": "column_name", "keywords_ref": "event_time_keywords" } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_verb_keywords" } }
            ]
          },
          "then": { "class": "EVENT_HINT", "confidence": 0.75, "hard": false }
        },
        {
          "id": "CR-06-possible-fk-by-suffix",
          "priority": 60,
          "if": { "regex_match": { "field": "column_name", "pattern_ref": "id_suffix_patterns" } },
          "then": { "class": "POSSIBLE_FK", "confidence": 0.65, "hard": false }
        },
        {
          "id": "CR-07-default-business-attr",
          "priority": 1,
          "if": { "always": true },
          "then": { "class": "BUSINESS_ATTRIBUTE", "confidence": 0.60, "hard": false }
        }
      ]
    }
  }
}
```

---

## 9) 规则 vs AI 冲突处理（硬规则覆盖 + 否则入 REVIEW）

```json
{
  "decision": {
    "column_conflict_resolve": {
      "hard_override_classes": ["TECHNICAL_FIELD", "IDENTIFIER", "FOREIGN_KEY"],
      "strategy": [
        {
          "if": { "in": { "field": "rule_class", "values": ["TECHNICAL_FIELD", "IDENTIFIER", "FOREIGN_KEY"] } },
          "then": { "final_role_source": "RULE", "final_role": "{rule_class}" }
        },
        {
          "if": {
            "all": [
              { "not_empty": { "field": "ai.semantic_role" } },
              { "neq": { "field": "ai.semantic_role", "value_field": "rule_class_mapped_role" } },
              { "lt": { "field": "ai.confidence", "value": 0.80 } }
            ]
          },
          "then": { "final_role_source": "REVIEW", "final_role": "{rule_class_mapped_role}", "flag": "AI_CONFLICT_LOW_CONF" }
        },
        {
          "if": { "not_empty": { "field": "ai.semantic_role" } },
          "then": { "final_role_source": "AI", "final_role": "{ai.semantic_role}" }
        },
        {
          "if": { "always": true },
          "then": { "final_role_source": "RULE", "final_role": "{rule_class_mapped_role}" }
        }
      ]
    }
  }
}
```

> 注：`rule_class_mapped_role` 是把 `STATUS_CANDIDATE` 映射到 `STATUS` 等角色的内部映射表，你可以放在 dictionaries 里。

---

## 10) 字段→对象升级建议（Snapshot / Event）

### 10.1 状态对象升级（Snapshot）

```json
{
  "rulesets": {
    "upgrade_snapshot": {
      "type": "trigger",
      "rules": [
        {
          "id": "US-01-status-upgrade-by-enum-cardinality",
          "priority": 100,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE"] } },
              { "between": { "field": "column.profile.distinct_count", "min": 2, "max": 20 } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_SNAPSHOT",
            "reason": "状态字段且枚举基数合理（2-20）"
          }
        },
        {
          "id": "US-02-status-upgrade-by-comment",
          "priority": 80,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE"] } },
              { "contains_any": { "field": "comment", "keywords": ["状态", "阶段", "是否", "完成"] } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_SNAPSHOT",
            "reason": "字段备注体现业务结论语义"
          }
        }
      ]
    }
  }
}
```

### 10.2 行为对象升级（Event）

```json
{
  "rulesets": {
    "upgrade_event": {
      "type": "trigger",
      "rules": [
        {
          "id": "UE-01-event-by-time-and-verb",
          "priority": 100,
          "if": {
            "all": [
              { "in": { "field": "final_role", "values": ["EVENT_HINT"] } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_verb_keywords" } },
              { "contains_any": { "field": "column_name", "keywords_ref": "event_time_keywords" } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_EVENT",
            "reason": "字段名称同时包含动词语义与时间语义"
          }
        },
        {
          "id": "UE-02-event-by-operation-triple",
          "priority": 90,
          "if": {
            "all": [
              { "exists_peer_column": { "keywords": ["operator", "user", "by"] } },
              { "exists_peer_column": { "keywords": ["operation", "action", "type"] } },
              { "exists_peer_column": { "keywords": ["time", "date", "at"] } }
            ]
          },
          "then": {
            "suggest_upgrade": true,
            "suggestion_type": "UPGRADE_EVENT",
            "reason": "存在操作人+操作类型+操作时间三元组，典型行为记录"
          }
        }
      ]
    }
  }
}
```

---

## 11) 人工确认队列分配（Auto / Review / Reject）

```json
{
  "decision": {
    "human_queue": {
      "table_suggestions": {
        "auto_approve": {
          "when": {
            "all": [
              { "gte": { "field": "final_score", "value": 0.90 } },
              { "not_contains": { "field": "risk_flags", "value": "relation_table" } }
            ]
          }
        },
        "needs_review": {
          "when": { "gte": { "field": "final_score", "value": 0.60 } }
        },
        "reject": {
          "when": { "always": true }
        }
      },
      "column_suggestions": {
        "auto_approve": {
          "when": {
            "all": [
              { "in": { "field": "final_role", "values": ["IDENTIFIER", "FOREIGN_KEY", "TECHNICAL_FIELD"] } }
            ]
          }
        },
        "needs_review": {
          "when": {
            "any": [
              { "in": { "field": "final_role", "values": ["STATUS", "STATUS_CANDIDATE", "EVENT_HINT", "POSSIBLE_FK"] } },
              { "equals": { "field": "final_role_source", "value": "REVIEW" } }
            ]
          }
        },
        "reject": { "when": { "always": true } }
      }
    }
  }
}
```

---

## 12) 输出建议对象结构（给 UI/后续流程用）

```json
{
  "outputs": {
    "suggestion_schema": {
      "common_fields": [
        "suggestion_id",
        "suggestion_type",
        "source",
        "target_name",
        "final_score",
        "rule_score",
        "ai_score",
        "confidence",
        "gate",
        "risk_flags",
        "evidence",
        "reasoning_summary",
        "queue"
      ],
      "types": {
        "TABLE_OBJECT": {
          "target_fields": ["suggested_object_name", "source_table"]
        },
        "COLUMN_ROLE": {
          "target_fields": ["semantic_role", "semantic_name_cn", "source_table", "column_name"]
        },
        "UPGRADE_SNAPSHOT": {
          "target_fields": ["snapshot_name_suggested", "source_table", "column_name"]
        },
        "UPGRADE_EVENT": {
          "target_fields": ["event_name_suggested", "source_table", "column_name"]
        }
      }
    }
  }
}
```

---

# 你现在拿到的是什么

* 一份**可配置**的规则 DSL（JSON）
* 支持 **门控（硬规则）→ 打分（可解释）→ AI 介入（软语义）→ 冲突处理（可控）→ 升级建议（不爆炸）→ 人工队列（可运营）**
* 完全符合你之前的“AI 只建议不裁决”原则

---

# 下一步（工程落地必需）

为了让研发“拿去就能做”，下一步通常需要补齐两样东西：

1. **规则引擎的执行语义说明**（每个 if/when 操作符的实现定义，比如 `any_column_regex_match`、`exists_peer_column` 的实现）
2. **识别任务 API 协议**（/run、/suggestions、/confirm，包含 suggestion_id 生命周期）

你要我继续做哪一个？我建议先做 **规则引擎操作符语义说明**，否则不同实现会导致结果漂移。
