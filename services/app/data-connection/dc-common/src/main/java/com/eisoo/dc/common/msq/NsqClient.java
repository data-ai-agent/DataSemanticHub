package com.eisoo.dc.common.msq;

import com.eisoo.dc.common.util.CommonUtil;
import com.sproutsocial.nsq.Client;
import com.sproutsocial.nsq.Message;
import com.sproutsocial.nsq.Subscriber;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

import java.io.IOException;
import java.util.Properties;
import java.util.concurrent.Executors;

@Data
@Slf4j
public class NsqClient implements ProtonMQClient {
    // config connet to broker or lookupd
    private Properties config;

    private Subscriber consumer = null;
    private Client client = Client.getDefaultClient();

    private CloseableHttpResponse response = null;

    // init nsq construct
    public NsqClient(Properties prop) {
        this.config = prop;
    }

    @Override
    public void pub(String topic, String msg) {
        // POST http://host:<port>/pub?topic=""

        // create Httpclient
        CloseableHttpClient httpClient = HttpClients.createDefault();

        String url = GlobalConfig.NSQ_HTTP_SCHEMA + this.config.getProperty(GlobalConfig.NSQD_ADDRESS_KEY)
                + GlobalConfig.NSQ_PRODUCER_URL + topic;
        log.debug("nsq producer url: {}", url);
        try {
            // create Http Post request
            HttpPost httpPost = new HttpPost(url);
            httpPost.addHeader("User-Agent", "protonmsq.nsqwrapper");
            httpPost.addHeader("Content-Type", "application/octet-stream;charset=utf-8");

            StringEntity entity = new StringEntity(msg, "UTF-8");
            entity.setContentType(ContentType.APPLICATION_OCTET_STREAM.getMimeType());
            httpPost.setEntity(entity);
            // do http request
            response = httpClient.execute(httpPost);

            String result = EntityUtils.toString(response.getEntity(), "utf-8");
            log.info("produce msg: {},result: {}", msg, result);

            if (response.getStatusLine().getStatusCode() < 200 || response.getStatusLine().getStatusCode() >= 300) {
                throw new SDKException.ClientException(
                        "nsq producer send msg response code unexpected:  " + response.getStatusLine().getStatusCode());
            }

        } catch (Exception e) {

            throw new SDKException.ClientException("nsq producer send msg exception: \n" + e.getMessage());

        } finally {
            try {
                if (httpClient != null) {
                    httpClient.close();
                }
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                throw new SDKException.ClientException("close send resource exception:\n" + e.getMessage());
            }
        }
    }

    @Override
    public void pub(String topic, String msg, Properties config) {
        // 当前生产者没有可选参数
        pub(topic, msg);
    }

    @Override
    public void sub(String topic, String channel, MessageHandler handler, int... args) {
        // Subscriber(Client client, int lookupIntervalSecs, int
        // maxLookupFailuresBeforeError, String... lookupHosts)
        String[] hosts = (String[]) this.config.get(GlobalConfig.NSQ_LOOKUPD_ADDRESS_KEY);

        if (hosts.length <= 0) {
            log.error("nsqlookupd address is null,but it required");
        } else {
            log.debug("server hosts: {}", hosts[0]);
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

        try {
            client.setExecutor(Executors.newFixedThreadPool(maxInFlight, CommonUtil.threadFactory("nsq-sub")));
        } catch (Exception e) {
            // 重复设置线程池会抛错，因为改变量为私有，无法避免重复设置，这里屏蔽异常
        }

        consumer = new Subscriber(client, pollIntervalms / 1000, Integer.MAX_VALUE, hosts);

        consumer.subscribe(topic, channel, maxInFlight, new HandleMessage(Integer.MAX_VALUE, handler)::handleMessage);
    }

    @Override
    public void sub(String topic, String channel, MessageHandler handler, Properties config) {
        // 校验自定义参数
        int pollIntervalms = validPollIntervalms(config);

        int maxInFlight = CommonUtil.validMaxInFlight(config);

        int msgTimeout = CommonUtil.validMsgTimeout(config);

        int retryTimes = CommonUtil.validRetryTimes(config);

        String[] hosts = (String[]) this.config.get(GlobalConfig.NSQ_LOOKUPD_ADDRESS_KEY);

        if (hosts.length <= 0) {
            log.error("nsqlookupd address is null,but it required");
        } else {
            log.debug("server hosts: {}", hosts[0]);
        }

        try {
            client.setExecutor(Executors.newFixedThreadPool(maxInFlight, CommonUtil.threadFactory("nsq-sub")));
        } catch (Exception e) {
            // 重复设置线程池会抛错，因为改变量为私有，无法避免重复设置，这里屏蔽异常
        }

        consumer = new Subscriber(client, pollIntervalms, Integer.MAX_VALUE, hosts);

        consumer.subscribe(topic, channel, maxInFlight, new HandleMessage(retryTimes, handler)::handleMessage);
    }

    @Override
    public void close() {

    }

    private class HandleMessage {
        int retryTimes = Integer.MAX_VALUE;

        MessageHandler handler;

        public HandleMessage(int retryTimes, MessageHandler handler) {
            this.retryTimes = retryTimes;
            this.handler = handler;
        }

        // adapt call back handler
        public void handleMessage(Message msg) {
            try {
                byte[] data = msg.getData();

                handler.handler(new String(data));
                msg.finish();
                log.info("msg: {} consumed.......", new String(data));

            } catch (Exception e) {
                if (msg.getAttempts() >= retryTimes) {
                    log.warn("comsume msg: {} exception,retryTimes {},it will be acked and not be consumed again;\n{}",
                            new String(msg.getData()), msg.getAttempts(), e.getMessage());

                    msg.finish();

                } else {
                    log.info("comsume msg: {} exception,will requeue;\n{}", new String(msg.getData()), e.getMessage());
                    msg.requeue();
                }

            }
        }
    }

    public int validPollIntervalms(Properties config) {
        int pollIntervalms = CommonUtil.validPollIntervalms(config);
        // TODO:拉去间隔本来支持ms级设置，但是使用的库支持 s 级别；这里暂时兼容处理，以后想办法解决
        pollIntervalms = pollIntervalms / 1000 + 1;

        return pollIntervalms;
    }

}
