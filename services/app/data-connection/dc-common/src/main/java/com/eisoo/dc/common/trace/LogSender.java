package com.eisoo.dc.common.trace;

import cn.aishu.exporter.ar_trace.content.SpanContent;
import cn.aishu.exporter.common.output.Sender;

/**
 * 日志发送器的实现
 */
public class LogSender implements Sender {
    @Override
    public void send(SpanContent content) {
        // 将span内容记录到日志
        System.out.println("Logging span content: " + content.getSpanData());
    }

    @Override
    public void shutDown() {
        // 关闭资源
        System.out.println("LogSender shut down");
    }
}