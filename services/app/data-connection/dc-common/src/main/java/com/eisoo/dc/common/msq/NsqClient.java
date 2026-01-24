package com.eisoo.dc.common.msq;

import lombok.extern.slf4j.Slf4j;

import java.util.Properties;

/**
 * NSQ 消息队列客户端的简化实现，使用Kafka作为后端
 */
@Slf4j
public class NsqClient implements ProtonMQClient {
    private KafkaMQClient kafkaClient;

    private String addr;

    public NsqClient(Properties prop) {  // 改为public
        this.addr = prop.getProperty(GlobalConfig.MQ_ADDRESS);
        this.kafkaClient = KafkaMQClient.getInstance(prop);
    }

    public static NsqClient nsqClient = null;

    public static NsqClient getNsqClient(Properties prop) {
        String addr = prop.getProperty(GlobalConfig.MQ_ADDRESS);

        if (nsqClient == null || !addr.equals(nsqClient.addr)) {
            synchronized (NsqClient.class) {
                if (nsqClient == null || !addr.equals(nsqClient.addr)) {
                    nsqClient = new NsqClient(prop);
                    log.debug("nsq client instance not exist, create a new one, {}", nsqClient.addr);
                }
            }
        }
        return nsqClient;
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