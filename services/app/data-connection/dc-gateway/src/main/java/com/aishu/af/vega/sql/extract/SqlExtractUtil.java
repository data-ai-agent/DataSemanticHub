package com.aishu.af.vega.sql.extract;

import java.util.*;

public class SqlExtractUtil {
    
    public static class TableName {
        private String tableName;
        private String aliasName;
        private boolean hasAlias;
        
        public TableName(String tableName) {
            this.tableName = tableName;
        }
        
        public TableName(String tableName, String aliasName) {
            this.tableName = tableName;
            this.aliasName = aliasName;
        }
        
        public TableName(String tableName, String aliasName, boolean hasAlias) {
            this.tableName = tableName;
            this.aliasName = aliasName;
            this.hasAlias = hasAlias;
        }
        
        public String getTableName() {
            return tableName;
        }
        
        public void setTableName(String tableName) {
            this.tableName = tableName;
        }
        
        public String getAliasName() {
            return aliasName;
        }
        
        public boolean haveTableAliasName() {
            return aliasName != null && !aliasName.isEmpty();
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TableName tableName1 = (TableName) o;
            return hasAlias == tableName1.hasAlias &&
                   Objects.equals(tableName, tableName1.tableName) &&
                   Objects.equals(aliasName, tableName1.aliasName);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(tableName, aliasName, hasAlias);
        }
        
        @Override
        public String toString() {
            return tableName + (aliasName != null ? " AS " + aliasName : "");
        }
    }
    
    public static Map<TableName, Set<String>> extractTableAndColumnRelationFromSqlNew(String sql) {
        // 简单的模拟实现，返回空集合
        Map<TableName, Set<String>> result = new HashMap<>();
        // 这里应该有复杂的SQL解析逻辑，但我们现在只是提供一个模拟实现
        return result;
    }
    
    public static Map<String, Set<String>> extractTableAndColumnRelationFromSql(String sql) {
        // 为了兼容现有代码，返回String而不是TableName
        Map<String, Set<String>> result = new HashMap<>();
        // 这里应该有复杂的SQL解析逻辑，但我们现在只是提供一个模拟实现
        return result;
    }
    
    public static List<String> extractTableNames(String sql) {
        // 简单的模拟实现
        return new ArrayList<>();
    }
    
    public static Object parseSql(String sql) {
        // 模拟实现
        return new Object();
    }
}