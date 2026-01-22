package com.eisoo.dc.common.msq;

import com.bes.mq.BESMQConnection;
import com.bes.mq.BESMQConnectionFactory;
import com.bes.mq.BESMQMessageConsumer;
import com.bes.mq.BESMQMessageProducer;
import com.bes.mq.BESMQSession;
import com.bes.mq.command.BESMQQueue;
import com.bes.mq.command.BESMQTextMessage;
import com.bes.mq.command.BESMQTopic;
import lombok.extern.slf4j.Slf4j;

import javax.jms.DeliveryMode;
import javax.jms.Message;
import javax.jms.MessageListener;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Slf4j
public class BmqClient implements ProtonMQClient {
    private BESMQConnectionFactory factory;
    private BESMQConnection connection;
    private BESMQSession session;
    private BESMQMessageProducer producer;

    public static BmqClient bmqclient;

    private String addr;

    private BmqClient(Properties prop) {
        this.addr = GlobalConfig.TLQ_TCP_SCHEMA + prop.getProperty(GlobalConfig.MQ_ADDRESS);

        factory = new BESMQConnectionFactory(addr);

        try {

            connection = (BESMQConnection) factory.createConnection();
            connection.start();

            session = (BESMQSession) connection.createSession(false, BESMQSession.CLIENT_ACKNOWLEDGE);

        } catch (Exception e) {
            throw new SDKException.ClientException("besmq topic session exception;\n" + e.getMessage());
        }
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

        if (session == null) {
            throw new SDKException.ClientException("besmq session is null when will useit to create topic");
        }

        try {
            BESMQTopic bmqtopic = (BESMQTopic) session.createTopic(topic);
            producer = (BESMQMessageProducer) session.createProducer(bmqtopic);
            producer.setDeliveryMode(DeliveryMode.PERSISTENT);
            BESMQTextMessage bmqmsg = (BESMQTextMessage) session.createTextMessage(msg);

            producer.send(bmqmsg);

            log.info("msg: {} send ok", bmqmsg.getText());

            log.debug("msg: {} send ok; session: {}", bmqmsg, session);

        } catch (Exception e) {
            throw new SDKException.ClientException("besmq TopicPublisher send msg exception;\n" +
                    e.getMessage());
        }
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

        new Thread(() -> {
            BESMQConnection connection = null;
            BESMQSession session = null;
            BESMQMessageConsumer consumer = null;

            RECONN: while (true) {

                try {
                    // consumer use own connection
                    connection = (BESMQConnection) factory.createConnection();
                    connection.start();

                    session = (BESMQSession) connection.createSession(false, BESMQSession.CLIENT_ACKNOWLEDGE);
                    // virture queue
                    String clientID = "Consumer." + queue + "." + topic;
                    BESMQQueue vq = (BESMQQueue) session.createQueue(clientID);
                    consumer = (BESMQMessageConsumer) session.createConsumer(vq);

                    consumer.setMessageListener(new SubscriberMessageListener(handler));

                    log.info("Subscriber are waiting to receive the message...");

                    // listen the connection
                    while (true) {
                        if (connection.isClosed() || connection.isClosing() || connection.isTransportFailed()) {

                            log.info("connection is closed, will retry!");
                            continue RECONN;
                        }
                        try {
                            TimeUnit.MILLISECONDS.sleep(GlobalConfig.BMQ_CHECK_CONN_STATES_INTERVALMS);
                        } catch (Exception waite) {
                            log.warn("bmq consumer wait to check conncetion stats exception;it will auto retry\n",
                                    waite.getMessage());
                        }
                    }

                } catch (Exception e) {
                    log.error("bmq consumer exception;\n{}", e.getMessage());

                    // reconncetion intervalms:
                    try {
                        TimeUnit.MILLISECONDS.sleep(GlobalConfig.BMQ_RECONN_INTERVALMS);
                    } catch (Exception waite) {
                        log.warn("bmq consumer wait to reconnect exception;it will auto retry\n", waite.getMessage());
                    }
                }
            }
        }).start();
    }

    @Override
    public void close() {
        // close
        try {
            if (producer != null) {
                producer.close();
            }
            if (session != null) {
                session.close();
            }
            if (connection != null) {
                connection.close();
            }
        } catch (Exception e) {
            throw new SDKException.ClientException("besmq close resource exception;\n" +
                    e.getMessage());
        }
    }

    // adapt msg handler
    private class SubscriberMessageListener implements MessageListener {
        private MessageHandler handler;

        SubscriberMessageListener(MessageHandler handler) {
            this.handler = handler;
        }

        @Override
        public void onMessage(Message msg) {
            String msgBody = null;

            try {
                // get msg body
                msgBody = ((BESMQTextMessage) msg).getText();
                // handler
                handler.handler(msgBody);

                msg.acknowledge();

                log.info("msg: {} consumered...", msgBody);

            } catch (Exception e) {

                log.error("besmq consume msg: {} \n exception: {}", msgBody, e.getMessage());
            }
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
}
