package com.eisoo.dc.common.msq;

public final class ErrorString {
    private ErrorString() {
    }

    public static final String UNSUPPORT_CLIENT_TYPE = "支持的类型: kafka| nsq| tonglink| bmq| htp20; 当前类型: ";
    public static final String UNSUPPORT_MECHANISM_TYPE = "支持的类型: PLAIN| SCRAM-SHA-512| SCRAM-SHA-256; 当前类型: ";
    public static final String INVALID_CONFIG_NULL = "必须配置不能为空!";
    public static final String INVALID_CONFIG_MQHOST = "mqHost 不能为空！请填写服务地址，多个地址请用英文逗号分隔 ";

    public static final String INVALID_CONFIG_MQLookupdHOST = "mqLookupdHost 不能为空！请填写服务地址，多个地址请用英文逗号分隔 ";
    public static final String INVALID_CONFIG_MQLookupdPort = "mqLookupdPort 不能为空！请填写服务端口";

}
