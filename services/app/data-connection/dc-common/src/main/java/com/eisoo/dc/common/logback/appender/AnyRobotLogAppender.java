package com.eisoo.dc.common.logback.appender;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.Layout;
import ch.qos.logback.core.UnsynchronizedAppenderBase;
import cn.aishu.exporter.common.output.HttpSender;
import cn.aishu.telemetry.log.*;
import cn.aishu.telemetry.log.config.SamplerLogConfig;
import lombok.Getter;
import lombok.Setter;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Map;


@Setter
@Getter
public class AnyRobotLogAppender extends UnsynchronizedAppenderBase<ILoggingEvent> {
    final Logger logger = LoggerFactory.getLogger(AnyRobotLogAppender.class); // 生成日志实例
    Layout<ILoggingEvent> layout;

    // 输出的URL
    String endpointUrl;

    // 服务名称
    String serviceName;

    // 服务版本号
    String serviceVersion;

    // 是否启用
    Boolean enabled;

    @Override
    public void start() {
        if (!enabled) {
            return;
        }
        if (endpointUrl == null || endpointUrl.trim().length() == 0) {
            addWarn("endpointUrl was not defined");
            return;
        }

        //这里可以做些初始化判断 比如layout不能为null ,
        if (layout == null) {
            addWarn("Layout was not defined");
            return;
        }
        initArSender();
        //或者写入数据库 或者redis时 初始化连接等等
        super.start();
    }

    private void initArSender() {
        SamplerLogConfig.setLevel(cn.aishu.telemetry.log.config.Level.DEBUG);
        SamplerLogConfig.setSender(HttpSender.create(endpointUrl));
    }


    @Override
    public void stop() {
        //释放相关资源，如数据库连接，redis线程池等等
        if (!isStarted()) {
            return;
        }
        super.stop();
    }

    @Override
    public void append(ILoggingEvent event) {
        if (event == null || !isStarted()) {
            return;
        }

        Map<String, String> mdcMap = event.getMDCPropertyMap();
        if (mdcMap.containsKey("trace-id")
                && mdcMap.containsKey("span-id")) {
            //创建link
            Link link = new Link();
            link.setTraceId(mdcMap.get("trace-id"));
            link.setSpanId(mdcMap.get("span-id"));

            //创建service
            Service service = new Service();
            service.setInstanceId(getPodName());

            // 先从日志配置文件里面取，里面没有从MDC里面去（MDC需要提前设置）
            service.setName(serviceName);
            if (serviceName == null || serviceName.trim().length() == 0) {
                service.setName(mdcMap.get("service-name"));
            }
            service.setVersion(serviceVersion);
            if (serviceVersion == null || serviceVersion.trim().length() == 0) {
                service.setVersion(mdcMap.get("service-version"));
            }
            //创建Attributes
            Map<String, Object> attr = new HashMap<>();
            Attributes attributes = new Attributes(attr);


            String level = event.getLevel().toString().toUpperCase();
            //logger.debug(layout.doLayout(event), attributes, link, service);
            switch (level) {
                case "TRACE": {
                    logger.trace(layout.doLayout(event), attributes, link, service);
                    break;
                }
                case "DEBUG": {
                    logger.debug(layout.doLayout(event), attributes, link, service);
                    break;
                }
                case "INFO": {
                    logger.info(layout.doLayout(event), attributes, link, service);
                    break;
                }
                case "WARN": {
                    logger.warn(layout.doLayout(event), attributes, link, service);
                    break;
                }
                case "ERROR": {
                    logger.error(layout.doLayout(event), attributes, link, service);
                    break;
                }
            }
        }
    }

    private static String getPodName() {
        String podName = System.getenv("HOSTNAME");
        if (null != podName && !"".equals(podName)) {
            return podName;
        }
        try {
            InetAddress inetAddress = InetAddress.getLocalHost();
            return inetAddress.getHostAddress();
        } catch (UnknownHostException e) {
            return "";
        }
    }
}