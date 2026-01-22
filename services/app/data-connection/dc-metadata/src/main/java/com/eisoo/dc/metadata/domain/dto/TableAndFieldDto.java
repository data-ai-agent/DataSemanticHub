package com.eisoo.dc.metadata.domain.dto;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.eisoo.dc.common.enums.TableTypeEnum;
import com.eisoo.dc.common.metadata.entity.DataSourceEntity;
import com.eisoo.dc.common.metadata.entity.FieldScanEntity;
import com.eisoo.dc.common.metadata.entity.TableScanEntity;
import com.eisoo.dc.common.util.StringUtils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
@ApiModel
public class TableAndFieldDto {
    @JsonProperty(value = "table_id")
    private String tableId;
    private DatasourceDto datasource;
    private TableDto table;
    @JsonProperty(value = "field_list")
    private List<FieldDto> fieldList;

    @Data
    public static class TableDto {
        @JsonProperty(value = "table_id")
        private String tableId;
        @JsonProperty(value = "table_name")
        private String tableName;
        @JsonProperty(value = "table_advanced_params")
        private JSONArray tableAdvancedParams;
        @JsonProperty(value = "table_description")
        private String tableDescription;
        @JsonProperty(value = "table_rows")
        private Integer tableRows = 0;
        @JsonProperty(value = "table_type")
        private String tableType;
        public TableDto(TableScanEntity tableScanEntity) {
            this.tableId = tableScanEntity.getFId();
            this.tableName = tableScanEntity.getFName();
            String fAdvancedParams = tableScanEntity.getFAdvancedParams();
            if (StringUtils.isNotBlank(fAdvancedParams)) {
                this.tableAdvancedParams = JSON.parseArray(fAdvancedParams);
            } else {
                this.tableAdvancedParams = null;
            }
            this.tableDescription = tableScanEntity.getFDescription();
            this.tableRows = tableScanEntity.getFTableRows();
            Integer fScanSource = tableScanEntity.getFScanSource();
            if (fScanSource != null) {
                this.tableType = TableTypeEnum.fromCode(fScanSource);
            }
        }
    }

    @Data
    public static class DatasourceDto {
        @JsonProperty(value = "ds_id")
        private String dsId;
        /**
         * 数据源展示名称
         */
        @JsonProperty(value = "ds_name")
        private String dsName;

        /**
         * 数据库类型
         */
        @JsonProperty(value = "ds_type")
        private String dsType;
        /**
         * 数据源catalog名称
         */
        @JsonProperty(value = "ds_catalog")
        private String dsCatalog;
        /**
         * 数据库名称
         */
        @JsonProperty(value = "ds_database")
        private String dsDatabase;
        /**
         * 数据库模式
         */
        @JsonProperty(value = "ds_schema")
        private String dsSchema;
        /**
         * 连接方式，当前支持http、https、thrift、jdbc
         */
        @JsonProperty(value = "ds_connect_protocol")
        private String dsConnectProtocol;
        /**
         * 地址
         */
        @JsonProperty(value = "ds_host")
        private String dsHost;
        /**
         * 端口
         */
        @JsonProperty(value = "ds_port")
        private int dsPort;
        /**
         * excel、anyshare7、tingyun数据源为用户id，其他数据源为用户名
         */
        @JsonProperty(value = "ds_account")
        private String dsAccount;
        /**
         * 密码
         */
        @JsonProperty(value = "ds_password")
        private String dsPassword;
        /**
         * 存储介质，当前仅excel数据源使用
         */
        @JsonProperty(value = "ds_storage_protocol")
        private String dsStorageProtocol;
        /**
         * 存储路径，当前仅excel、anyshare7数据源使用
         */
        @JsonProperty(value = "ds_storage_base")
        private String dsStorageBase;
        /**
         * token认证，当前仅inceptor数据源使用
         */
        @JsonProperty(value = "ds_token")
        private String dsToken;
        /**
         * 副本集名称，仅副本集模式部署的Mongo数据源使用
         */
        @JsonProperty(value = "ds_replicaSet")
        private String dsReplicaSet;

        /**
         * 是否为内置数据源（0 特殊 1 非内置 2 内置），默认为0
         */
        @JsonProperty(value = "ds_is_built_in")
        private int dsIsBuiltIn;

        /**
         * 描述
         */
        @JsonProperty(value = "ds_comment")
        private String dsComment;

        public DatasourceDto(DataSourceEntity dataSourceEntity) {
            // 数据源相关
            this.dsId = dataSourceEntity.getFId();
            this.dsName = dataSourceEntity.getFName();
            this.dsType = dataSourceEntity.getFType();
            this.dsCatalog = dataSourceEntity.getFCatalog();
            this.dsDatabase = dataSourceEntity.getFDatabase();
            this.dsSchema = dataSourceEntity.getFSchema();
            this.dsConnectProtocol = dataSourceEntity.getFConnectProtocol();
            this.dsHost = dataSourceEntity.getFHost();
            this.dsPort = dataSourceEntity.getFPort();
            this.dsAccount = dataSourceEntity.getFAccount();
            this.dsPassword = dataSourceEntity.getFPassword();


            this.dsConnectProtocol = dataSourceEntity.getFConnectProtocol();
            this.dsStorageBase = dataSourceEntity.getFStorageBase();
            this.dsToken = dataSourceEntity.getFToken();
            this.dsReplicaSet = dataSourceEntity.getFReplicaSet();

            this.dsIsBuiltIn = dataSourceEntity.getFIsBuiltIn();
            this.dsComment = dataSourceEntity.getFComment();
        }
    }

    @Data
    public static class FieldDto {
        @JsonProperty(value = "f_field_name")
        private String fFieldName;
        @JsonProperty(value = "f_table_id")
        private String fTableId;
        @JsonProperty(value = "f_table_name")
        private String fTableName;
        @JsonProperty(value = "f_field_type")
        private String fFieldType;
        @JsonProperty(value = "f_field_length")
        private Integer fFieldLength;
        @JsonProperty(value = "f_field_precision")
        private Integer fFieldPrecision;
        @JsonProperty(value = "f_field_comment")
        private String fFieldComment;
        @JsonProperty(value = "f_field_order_no")
        private String fFieldOrderNo;
        @JsonProperty(value = "f_advanced_params")
        private JSONArray fAdvancedParams;

        public FieldDto(FieldScanEntity field) {
            this.fFieldName = field.getFFieldName();
            this.fTableId = field.getFTableId();
            this.fTableName = field.getFTableName();
            this.fFieldType = field.getFFieldType();

            this.fFieldLength = field.getFFieldLength();
            this.fFieldPrecision = field.getFFieldPrecision();
            this.fFieldComment = field.getFFieldComment();
            this.fFieldOrderNo = field.getFFieldOrderNo();
            String fAdvancedParams = field.getFAdvancedParams();
            if (StringUtils.isNotBlank(fAdvancedParams)) {
                this.fAdvancedParams = JSON.parseArray(fAdvancedParams);
            } else {
                this.fAdvancedParams = null;
            }
        }
    }
}


