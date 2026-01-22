package com.eisoo.dc.common.msq;

import lombok.NoArgsConstructor;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.common.config.SaslConfigs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Properties;
/**
 * ProtonMQClientFactory to create me
 */
@NoArgsConstructor
@Component
public class ProtonMQClientFactory {

    @Autowired
    private Environment environment;
    private static final Logger log = LoggerFactory.getLogger(ProtonMQClientFactory.class);

    /**
     * @param prop 消息队列服务的配置信息 key: value
     *             mqType： "kafka"
     *             mqHost: "kafka-0.kafka-headless.resource"
     *             mqPort: 9097
     *             mqLookupdHost: "" nsq生产和消费服务不是同一个，lookupd是消费服务，mqHost默认为生产者服务
     *             mqLookupdPort: 0
     *             # 如果不启用认证，则没有auth字段，或者auth: {}
     *             username: "default"
     *             password: "eisoo.com123"
     *             mechanism: "SCRAM-SHA-512" |"PLAIN" | "SCRAM-SHA-256"
     * @return 客户端对象实例
     */
    public ProtonMQClient getProtonMQClient(Properties prop) {
        log.debug("get mqclient by prop: {}", prop.toString());

        prop = configAdapt(prop);

        String type = prop.getProperty(GlobalConfig.MQTYPE);
        log.debug("start build  {} client", type);

        switch (type) {
            case GlobalConfig.KAFKA:
                return new KafkaClient(prop);

            case GlobalConfig.NSQ:
                return new NsqClient(prop);

            case GlobalConfig.TONGLINK:
                return TlqClient9.getTlqClient9(prop);

            case GlobalConfig.TLQ_HTP20:
                return TlqClientHTP2.getTlqClientHTP2(prop);

            case GlobalConfig.BESMQ:
                return BmqClient.getBmqClient(prop);

            default:
                log.error("unsupported type: {}", type);

                throw new SDKException.ConfigInvalidException(ErrorString.UNSUPPORT_CLIENT_TYPE + type);
        }
    }

    // 通过配置文件创建客户端
    @Bean
    public ProtonMQClient getProtonMQClient() {
        /*
         * 配置文件规范
         * mqType： kafka
         * mqHost: kafka-0.kafka-headless.resource
         * mqPort: 9097
         * mqLookupdHost:
         * mqLookupdPort: 0
         * # 如果不启用认证，则没有auth字段，或者auth: {}
         * auth:
         * --username: default
         * --password: eisoo.com123
         * --mechanism: SCRAM-SHA-512
         */
        Properties prop = Binder.get(environment)
                .bind("mq", Properties.class)
                .orElseThrow(() -> new IllegalStateException("MQ config not found"));
        return this.getProtonMQClient(prop);
    }

    // config adapt
    private Properties configAdapt(Properties prop) {
        Properties config = new Properties();

        // set type
        String type = prop.getProperty(GlobalConfig.MQTYPE);
        config.put(GlobalConfig.MQTYPE, type);

        String mqHost = prop.getProperty(GlobalConfig.HOST);
        String mqPort = prop.getProperty(GlobalConfig.PORT);
        // server address: required
        if (mqHost == null) {
            log.error("invalid: mqHost is null");
            throw new SDKException.ConfigInvalidException(ErrorString.INVALID_CONFIG_MQHOST);
        }
        if (mqPort == null) {
            log.error("invalid: mqPort is null");
            throw new SDKException.ConfigInvalidException(
                    ErrorString.INVALID_CONFIG_NULL + GlobalConfig.PORT);
        }

        // joint bootstrap.servers host1:port1,host2:port2,..
        String[] split = mqHost.split(",");

        for (int i = 0; i < split.length; i++) {
            // adapt ipv6
            if (split[i].contains(":")) {
                split[i] = "[" + split[i] + "]";
            }
            split[i] = String.format("%s:%s", split[i], mqPort);
        }

        String addrs = String.join(",", split);
        log.debug("joint server addrs: {}", addrs);

        config.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, addrs);

        String mechanism = prop.getProperty(GlobalConfig.MECHANISM);
        String protocol = CommonClientConfigs.DEFAULT_SECURITY_PROTOCOL;

        // mechanism not null tags sasl，change protocol to PROTOCOL_SASL_PLAINTEXT
        if (GlobalConfig.KAFKA.equals(type) && mechanism != null) {
            // enable sasl
            protocol = GlobalConfig.PROTOCOL_SASL_PLAINTEXT;

            String username = prop.getProperty(GlobalConfig.UERNAME);
            String password = prop.getProperty(GlobalConfig.PASSWORD);

            // enbable sasl,but username or password null,
            // throw SDKException.ConfigInvalidException
            if (username == null) {
                log.error("invalid: username is null");

                throw new SDKException.ConfigInvalidException(ErrorString.INVALID_CONFIG_NULL + GlobalConfig.UERNAME);
            }
            if (password == null) {
                log.error("username or password is null");
                throw new SDKException.ConfigInvalidException(ErrorString.INVALID_CONFIG_NULL + GlobalConfig.PASSWORD);
            }
            // according to the value of auth.mechanism jonint sasl.jaas.config
            String securityConfig = null;
            switch (mechanism) {
                case GlobalConfig.MECHANISM_PLAIN:
                    securityConfig = String.format(GlobalConfig.SASL_JAAS_CONFIG_PLAIN, username, password);
                    break;
                case GlobalConfig.MECHANISM_SCRAM_256:
                case GlobalConfig.MECHANISM_SCRAM_512:
                    securityConfig = String.format(GlobalConfig.SASL_JAAS_CONFIG_SCRAM, username, password);
                    break;
                default:
                    log.error("invalid mechanism: ", mechanism);
                    throw new SDKException.ConfigInvalidException(ErrorString.UNSUPPORT_MECHANISM_TYPE + mechanism);
            }
            log.debug("securityConfig: {}", securityConfig);

            config.put(SaslConfigs.SASL_MECHANISM, mechanism);
            config.put(SaslConfigs.SASL_JAAS_CONFIG, securityConfig);
        }

        config.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, protocol);

        // while type=nsq，set lookupd address
        if (GlobalConfig.NSQ.equals(type)) {
            String lookupdHost = prop.getProperty(GlobalConfig.LookupdHost);
            String lookupdPort = prop.getProperty(GlobalConfig.LookupdPORT);

            String[] lookupdHosts = lookupdHost.split(",");

            for (int i = 0; i < lookupdHosts.length; i++) {
                // adapt ipv6
                if (lookupdHosts[i].contains(":")) {
                    lookupdHosts[i] = "[" + lookupdHosts[i] + "]";
                }
                lookupdHosts[i] = String.format("%s:%s", lookupdHosts[i], lookupdPort);
            }
            config.put(GlobalConfig.NSQ_LOOKUPD_ADDRESS_KEY, lookupdHosts);
        }
        return config;
    }
}
