package cn.aishu.exporter.common.output;

import cn.aishu.exporter.ar_trace.content.SpanContent;

/**
 * 爱数内部Sender接口的替代实现，用于编译兼容
 */
public interface Sender {
    void send(SpanContent content);

    void shutDown();
}