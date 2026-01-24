package cn.aishu.exporter.common.output;

import java.io.IOException;

/**
 * 爱数内部HttpSender的替代实现，用于编译兼容
 */
public class HttpSender implements Sender {
    private String endpointUrl;

    private HttpSender(String endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    public static HttpSender create(String endpointUrl) {
        return new HttpSender(endpointUrl);
    }

    @Override
    public void send(cn.aishu.exporter.ar_trace.content.SpanContent content) {
        // 这里可以实现实际的HTTP发送逻辑，但现在仅作占位
        System.out.println("Sending span content to: " + endpointUrl);
    }

    @Override
    public void shutDown() {
        // 关闭资源的逻辑
    }

    public String getEndpointUrl() {
        return endpointUrl;
    }
}