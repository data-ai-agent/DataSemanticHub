package com.eisoo.dc.common.msq;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Collections;
import java.util.Properties;
import java.util.concurrent.Future;

/**
 * 使用Kafka作为底层实现的消息队列客户端
 */
@Slf4j
public class KafkaMQClient implements ProtonMQClient {

    private KafkaProducer<String, String> producer;
    private String bootstrapServers;

    private KafkaMQClient(Properties props) {
        this.bootstrapServers = props.getProperty(GlobalConfig.MQ_ADDRESS);
        
        Properties kafkaProps = new Properties();
        kafkaProps.put("bootstrap.servers", this.bootstrapServers);
        kafkaProps.put("key.serializer", StringSerializer.class.getName());
        kafkaProps.put("value.serializer", StringSerializer.class.getName());
        kafkaProps.put("acks", "1");
        kafkaProps.put("retries", 3);
        kafkaProps.put("batch.size", 16384);
        kafkaProps.put("linger.ms", 1);
        kafkaProps.put("buffer.memory", 33554432);
        
        // 添加用户传入的自定义配置
        for (String key : props.stringPropertyNames()) {
            kafkaProps.put(key, props.getProperty(key));
        }

        this.producer = new KafkaProducer<>(kafkaProps);
    }

    public static KafkaMQClient getInstance(Properties props) {
        return new KafkaMQClient(props);
    }

    @Override
    public void pub(String topic, String msg) {
        try {
            ProducerRecord<String, String> record = new ProducerRecord<>(topic, msg);
            Future<RecordMetadata> future = producer.send(record);
            RecordMetadata metadata = future.get();
            
            log.info("Message sent successfully to topic: {}, partition: {}, offset: {}", 
                    metadata.topic(), metadata.partition(), metadata.offset());
        } catch (Exception e) {
            log.error("Failed to send message to topic: " + topic, e);
            throw new SDKException.ClientException("Kafka send message exception: " + e.getMessage());
        }
    }

    @Override
    public void pub(String topic, String msg, Properties config) {
        try {
            ProducerRecord<String, String> record = new ProducerRecord<>(topic, msg);
            Future<RecordMetadata> future = producer.send(record);
            RecordMetadata metadata = future.get();
            
            log.info("Message sent successfully to topic: {}, partition: {}, offset: {}", 
                    metadata.topic(), metadata.partition(), metadata.offset());
        } catch (Exception e) {
            log.error("Failed to send message to topic: " + topic, e);
            throw new SDKException.ClientException("Kafka send message exception: " + e.getMessage());
        }
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, int... args) {
        // 创建一个新的线程来运行消费者
        new Thread(() -> {
            Properties kafkaProps = new Properties();
            kafkaProps.put("bootstrap.servers", this.bootstrapServers);
            kafkaProps.put("group.id", queue); // 使用queue参数作为consumer group id
            kafkaProps.put("key.deserializer", StringDeserializer.class.getName());
            kafkaProps.put("value.deserializer", StringDeserializer.class.getName());
            kafkaProps.put("auto.offset.reset", "latest"); // 从最新消息开始消费
            kafkaProps.put("enable.auto.commit", "false"); // 手动提交偏移量

            KafkaConsumer<String, String> consumer = new KafkaConsumer<>(kafkaProps);
            consumer.subscribe(Collections.singletonList(topic));

            try {
                while (true) {
                    ConsumerRecords<String, String> records = consumer.poll(
                        java.time.Duration.ofMillis(1000));
                    
                    for (ConsumerRecord<String, String> record : records) {
                        try {
                            // 调用用户提供的消息处理器
                            handler.handler(record.value());
                            
                            log.info("Message processed successfully from topic: {}, partition: {}, offset: {}", 
                                    record.topic(), record.partition(), record.offset());
                                    
                            // 手动提交偏移量
                            consumer.commitSync();
                        } catch (Exception e) {
                            log.error("Error processing message: " + record.value(), e);
                            // 根据业务需求决定是否继续消费或抛出异常
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error in Kafka consumer", e);
            } finally {
                consumer.close();
            }
        }).start();
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, Properties config) {
        // 创建一个新的线程来运行消费者
        new Thread(() -> {
            Properties kafkaProps = new Properties();
            kafkaProps.put("bootstrap.servers", this.bootstrapServers);
            kafkaProps.put("group.id", queue); // 使用queue参数作为consumer group id
            kafkaProps.put("key.deserializer", StringDeserializer.class.getName());
            kafkaProps.put("value.deserializer", StringDeserializer.class.getName());
            kafkaProps.put("auto.offset.reset", "latest"); // 从最新消息开始消费
            kafkaProps.put("enable.auto.commit", "false"); // 手动提交偏移量

            // 添加用户传入的自定义配置
            for (String key : config.stringPropertyNames()) {
                kafkaProps.put(key, config.getProperty(key));
            }

            KafkaConsumer<String, String> consumer = new KafkaConsumer<>(kafkaProps);
            consumer.subscribe(Collections.singletonList(topic));

            try {
                while (true) {
                    ConsumerRecords<String, String> records = consumer.poll(
                        java.time.Duration.ofMillis(1000));
                    
                    for (ConsumerRecord<String, String> record : records) {
                        try {
                            // 调用用户提供的消息处理器
                            handler.handler(record.value());
                            
                            log.info("Message processed successfully from topic: {}, partition: {}, offset: {}", 
                                    record.topic(), record.partition(), record.offset());
                                    
                            // 手动提交偏移量
                            consumer.commitSync();
                        } catch (Exception e) {
                            log.error("Error processing message: " + record.value(), e);
                            // 根据业务需求决定是否继续消费或抛出异常
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error in Kafka consumer", e);
            } finally {
                consumer.close();
            }
        }).start();
    }

    @Override
    public void close() {
        if (producer != null) {
            producer.close();
        }
    }
}