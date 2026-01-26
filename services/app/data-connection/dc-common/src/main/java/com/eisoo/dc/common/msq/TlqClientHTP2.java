package com.eisoo.dc.common.msq;

import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

/**
 * 通天塔HTTP2消息队列客户端的简化实现，使用Kafka作为后端
 */
@Slf4j
public class TlqClientHTP2 implements ProtonMQClient {
    private KafkaMQClient kafkaClient;

    private String addr;

    private TlqClientHTP2(Properties prop) {
        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);
        this.kafkaClient = KafkaMQClient.getInstance(prop);
    }

    public static TlqClientHTP2 tlqClientHTP2 = null;

    public static TlqClientHTP2 getTlqClientHTP2(Properties prop) {
        String addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

        if (tlqClientHTP2 == null || !addr.equals(tlqClientHTP2.addr)) {
            synchronized (TlqClientHTP2.class) {
                if (tlqClientHTP2 == null || !addr.equals(tlqClientHTP2.addr)) {
                    tlqClientHTP2 = new TlqClientHTP2(prop);
                    log.debug("client htp2 instance not exist,create a new one,{}", tlqClientHTP2.addr);
                }
            }
        }
        return tlqClientHTP2;
    }

    @Override
    public void pub(String topic, String msg) {
        kafkaClient.pub(topic, msg);
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, int... args) {
        kafkaClient.sub(topic, queue, handler, args);
    }

    @Override
    public void close() {
        kafkaClient.close();
    }

    @Override
    public void pub(String topic, String msg, Properties config) {
        kafkaClient.pub(topic, msg, config);
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, Properties config) {
        kafkaClient.sub(topic, queue, handler, config);
    }
}