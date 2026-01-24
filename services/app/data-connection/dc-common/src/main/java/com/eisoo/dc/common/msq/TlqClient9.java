package com.eisoo.dc.common.msq;

import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

/**
 * 通天塔消息队列客户端的简化实现，使用Kafka作为后端
 */
@Slf4j
public class TlqClient9 implements ProtonMQClient {
    private KafkaMQClient kafkaClient;

    private String addr;

    private TlqClient9(Properties prop) {
        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);
        this.kafkaClient = KafkaMQClient.getInstance(prop);
    }

    public static TlqClient9 tlqClient9 = null;

    public static TlqClient9 getTlqClient9(Properties prop) {
        String addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

        // if nameserver changed, get new instance
        if (tlqClient9 == null || addr != tlqClient9.addr) {
            synchronized (TlqClient9.class) {
                if (tlqClient9 == null || addr != tlqClient9.addr) {
                    tlqClient9 = new TlqClient9(prop);
                    log.debug("client instance not exist,create a new one,{}", tlqClient9.addr);
                }
            }
        }
        return tlqClient9;
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
