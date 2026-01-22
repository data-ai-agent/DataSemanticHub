package com.eisoo.dc.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum ConnectorEnums {

    // 结构化数据
    MYSQL("structured", "mysql", "MySQL", "jdbc"),
    MARIA("structured", "maria", "MariaDB", "jdbc"),
    ORACLE("structured", "oracle", "Oracle", "jdbc"),
    POSTGRESQL("structured", "postgresql", "PostgreSQL", "jdbc"),
    SQLSERVER("structured", "sqlserver", "SQL Server", "jdbc"),
    DORIS("structured", "doris", "Apache Doris", "jdbc"),
    HOLOGRES("structured", "hologres","Hologres", "jdbc"),
    OPENGAUSS("structured", "opengauss","OpenGauss", "jdbc"),
    DAMENG("structured", "dameng", "Dameng", "jdbc"),
    GAUSSDB("structured", "gaussdb","GaussDB", "jdbc"),
    MONGODB("structured", "mongodb", "MongoDB", "jdbc"),
    HIVE("structured", "hive", "Apache Hive", "jdbc,thrift"),
    CLICKHOUSE("structured", "clickhouse", "ClickHouse", "jdbc"),
    INCEPTOR("structured", "inceptor-jdbc","TDH Inceptor", "jdbc"),
    MAXCOMPUTE("structured", "maxcompute","MaxCompute", "https"),

    // 非结构化数据
    EXCEL("no-structured", "excel", "Excel", "https,http"),
    ANYSHARE7("no-structured","anyshare7", "AnyShare 7.0", "https"),

    // 其他
    TINGYUN("other","tingyun", "听云", "https,http"),
    OPENSEARCH("other","opensearch", "OpenSearch", "https,http");

    //INDEXBASE("other","indexbase", "IndexBase", "https,http");

    ConnectorEnums(String type,String connector,String mapping,String connectProtocol) {
        this.type = type;
        this.connector = connector;
        this.mapping = mapping;
        this.connectProtocol = connectProtocol;
    }

    @EnumValue
    private final String type;
    private final String connector;
    private final String mapping;
    private final String connectProtocol;

    public String getType() {
        return type;
    }

    public String getConnector() {
        return connector;
    }

    public String getMapping() {
        return mapping;
    }

    public String getConnectProtocol() {
        return connectProtocol;
    }

    public static ConnectorEnums fromConnector(String connector) {
        for (ConnectorEnums connection : values()) {
            if (connection.connector.equalsIgnoreCase(connector)) {
                return connection;
            }
        }
        throw new IllegalArgumentException("No enum constant with connector: " + connector);
    }

    public static Set<String> getAllConnectors() {
        return Arrays.stream(ConnectorEnums.values())
                .map(ConnectorEnums::getConnector)
                .collect(Collectors.toSet());
    }

}
