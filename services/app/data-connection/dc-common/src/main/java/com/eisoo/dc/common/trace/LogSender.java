package com.eisoo.dc.common.trace;

import cn.aishu.exporter.common.output.Sender;
import cn.aishu.exporter.common.output.Serializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class LogSender implements Sender {
    private static final Logger out = LoggerFactory.getLogger(LogSender.class);

    public LogSender() {
    }

    public void send(Serializer logContent) {
        if (out.isDebugEnabled()) {
            out.debug(logContent.toJson());
        }
    }

    public void shutDown() {
    }

}
