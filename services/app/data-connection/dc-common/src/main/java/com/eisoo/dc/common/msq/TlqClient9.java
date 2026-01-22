package com.eisoo.dc.common.msq;

import com.tongtech9.client.admin.TLQManager;
import com.tongtech9.client.common.ModeType;
import com.tongtech9.client.common.TopicType;
import com.tongtech9.client.consumer.PullResult;
import com.tongtech9.client.consumer.PullStatus;
import com.tongtech9.client.consumer.common.ConsumerAck;
import com.tongtech9.client.consumer.common.PullType;
import com.tongtech9.client.consumer.impl.TLQPullConsumer;
import com.tongtech9.client.exception.TLQClientException;
import com.tongtech9.client.light.producer.TLQLightProducer;
import com.tongtech9.client.message.Message;
import com.tongtech9.client.producer.SendResult;
import com.tongtech9.client.producer.SendStatus;
import lombok.extern.slf4j.Slf4j;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Slf4j
public class TlqClient9 implements ProtonMQClient {
    private TLQManager tlqManager = null;
    private TLQLightProducer producer = null;

    private String addr;

    private TlqClient9(Properties prop) {
        tlqManager = new TLQManager();

        producer = new TLQLightProducer();

        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

        try {
            // start TLQ_manager
            tlqManager.setNamesrvAddr(addr);
            tlqManager.start();

            if (!tlqManager.queryDomainExist(GlobalConfig.TLQ_DOMAIN)) {
                log.debug("domain: {} unexist in {},create it now", GlobalConfig.TLQ_DOMAIN,
                        addr);
                tlqManager.createDomain(GlobalConfig.TLQ_DOMAIN);
            }

            producer.setNamesrvAddr(addr);
            producer.setDomain(GlobalConfig.TLQ_DOMAIN);
            // default topic mode
            producer.setModeType(ModeType.TOPIC);
            producer.userProxy(0);
            // default topic mode
            producer.start();

        } catch (Exception e) {
            throw new SDKException.ClientException("init client exception;\n" +
                    e.toString());
        }
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
        initTopic(topic);

        try {
            Message tlqmsg = new Message();

            tlqmsg.setTopicOrQueue(topic);
            tlqmsg.setPersistence(1);
            tlqmsg.setBody(msg.getBytes());

            SendResult result = producer.send(tlqmsg, GlobalConfig.TLQ_SEND_MSG_TIMEOUT);

            if ((result != null) && (result.getSendStatus() == SendStatus.SEND_OK)) {
                log.info("send msg {} success,result:{}", msg, result.getSendStatus());

            } else {
                throw new SDKException.ClientException("send msg no exception but resultstatus is failed");
            }
        } catch (Exception e) {

            throw new SDKException.ClientException("tlq906 send msg exception;\n" +
                    e.getMessage());
        }
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, int... args) {
        // config pollIntervalms and max_in_flight
        new Thread(() -> {
            // config pollIntervalms and max_in_flight
            int pollIntervalms = 1000;
            int maxInFlight = 200;
            int msgTimeout = 60 * 1000;

            log.debug("handler msg timeout unused temporaily: {}", msgTimeout);

            switch (args.length) {
                case 3:
                    msgTimeout = args[2];
                case 2:
                    maxInFlight = args[1];
                case 1:
                    pollIntervalms = args[0];
                    break;
                default:
                    log.debug("no optional args, use default,maxInFlight=200;pollIntervalms=100ms");
            }

            pollIntervalms = pollIntervalms > 1000 ? 1000 : pollIntervalms;
            pollIntervalms = pollIntervalms < 1 ? 1 : pollIntervalms;

            maxInFlight = maxInFlight > 256 ? 256 : maxInFlight;
            maxInFlight = maxInFlight < 1 ? 1 : maxInFlight;

            RECONN: while (true) {
                int retry = 0;
                try {
                    TLQPullConsumer consumer = new TLQPullConsumer();
                    // consumer config
                    consumer.setNamesrvAddr(addr);

                    consumer.setDomain(GlobalConfig.TLQ_DOMAIN);
                    // default topic mode
                    consumer.setModeType(ModeType.TOPIC);
                    consumer.subscribe(topic);
                    consumer.setConsumerGroup(queue);
                    // close auto commit
                    consumer.setAutoCommit(false);

                    consumer.start();

                    log.info(" sync pull consumer [topic={},queue={}] start ......", topic, queue);

                    while (true) {
                        try {
                            // consumerOffset is not used while PullType=PullContinue
                            PullResult pullResult = consumer.pullMessage(PullType.PullContinue, 0, maxInFlight,
                                    GlobalConfig.TLQ_PULL_MSG_TIMEOUT);

                            if (pullResult.getPullStatus() == PullStatus.FOUND) {

                                pullResult.getMsgFoundList().forEach(msg -> {
                                    // handler exception will not stop consumer
                                    try {
                                        handler.handler(new String(msg.getBody()));

                                        log.info("msg: msgId={}, body={} consumed...", msg.getMsgId(),
                                                new String(msg.getBody()));
                                        log.debug(" consumed msg details: {}", msg);
                                    } catch (Exception e) {
                                        log.error("tlq906 consumer handler exception:\n{}", e.toString());
                                    }
                                });

                                // commit exception will rise to repeated consume;
                                // catch the exception guarantee consume continuously
                                try {
                                    consumer.consumerCommitAck(getAck(pullResult), pullResult.getMessageQueue());

                                } catch (Exception e) {
                                    throw new SDKException.ClientException(
                                            "tlq906 consumer commitexception:\n" + e);
                                }
                            }
                            // pull empty msg or size<maxInFlight wait pollInterval ms and pull again
                            if (pullResult.getPullStatus() == PullStatus.NO_NEW_MSG
                                    || pullResult.getMsgFoundList().size() < maxInFlight) {

                                try {
                                    TimeUnit.MICROSECONDS.sleep(pollIntervalms);
                                } catch (Exception e) {
                                    log.warn("tlq906 consumer wait to reconnect exception;it will auto retry\n",
                                            e.getMessage());
                                }
                            }

                        } catch (Exception e) {
                            log.warn("pull msg exception,retry!\n {} ", e.getMessage());

                            retry++;

                            if (retry <= GlobalConfig.TLQ_PULL_FAILED_RETRY_TIMES) {
                                // consumer pull msg retry interval:
                                try {
                                    TimeUnit.MILLISECONDS.sleep(GlobalConfig.TLQ_PULL_FAILED_INTERVALMS);
                                } catch (Exception waite) {
                                    log.warn("tlq906 consumer wait to reconnect exception;it will auto retry\n",
                                            waite.getMessage());
                                }

                                continue;

                            } else {
                                consumer.shutdown();
                                // create consumer connection
                                continue RECONN;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("init tlq906 consumer exception,will retry...", e.getMessage());

                    // start tlq906 consumer failed, retry interval:
                    try {
                        TimeUnit.MILLISECONDS.sleep(GlobalConfig.TLQ_START_FAILED_RETRY_INTERVALMS);
                    } catch (Exception waite) {
                        log.warn("tlq906 consumer wait to start retry exception;it will auto retry again\n",
                                waite.getMessage());
                    }
                }
            }
        }).start();
    }

    /**
     * close() nothing to do
     *
     */
    @Override
    public void close() {
        // close client resource
        if (tlqManager != null) {
            tlqManager.shutdown();
        }
        if (producer != null) {
            producer.shutdown();
        }
    }

    /**
     * producer or consumer couldnt automatically create unexist Domain or
     * topic,create it if need here
     *
     * @param topic TopicType:normal;ModeType:topic
     */
    private void initTopic(String topic) {
        try {
            // create topic if unexist;
            try {
                tlqManager.queryTopicExist(topic, GlobalConfig.TLQ_DOMAIN);
            } catch (TLQClientException e) {
                log.debug(
                        "topic: {} unexist in domain {} at {},create it now; {}", topic,
                        GlobalConfig.TLQ_DOMAIN, addr, e.toString());
                tlqManager.createTopic(topic, TopicType.EVENT, GlobalConfig.TLQ_DOMAIN);
            }
        } catch (Exception e) {
            throw new SDKException.ClientException("tlqclient906 exception when init topic;\n" + e.toString());
        }
    }

    private static ConsumerAck getAck(PullResult pullResult) {
        ConsumerAck ack = new ConsumerAck();
        ack.setTopicOrQueue(pullResult.getTopic());
        ack.setGroupName(pullResult.getGroupName());
        ack.setDomain(pullResult.getDomain());
        ack.setMinConsumeQueueOffset(pullResult.getMinConsumeQueueOffset());
        ack.setMaxConsumeQueueOffset(pullResult.getMaxConsumeQueueOffset());
        ack.setConsumeHistoryOffset(pullResult.getConsumeHistoryOffset());
        ack.setAckNum(pullResult.getMsgFoundList().size());
        ack.setQueueId(pullResult.getMsgFoundList().get(0).getQueueID());
        ack.setConsumerId(pullResult.getConsumerId());
        ack.setClientId(pullResult.getClientId());
        return ack;
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
}
