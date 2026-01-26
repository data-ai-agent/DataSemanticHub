package cn.aishu.exporter.ar_trace;

import cn.aishu.exporter.common.output.Sender;

/**
 * 爱数内部ArExporter的替代实现，用于编译兼容
 */
public class ArExporter {
    private Sender sender;

    public ArExporter() {
    }

    public ArExporter(Sender sender) {
        this.sender = sender;
    }

    public static ArExporter create(Sender sender) {
        return new ArExporter(sender);
    }

    public Sender getSender() {
        return sender;
    }

    public void setSender(Sender sender) {
        this.sender = sender;
    }
}