package com.eisoo.dc.common.msq;

import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Properties;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Slf4j
@NoArgsConstructor
public class KafkaClient implements ProtonMQClient {

    private Properties config;
    private KafkaProducer<String, String> producer;

    // init kafkaclient
    public KafkaClient(Properties prop) {
        prop.remove(GlobalConfig.MQTYPE);
        this.config = prop;
        log.debug("config: {}", this.config);

        producer = new KafkaProducer<String, String>(this.config, new StringSerializer(), new StringSerializer());
    }

    @Override
    public void pub(String topic, String msg) {
        // produce record
        try {
            RecordMetadata metadata = producer.send(new ProducerRecord<String, String>(topic, msg)).get();

            log.debug(
                    "send completed; topic = {}, partition = {}, offset = {}", metadata.topic(), metadata.partition(),
                    metadata.offset());

            log.info("send completed msg: {}", msg);

        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            throw new SDKException.ClientException("proudcer execution exception");
        }
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, int... args) {
        if (handler == null) {
            log.error("args handler must be instantiated");
            throw new SDKException.ConfigInvalidException("args handler must be instantiated");
        }

        // config pollIntervalms and max_in_flight
        int pollIntervalms = 1000;
        int maxInFlight = 200;

        switch (args.length) {
            case 3:
                // msgTimeout not used currently
            case 2:
                maxInFlight = args[1];
            case 1:
                pollIntervalms = args[0];
                log.debug("use config: maxInFlingt={},pollIntervalms={}", maxInFlight,
                        pollIntervalms);
                break;
            default:
                log.debug("no optional args, use default,maxInFlight=200;pollIntervalms=100ms");
        }

        pollIntervalms = pollIntervalms > 1000 ? 1000 : pollIntervalms;
        pollIntervalms = pollIntervalms < 1 ? 1 : pollIntervalms;

        maxInFlight = maxInFlight > 256 ? 256 : maxInFlight;
        maxInFlight = maxInFlight < 1 ? 1 : maxInFlight;

        this.config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        this.config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        // coordinator heatbeat detection,consumer offline confrmation time,10s
        this.config.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10 * 1000);

        this.config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

        this.config.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1000);
        this.config.put(ConsumerConfig.FETCH_MAX_BYTES_CONFIG, 1000 * 1000);
        this.config.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, maxInFlight);
        // group id
        config.put(CommonClientConfigs.GROUP_ID_CONFIG, queue);

        // kafka consumer
        KafkaConsumer<String, String> consumer = new KafkaConsumer<String, String>(config);
        Collection<String> topics = new ArrayList<String>();
        topics.add(topic);
        // set topic
        consumer.subscribe(topics);

        try {
            while (true) {
                try {
                    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
                    for (ConsumerRecord<String, String> record : records) {
                        boolean processedSuccessfully = false;
                        log.info("topic = {}, patition = {}, offset = {}, key = {}, value = {}", record.topic(),
                                record.partition(), record.offset(), record.key(), record.value());
                        try {
                            handler.handler(record.value());
                            processedSuccessfully = true;
                            log.info("msg : {} consumed", record.value());
                        } catch (Exception e) {
                            log.error("consumer handler msg: {} exception:\n{}", record.value(), e.getMessage());
                        }

                        try {
                            // 先提交偏移量，无论消息是否处理成功
                            consumer.commitSync(Collections.singletonMap(new TopicPartition(record.topic(), record.partition()),
                                    new OffsetAndMetadata(record.offset() + 1)));
                            if (!processedSuccessfully) {
                                // 如果处理失败，且偏移量提交成功，再重新入队消息
                                this.resendToOriginalTopic(record.topic(), record.value());
                            }
                        } catch (Exception commitException) {
                            // 如果commitSync失败，记录日志并处理异常
                            log.error("offset commit failed for message: {} exception:\n{}", record.value(), commitException.getMessage());
                        }
                    }

                    if (records.count() == 0) {
                        // wait pollIntervalms when poll records is empty
                        TimeUnit.MILLISECONDS.sleep(pollIntervalms);
                    }
                } catch (Exception e) {

                    log.warn("kafka consume msg exception;\n{}", e.getMessage());
                }
            }
        } finally {
            consumer.close();
        }
    }

    @Override
    public void close() {
        // close
        if (producer != null) {
            producer.close();
        }
    }

    @Override
    public void pub(String topic, String msg, Properties config) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'pub'");
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, Properties config) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'sub'");
    }

    private void resendToOriginalTopic(String topic, String msg) {
        try {
            producer.send(new ProducerRecord<String, String>(topic, msg)).get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("resend msg: {} exception, detail: {}", msg, e);
        }
    }
}
