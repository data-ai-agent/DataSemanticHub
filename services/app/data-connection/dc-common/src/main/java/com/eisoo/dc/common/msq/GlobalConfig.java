package com.eisoo.dc.common.msq;

public final class GlobalConfig {

    private GlobalConfig() {
    }

    // optional args key

    // 消费者拉取消息时间间隔设置key
    public static final String POll_INTERVAL_MILLISECONDS = "pollIntervalMilliseconds";
    public static final int DEFAULT_POll_INTERVAL_MILLISECONDS = 1000;
    // 最大并发消费数设置 key
    public static final String MAX_INFLIGHT = "maxInFlight";
    public static final int DEFAULT_MAX_INFLIGHT = 256;
    // 消息消费超时时间设置 key
    public static final String MSG_TIMEOUT_SECONDS = "msgTimeoutSeconds";
    public static final int DEFAULT_MSG_TIMEOUT_SECONDS = 60;
    // 消息重试次数设置 key
    public static final String MSG_FAILED_RETRY_TIMES = "retryTimes";
    public static final int DEFAULT_MSG_FAILED_RETRY_TIMES = Integer.MAX_VALUE;

    // client type
    public static final String KAFKA = "kafka";
    public static final String NSQ = "nsq";
    public static final String BESMQ = "bmq";
    public static final String TONGLINK = "tonglink";
    public static final String TLQ_HTP20 = "htp20";

    // nsq useragent default name
    public static final String NSQ_USER_AGENT = "protonmsq-nsqwrapper";
    // nsq
    public static final String NSQ_HTTP_SCHEMA = "http://";
    public static final String NSQ_PRODUCER_URL = "/pub?topic=";

    // client config key
    public static final String MQTYPE = "mqType";
    public static final String HOST = "mqHost";
    public static final String PORT = "mqPort";
    public static final String LookupdHost = "mqLookupdHost";
    public static final String LookupdPORT = "mqLookupdPort";
    //client config key auth.
    public static final String UERNAME = "auth.username";
    public static final String PASSWORD = "auth.password";
    public static final String MECHANISM = "auth.mechanism";
    // address key
    public static final String MQ_ADDRESS = "bootstrap.servers";

    // mechanism
    public static final String MECHANISM_PLAIN = "PLAIN";
    public static final String MECHANISM_SCRAM_256 = "SCRAM-SHA-256";
    public static final String MECHANISM_SCRAM_512 = "SCRAM-SHA-512";

    // security.protocal
    public static final String PROTOCOL_SASL_PLAINTEXT = "SASL_PLAINTEXT";
    public static final String SASL_JAAS_CONFIG_PLAIN = "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";";
    public static final String SASL_JAAS_CONFIG_SCRAM = "org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";";

    // nsqLookupd host key
    public static final String NSQD_ADDRESS_KEY = "bootstrap.servers";
    public static final String NSQ_LOOKUPD_ADDRESS_KEY = "lookupdAddress";

    // tlq
    // domain
    public static final String TLQ_DOMAIN = "aishu";
    public static final String TLQ_TCP_SCHEMA = "tcp://";

    public static final int TLQ_SEND_MSG_TIMEOUT = 1 * 1000;
    public static final int TLQ_SEND_MSG_TIMEOUT_RETRY_TIMES = 3;
    public static final int TLQ_PULL_MSG_TIMEOUT = 1 * 1000;
    public static final int TLQ_PULL_MSG_TIMEOUT_RETRY_TIMES = 3;

    public static final int TLQ_PULL_FAILED_RETRY_TIMES = 3;

    public static final int TLQ_PULL_FAILED_INTERVALMS = 200;
    public static final int TLQ_START_FAILED_RETRY_INTERVALMS = 200;

    // bmq
    public static final int BMQ_CHECK_CONN_STATES_INTERVALMS = 200;
    public static final int BMQ_RECONN_INTERVALMS = 200;

}
