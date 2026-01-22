package com.eisoo.dc.gateway.domain.vo;

import java.util.List;
import java.util.Map;

public class SchemaColumns {
    private List<Data> data;
    private int total_count;

    public List<Data> getData() {
        return data;
    }

    public void setData(List<Data> data) {
        this.data = data;
    }

    public int getTotal_count() {
        return total_count;
    }

    public void setTotal_count(int total_count) {
        this.total_count = total_count;
    }

    public static class Data {
        private String name;
        private String type;
        private String origType;
        private boolean primaryKey;
        private boolean nullAble;
        private String columnDef;
        private String comment;
        private Map<String, Object> typeSignature;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getOrigType() {
            return origType;
        }

        public void setOrigType(String origType) {
            this.origType = origType;
        }

        public boolean isPrimaryKey() {
            return primaryKey;
        }

        public void setPrimaryKey(boolean primaryKey) {
            this.primaryKey = primaryKey;
        }

        public boolean isNullAble() {
            return nullAble;
        }

        public void setNullAble(boolean nullAble) {
            this.nullAble = nullAble;
        }

        public String getColumnDef() {
            return columnDef;
        }

        public void setColumnDef(String columnDef) {
            this.columnDef = columnDef;
        }


        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }

        public Map<String, Object> getTypeSignature() {
            return typeSignature;
        }

        public void setTypeSignature(Map<String, Object> typeSignature) {
            this.typeSignature = typeSignature;
        }
    }
}
