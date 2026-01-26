package com.eisoo.dc.common.msq;

import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

/**
 * Bes消息队列客户端的简化实现，使用Kafka作为后端
 */
@Slf4j
public class BmqClient implements ProtonMQClient {
    private KafkaMQClient kafkaClient;

    public static BmqClient bmqclient;

    private String addr;

    private BmqClient(Properties prop) {
        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);
        this.kafkaClient = KafkaMQClient.getInstance(prop);
    }

    public static BmqClient getBmqClient(Properties prop) {
        String addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

        // if nameserver changed, get new instance
        if (bmqclient == null || addr != bmqclient.addr) {
            synchronized (BmqClient.class) {
                if (bmqclient == null || addr != bmqclient.addr) {
                    log.debug("bmqclient is null or addr is different,create a new client:{}", addr);
                    bmqclient = new BmqClient(prop);
                }
            }
        }
        return bmqclient;
    }

    @Override
    public void pub(String topic, String msg) {
        kafkaClient.pub(topic, msg);
    }

    /**
     * ProtonBMQClient.Sub start a message processing loop
     *
     * @param topic:   bmq topic to subscribe
     * @param channel: bmq queue to subscribe, only first 31 bytes will be used.
     * @param handler: registered message handler function
     * @param args
     *                 unsued now
     */
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
