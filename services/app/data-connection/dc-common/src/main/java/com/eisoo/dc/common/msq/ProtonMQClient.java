package com.eisoo.dc.common.msq;

import java.util.Properties;

/**
 * ProtonMQClient interface for simplified & commonly-used apis
 * use it buy new AClient() that AClient is class has implments ProtonMQClient
 * such as ProtonMQClient pmc=new KafkaClient(); {@link KafkaClient}
 * and use pmc.Pub()
 */

public interface ProtonMQClient {
    /**
     * Pub send a message to the specified topic of msq
     *
     * @param topic
     * @param msg
     */
    void pub(String topic, String msg);

    /**
     * Pub send a message to the specified topic of msq
     *
     * @param topic  required {@link String}
     * @param msg    required {@link String}
     * @param config pass options args;if no options args ,put null or put a
     *               zero size {@link Properties}
     */
    void pub(String topic, String msg, Properties config);

    /**
     * Sub start consumers to subscribe and process message from specified
     * topic/channel from the msg, the call would run
     * forever until the program is terminated
     *
     * @param topic   required {@link String}
     * @param queue   required {@link String}
     * @param handler business logic for message {@link MessageHandler}
     * @param args    {@link String}
     *                options 1> int pollIntervalMilliseconds: nsqlookupd interval
     *                time
     *
     *                2> int maxInFlight: max_in_flight,the max number of message in
     *                handlering
     *                3> int msg timeout
     */
    void sub(String topic, String queue, MessageHandler handler, int... args);

    /**
     * Sub start consumers to subscribe and process message from specified
     * topic/channel from the msg, the call would run
     * forever until the program is terminated
     *
     * @param topic   required {@link String}
     * @param queue   required {@link String}
     * @param handler required {@link MessageHandler} business logic for conusme
     *                message
     *
     * @param config  @param properties pass options args;if no options args ,put
     *                null or put a zero size Properties
     *                options 1> int pollIntervalMilliseconds: nsqlookupd interval
     *                time
     *
     *                2> int maxInFlight: maxInFlight,the max number of message in
     *                handlering
     *
     *                3> int msgTimeoutSecond: msg timeout seconds
     *
     *                4> int retryTimes: msg consume failed retry times
     */
    void sub(String topic, String queue, MessageHandler handler, Properties config);

    /**
     * Close() close connetion fo pub connection
     */
    void close();
}
