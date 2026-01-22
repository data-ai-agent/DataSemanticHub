package com.eisoo.dc.common.trace;

import cn.aishu.exporter.ar_trace.ArExporter;
import cn.aishu.exporter.ar_trace.content.SpanContent;
import cn.aishu.exporter.common.output.Sender;
import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.export.SpanExporter;

import java.util.Collection;


public class LogExporter  implements SpanExporter {
    private Sender sender = new LogSender();

    public LogExporter() {
    }

    public static ArExporter create() {
        return new ArExporter();
    }

    public static ArExporter create(Sender sender) {
        return new ArExporter(sender);
    }

    public LogExporter(Sender sender) {
        if (sender != null) {
            this.sender = sender;
        }
    }


    public CompletableResultCode export(Collection<SpanData> spans) {
        for (SpanData spanData : spans) {
            SpanContent spanContent = new SpanContent(spanData);
            sender.send(spanContent);
        }

        return CompletableResultCode.ofSuccess();
    }


    public CompletableResultCode flush() {
        CompletableResultCode resultCode = new CompletableResultCode();

        return resultCode.succeed();
    }

    public CompletableResultCode shutdown() {
        sender.shutDown();
        return this.flush();
    }
}
