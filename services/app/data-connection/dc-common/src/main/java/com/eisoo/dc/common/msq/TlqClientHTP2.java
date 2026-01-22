package com.eisoo.dc.common.msq;

import com.eisoo.dc.common.util.CommonUtil;
import com.tongtech.client.admin.TLQManager;
import com.tongtech.client.common.ModeType;
import com.tongtech.client.common.TopicType;
import com.tongtech.client.consumer.PullResult;
import com.tongtech.client.consumer.PullStatus;
import com.tongtech.client.consumer.common.ConsumerAck;
import com.tongtech.client.consumer.common.PullType;
import com.tongtech.client.consumer.impl.TLQPullConsumer;
import com.tongtech.client.exception.TLQClientException;
import com.tongtech.client.light.producer.TLQLightProducer;
import com.tongtech.client.message.Message;
import com.tongtech.client.producer.SendResult;
import com.tongtech.client.producer.SendStatus;
import lombok.extern.slf4j.Slf4j;

import java.util.Hashtable;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

@Slf4j
public class TlqClientHTP2 implements ProtonMQClient {
    private TLQManager tlqManager = null;
    private TLQLightProducer producer = null;
    private Hashtable<String, Boolean> initTopicFlag = new Hashtable<>();
    private Hashtable<String, Boolean> retryTopicFlag = new Hashtable<>();

    private String addr;

    private TlqClientHTP2(Properties prop) {

        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

    }

    public static TlqClientHTP2 tlqClientHTP2 = null;

    public static TlqClientHTP2 getTlqClientHTP2(Properties prop) {

        String addr = prop.getProperty(GlobalConfig.MQ_ADDRESS);

        // if nameserver changed, get new instance
        if (tlqClientHTP2 == null || addr != tlqClientHTP2.addr) {
            synchronized (TlqClientHTP2.class) {
                if (tlqClientHTP2 == null || addr != tlqClientHTP2.addr) {
                    tlqClientHTP2 = new TlqClientHTP2(prop);
                }
            }
        }
        return tlqClientHTP2;
    }

    @Override
    public void pub(String topic, String msg) {
        // 适配消息类型
        Message tlqmsg = new Message();
        tlqmsg.setTopicOrQueue(topic);
        tlqmsg.setPersistence(1);
        tlqmsg.setBody(msg.getBytes());

        pub(topic, tlqmsg);
    }

    @Override
    public void pub(String topic, String msg, Properties config) {
        // 生产者方法暂时没有可选参数
        pub(topic, msg);
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, int... args) {
        // 根据topic确定重试topic名称
        String retryTopic = topic + "_" + queue + "_retry";

        // 这里的操作，保证订阅常规topic前，先订阅对应的消费失败重试topic
        if (retryTopicFlag.get(topic) == null) {
            retryTopicFlag.put(retryTopic, true);

            sub(retryTopic, queue, handler, args);
        }
        // start a thread
        new Thread(() -> {
            // config pollIntervalms and max_in_flight
            int pollIntervalms = 1000;
            int maxInFlight = 256;
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

            TLQPullConsumer consumer = null;
            while (true) {
                try {
                    consumer = new TLQPullConsumer();
                    // consumer config
                    consumer.setNamesrvAddr(addr);

                    consumer.setDomain(GlobalConfig.TLQ_DOMAIN);
                    // default topic mode
                    consumer.setModeType(ModeType.TOPIC);
                    consumer.subscribe(topic);
                    consumer.setConsumerGroup(queue);
                    // close auto commit
                    consumer.setAutoCommit(false);

                    log.info("before start..");
                    consumer.start();

                    log.info(" sync pull consumer [topic={},queue={}] start ......", topic, queue);
                } catch (Exception e) {
                    log.error("init tlqHTP2.0 consumer exception,will retry...\n{}", e.toString());
                    // close
                    consumer.shutdown();
                    // start tlqHTP2.0 consumer failed, retry interval:
                    try {
                        TimeUnit.MILLISECONDS.sleep(GlobalConfig.TLQ_START_FAILED_RETRY_INTERVALMS);
                    } catch (Exception waite) {
                        log.warn("tlqHTP2.0 consumer wait to start retry exception;it will retry automatically \n",
                                waite.getMessage());
                    }
                    continue;
                }
                while (true) {
                    try {
                        // consumerOffset is not used while PullType=PullContinue
                        PullResult pullResult = consumer.pullMessage(PullType.PullContinue, 0, maxInFlight, msgTimeout);

                        if (pullResult.getPullStatus() == PullStatus.FOUND) {
                            CountDownLatch latch = new CountDownLatch(pullResult.getMsgFoundList().size());
                            pullResult.getMsgFoundList().forEach(msg -> {
                                // handler exception will not stop consumer
                                new Thread(() -> {
                                    try {
                                        handler.handler(new String(msg.getBody()));

                                        log.info("msg: msgId={}, body={} consumed...", msg.getMsgId(),
                                                new String(msg.getBody()));
                                        log.debug(" consumed msg details: {}", msg);

                                    } catch (Exception e) {
                                        log.error("handler exception:\n{}", e.toString());

                                        // consume failed, requeue
                                        try {
                                            pub(retryTopic, new String(msg.getBody()));
                                            log.info("msg {} requeued", msg);
                                        } catch (Exception requeuee) {
                                            log.warn("requeue msg failed while consume exception",
                                                    requeuee.getMessage());
                                        }
                                    }
                                    // 解锁
                                    latch.countDown();

                                }).start();

                            });
                            // catch the exception guarantee consume continuously
                            try {
                                latch.await();
                                consumer.consumerCommitAck(getAck(pullResult), pullResult.getMessageQueue());

                            } catch (Exception e) {
                                log.warn("tlqHTP2.0 consumer commit exception, it will repull:\n",
                                        e.getMessage());
                            }
                        }
                        // pull empty msg or size<maxInFlight wait pollInterval ms and pull again
                        if (pullResult.getPullStatus() == PullStatus.NO_NEW_MSG) {
                            try {
                                TimeUnit.MICROSECONDS.sleep(pollIntervalms);
                            } catch (Exception waite) {
                                log.warn("tlqHTP2.0 consumer wait to pull msg exception;it will continue in\n",
                                        waite.getMessage());
                            }
                        }
                    } catch (Exception e) {
                        log.warn("pull msg exception,retry!\n {} ", e.getMessage());
                        // when pull msg exception,consumer will retry
                        // GlobalConfig.TLQ_PULL_FAILED_RETRY_TIMES of intervalms
                        // GlobalConfig.TLQ_PULL_FAILED_INTERVALMS
                        // then goto recreate connection and new consumer instance
                        try {
                            TimeUnit.MILLISECONDS.sleep(pollIntervalms);
                        } catch (Exception waite) {
                            log.warn("tlqHTP2.0 consumer wait to reconnect exception;it will auto retry\n",
                                    waite.getMessage());
                        }
                    }
                }
            }
        }).start();
    }

    @Override
    public void sub(String topic, String queue, MessageHandler handler, Properties config) {
        // 校验自定义参数
        int pollIntervalms = CommonUtil.validPollIntervalms(config);

        int maxInFlight = CommonUtil.validMaxInFlight(config);

        int msgTimeout = CommonUtil.validMsgTimeout(config);

        int retryTimes = CommonUtil.validRetryTimes(config);

        // 先订阅主题
        sub(topic, queue, handler, pollIntervalms, maxInFlight, msgTimeout, retryTimes, false);

        String retryTopic = topic + "_" + queue + "_retry";
        // 再订阅重试主题
        sub(retryTopic, queue, handler, pollIntervalms, maxInFlight, msgTimeout, retryTimes, true);
    }

    private void pub(String topic, Message msg) {
        // if domain or topic not exist,create firstly
        if (initTopicFlag.get(topic) == null) {
            initTopic(topic);
        }

        try {
            // init proudcer instance if not exist
            if (producer == null) {
                producer = new TLQLightProducer();
                producer.setNamesrvAddr(addr);
                producer.setDomain(GlobalConfig.TLQ_DOMAIN);
                // default topic mode
                producer.setModeType(ModeType.TOPIC);
                producer.start();

                log.debug(" prudcer started ........", topic, msg);

            }

            SendResult result = producer.send(msg, GlobalConfig.TLQ_SEND_MSG_TIMEOUT);

            if ((result != null) && (result.getSendStatus() == SendStatus.SEND_OK)) {
                log.info("send msg {} success,result:{}", msg, result);
            } else {
                log.debug("sned msg result: {}", result);

                throw new SDKException.ClientException("send msg no exception but result status is failed");
            }
        } catch (Exception e) {
            throw new SDKException.ClientException("send msg exception;\n" + e);
        }
    }

    private void sub(String topic, String queue, MessageHandler handler, int pollIntervalms, int maxInFlight,
            int msgTimeout, int retryTimes, boolean isRetry) {

        // 如果是重试主题，则只需向原主题发送消息；如果消费的主题不是重试主题，消费失败时向重试主题重发消息；
        String retryTopic = isRetry ? topic : topic + "_" + queue + "_retry";
        // consumer thread
        new Thread(() -> {
            TLQPullConsumer consumer = null;
            int recreate = 0;

            RECREATE: while (true) {
                try {
                    consumer = new TLQPullConsumer();
                    // consumer config
                    consumer.setNamesrvAddr(addr);

                    consumer.setDomain(GlobalConfig.TLQ_DOMAIN);
                    // default topic mode
                    consumer.setModeType(ModeType.TOPIC);
                    consumer.subscribe(topic);
                    consumer.setConsumerGroup(queue);
                    // close auto commit
                    consumer.setAutoCommit(false);

                    log.info("before start..");
                    consumer.start();

                    log.info(" sync pull consumer [topic={},queue={}] start ......", topic, queue);
                } catch (Exception e) {
                    log.error("init tlqHTP2.0 consumer exception,will retry...\n{}", e.toString());
                    // close
                    consumer.shutdown();
                    // start tlqHTP2.0 consumer failed, retry interval:
                    try {
                        TimeUnit.MILLISECONDS.sleep(GlobalConfig.TLQ_START_FAILED_RETRY_INTERVALMS);
                    } catch (Exception waite) {
                        log.warn("tlqHTP2.0 consumer wait to start retry exception;it will retry automatically \n",
                                waite.getMessage());
                    }
                    continue;
                }

                // 拉取消息失败重试次数
                int repull = 0;

                while (true) {
                    try {
                        // consumerOffset is not used while PullType=PullContinue
                        PullResult pullResult = consumer.pullMessage(PullType.PullContinue, 0, maxInFlight, msgTimeout);

                        if (pullResult.getPullStatus() == PullStatus.FOUND) {
                            // 拉去成功后重置
                            repull = 0;
                            // 给并发操作加锁，保证多线程消费逻辑都执行完；但这样会使得消费速度取决于最慢的那一个
                            CountDownLatch latch = new CountDownLatch(pullResult.getMsgFoundList().size());

                            pullResult.getMsgFoundList().forEach(msg -> {

                                // handler exception will not stop consumer
                                new Thread(() -> {
                                    try {
                                        handler.handler(new String(msg.getBody()));

                                        log.info("msg: msgId={}, body={} consumed...", msg.getMsgId(),
                                                new String(msg.getBody()));
                                        log.debug(" consumed msg details: {}", msg);

                                    } catch (Exception e) {
                                        log.error("handler exception:\n{}", e.toString());

                                        // consume failed, requeue
                                        // 消费失败重试前，先判断消费次数，如果消费次数超过限制，则打印日志后不再消费；如果还没有达到重试上限，发送重试，并把次数+ 1
                                        try {
                                            int retry = 0;
                                            Map<String, Object> map = msg.getAttr();

                                            retry = (int) map.getOrDefault("retryTimes", 0);

                                            if (retry < retryTimes) {
                                                map.put("retryTimes", retry + 1);

                                                msg.setAttr(map);

                                                pub(retryTopic, msg);

                                                log.info("msg {} requeued", msg);

                                            } else {
                                                log.warn(
                                                        "msg {} comsume failed {} times; it will be acked and not be consumed again",
                                                        msg, retryTimes);
                                            }

                                        } catch (Exception requeuee) {
                                            log.warn("requeue msg failed while consume exception",
                                                    requeuee.getMessage());
                                        }
                                    }
                                    // 解锁
                                    latch.countDown();

                                }).start();

                            });
                            // catch the exception guarantee consume continuously
                            try {
                                latch.await();
                                consumer.consumerCommitAck(getAck(pullResult), pullResult.getMessageQueue());

                            } catch (Exception e) {
                                log.warn("tlqHTP2.0 consumer commit exception, it will repull:\n",
                                        e.getMessage());
                            }
                        }
                        // pull empty msg or size<maxInFlight wait pollInterval ms and pull again
                        if (pullResult.getPullStatus() == PullStatus.NO_NEW_MSG) {
                            try {
                                TimeUnit.MICROSECONDS.sleep(pollIntervalms);
                            } catch (Exception waite) {
                                log.warn("tlqHTP2.0 consumer wait to pull msg exception;it will continue in\n",
                                        waite.getMessage());
                            }
                        }
                    } catch (Exception e) {
                        log.warn("pull msg exception,retry!\n {} ", e.getMessage());
                        // when pull msg exception,consumer will retry
                        // GlobalConfig.TLQ_PULL_FAILED_RETRY_TIMES of intervalms
                        // GlobalConfig.TLQ_PULL_FAILED_INTERVALMS
                        // then goto recreate connection and new consumer instance
                        repull++;

                        if (repull > GlobalConfig.TLQ_PULL_FAILED_RETRY_TIMES) {
                            consumer.shutdown();
                            if (recreate > 10) {
                                log.error("pull msg exception too many times, exit!\n {} ", e.getMessage());
                                System.exit(1);
                            }
                            recreate ++;
                            try {
                                Thread.sleep(10000);
                                continue RECREATE;
                            } catch (Exception waite) {
                                log.warn("tlqHTP2.0 consumer wait to reconnect exception;it will auto retry\n",
                                        waite.getMessage());
                            }
                        }

                        try {
                            TimeUnit.MILLISECONDS.sleep(pollIntervalms);
                        } catch (Exception waite) {
                            log.warn("tlqHTP2.0 consumer wait to reconnect exception;it will auto retry\n",
                                    waite.getMessage());
                        }
                    }
                }
            }
        }).start();
    }

    /**
     * close() close resources
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
            // init tlqManager if not exist
            if (tlqManager == null) {
                tlqManager = new TLQManager();

                // start TLQ_manager
                tlqManager.setNamesrvAddr(addr);
                tlqManager.start();
            }
            // create domain if unexist;
            try {
                tlqManager.queryDomainExist(GlobalConfig.TLQ_DOMAIN);
            } catch (TLQClientException e) {
                log.debug(
                        "domain: {} unexist i,create it now; {}",
                        GlobalConfig.TLQ_DOMAIN, addr, e.toString());
                tlqManager.createDomain(GlobalConfig.TLQ_DOMAIN);
            }
            // create topic if unexist;
            try {
                tlqManager.queryTopicExist(topic, GlobalConfig.TLQ_DOMAIN);
            } catch (TLQClientException e) {
                log.debug(
                        "topic: {} unexist in domain {} at {},create it now; {}", topic,
                        GlobalConfig.TLQ_DOMAIN, addr, e.toString());
                tlqManager.createTopic(topic, TopicType.NORMAL, GlobalConfig.TLQ_DOMAIN);
                // 创建后设置标志
                initTopicFlag.put(topic, true);
            }
        } catch (Exception e) {
            throw new SDKException.ClientException("tlqClient exception when init topic;\n" + e);
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

}