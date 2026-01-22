package com.eisoo.dc.common.helper;

import cn.aishu.exporter.ar_trace.ArExporter;
import cn.aishu.exporter.common.output.HttpSender;
import com.eisoo.dc.common.trace.LogExporter;
import com.eisoo.dc.common.util.CommonUtil;
import io.opentelemetry.api.internal.OtelEncodingUtils;
import io.opentelemetry.api.internal.TemporaryBuffers;
import io.opentelemetry.api.trace.*;
import io.opentelemetry.context.Context;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.semconv.resource.attributes.ResourceAttributes;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.Set;


@Slf4j
public class ARTraceHelper {

    private static OpenTelemetrySdk openTelemetry;


    public static synchronized void init(String endpointUrl, String serviceName, String serviceVersion) {
        if (openTelemetry != null) {
            return;
        }

        if (CommonUtil.isEmpty(serviceName)) {
            serviceName = "Unkown service";
            log.warn("ARTraceHelper 初始化错误，serviceName 为空");
        }

        if (CommonUtil.isEmpty(serviceVersion)) {
            serviceName = "1.0.0";
            log.warn("ARTraceHelper 初始化错误，serviceVersion 为空");
        }


        Resource serviceNameResource =
                // 需要服务名称
                Resource.create(io.opentelemetry.api.common.Attributes.of(
                        ResourceAttributes.SERVICE_NAME, serviceName, // 服务名
                        ResourceAttributes.SERVICE_INSTANCE_ID, getPodName(), //实例名，一般是k8s容器实例名字
                        ResourceAttributes.SERVICE_VERSION, serviceVersion, // 软件版本
                        ResourceAttributes.SERVICE_NAMESPACE, "" // 名字空间
                ));

        SpanExporter exporter;
        if (CommonUtil.isEmpty(endpointUrl)) {
            log.warn("ARTraceHelper 初始化错误，endpointUrl url为空，将使用LogExporter");
            exporter = new LogExporter();
        } else {
            exporter = ArExporter.create(HttpSender.create(endpointUrl));
        }
        // Set to process the spans by the Jaeger Exporter
        SdkTracerProvider tracerProvider =
                SdkTracerProvider.builder()
                        //2. 导出到AnyRobot:注意切换到对应地址：
                        .addSpanProcessor(SimpleSpanProcessor.create(exporter))
                        .setResource(Resource.getDefault().merge(serviceNameResource))
                        .build();
        openTelemetry =
                OpenTelemetrySdk.builder().setTracerProvider(tracerProvider).build();

        // it's always a good idea to shut down the SDK cleanly at JVM exit.
        Runtime.getRuntime().addShutdownHook(new Thread(tracerProvider::close));
    }

    private static synchronized OpenTelemetrySdk getOpenTelemetrySdk() {
        if (openTelemetry == null) {
            log.error("ARTraceHelper 未初始化");
        }
        return openTelemetry;
    }


    public static Span spanStart(String spanBuilderName, SpanKind spanKind, Context parentContext) {

        final Tracer tracer = getOpenTelemetrySdk().getTracer("io.opentelemetry.example.JaegerExample2");
        // 这个填写保持http.route一致
        SpanBuilder spanBuilder = tracer.spanBuilder(spanBuilderName);
        if (parentContext != null) {
            spanBuilder.setParent(parentContext);
        } else {
            spanBuilder.setNoParent();
        }
        spanBuilder.setSpanKind(spanKind);
        Span span = spanBuilder.startSpan();
        return span;
    }


    public static Span spanSuccessEnd(Span span) {
        span.setStatus(StatusCode.OK, "success");
        span.end();
        return span;
    }

    public static Span spanErrorEnd(Span span) {
        span.setStatus(StatusCode.ERROR, "error");
        span.end();
        return span;
    }


    public static Context getParentSpanInfo() {

        ServletRequestAttributes servletRequestAttributes = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes());
        if (null == servletRequestAttributes) {
            return ARTraceHelper.spanContext2Context(SpanContext.getInvalid());
        }
        HttpServletRequest request = servletRequestAttributes.getRequest();
        if (null == request) {
            return ARTraceHelper.spanContext2Context(SpanContext.getInvalid());
        }

        // 从Attribute 取traceparent 信息
        String attrTraceParent = (String) request.getAttribute(Keys.KEY_TRACE_PARENT);
        // 如果Attribute 没有traceparent，将header里面的traceparent放入Attribute
        if (CommonUtil.isEmpty(attrTraceParent)) {
            // 从header 取traceparent 信息
            String headerTraceParent = request.getHeader(Keys.KEY_TRACE_PARENT);
            request.setAttribute(Keys.KEY_TRACE_PARENT, headerTraceParent == null ? "" : headerTraceParent);

        }

        String traceParent = (String) request.getAttribute(Keys.KEY_TRACE_PARENT);
        SpanContext spanContext = W3CTraceContextPropagator.getSpanContextFromTraceParent(traceParent);
        return ARTraceHelper.spanContext2Context(spanContext);
    }


    public static void addHttpRequestAttribute(Span span) {
        try {
            ServletRequestAttributes servletRequestAttributes = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes());
            if (null == servletRequestAttributes) {
                return;
            }
            HttpServletRequest request = servletRequestAttributes.getRequest();
            if (null == request) {
                return;
            }
            request.removeAttribute(Keys.KEY_TRACE_ID);
            request.removeAttribute(Keys.KEY_SPAN_ID);
            request.removeAttribute(Keys.KEY_TRACE_PARENT);
            request.removeAttribute(Keys.KEY_TTRACE_STATE);

            request.setAttribute(Keys.KEY_TRACE_ID, span.getSpanContext().getTraceId());
            request.setAttribute(Keys.KEY_SPAN_ID, span.getSpanContext().getSpanId());
            request.setAttribute(Keys.KEY_TRACE_PARENT, W3CTraceContextPropagator.createTraceParent(span));
            TraceState traceState = span.getSpanContext().getTraceState();
            if (!traceState.isEmpty()) {
                request.setAttribute(Keys.KEY_TTRACE_STATE, W3CTraceContextPropagator.createTraceParent(span));
            }

        } catch (Exception e) {
            log.warn("", e);
        }
    }


    public static void resetMDC(SpanContext spanContext) {
        try {
            if (MDC.get(Keys.KEY_TRACE_ID) != null) {
                MDC.remove(Keys.KEY_TRACE_ID);
            }

            if (MDC.get(Keys.KEY_SPAN_ID) != null) {
                MDC.remove(Keys.KEY_SPAN_ID);
            }
            addMDC(spanContext);
        } catch (Exception e) {
            log.warn("", e);
        }

    }

    public static void addMDC(SpanContext spanContext) {
        try {
            if (spanContext != null && spanContext.isValid()) {
                MDC.put(Keys.KEY_TRACE_ID, spanContext.getTraceId());
                MDC.put(Keys.KEY_SPAN_ID, spanContext.getSpanId());
            }

        } catch (Exception e) {
            log.warn("", e);
        }

    }


    public static String getPodName() {
        String podName = System.getenv("HOSTNAME");
        if (null != podName && !"".equals(podName)) {
            return podName;
        }
        try {
            InetAddress inetAddress = InetAddress.getLocalHost();
            return inetAddress.getHostAddress();
        } catch (UnknownHostException e) {
            log.warn("", e);
            return "";
        }
    }


    public static Context span2Context(Span span) {
        return span.storeInContext(Context.current());
    }

    public static SpanContext context2SpanContext(Context context) {
        return Span.fromContext(context).getSpanContext();
    }

    public static Span spanContext2Span(SpanContext spanContext) {
        return Span.wrap(spanContext);
    }

    public static Context spanContext2Context(SpanContext spanContext) {
        return span2Context(spanContext2Span(spanContext));
    }

    public static SpanContext getSpanContextFromHttpRequestAttribute() {
        ServletRequestAttributes servletRequestAttributes = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes());
        if (null == servletRequestAttributes) {
           return W3CTraceContextPropagator.getSpanContextFromTraceParent(null);
        }
        HttpServletRequest request = servletRequestAttributes.getRequest();
        if (null == request) {
            return W3CTraceContextPropagator.getSpanContextFromTraceParent(null);
        }
        String traceParent = (String) request.getAttribute(Keys.KEY_TRACE_PARENT);
        return W3CTraceContextPropagator.getSpanContextFromTraceParent(traceParent);
    }

    @Slf4j
    public static class W3CTraceContextPropagator {

        private static final int TRACE_ID_HEX_SIZE = TraceId.getLength();
        private static final int SPAN_ID_HEX_SIZE = SpanId.getLength();
        private static final int TRACE_OPTION_HEX_SIZE = TraceFlags.getLength();
        private static final int SPAN_ID_OFFSET;
        private static final int TRACE_OPTION_OFFSET;
        private static final int TRACEPARENT_HEADER_SIZE;
        private static final Set<String> VALID_VERSIONS;

        static {
            SPAN_ID_OFFSET = 3 + TRACE_ID_HEX_SIZE + 1;
            TRACE_OPTION_OFFSET = SPAN_ID_OFFSET + SPAN_ID_HEX_SIZE + 1;
            TRACEPARENT_HEADER_SIZE = TRACE_OPTION_OFFSET + TRACE_OPTION_HEX_SIZE;
            VALID_VERSIONS = new HashSet<>();

            for (int i = 0; i < 255; ++i) {
                String version = Long.toHexString((long) i);
                if (version.length() < 2) {
                    version = '0' + version;
                }

                VALID_VERSIONS.add(version);
            }

        }


        public static String createTraceParent(Span span) {
            if (span != null && span.getSpanContext() != null && span.getSpanContext().isValid()) {
                SpanContext spanContext = span.getSpanContext();
                char[] chars = TemporaryBuffers.chars(TRACEPARENT_HEADER_SIZE);
                chars[0] = "00".charAt(0);
                chars[1] = "00".charAt(1);
                chars[2] = '-';
                String traceId = spanContext.getTraceId();
                traceId.getChars(0, traceId.length(), chars, 3);
                chars[SPAN_ID_OFFSET - 1] = '-';
                String spanId = spanContext.getSpanId();
                spanId.getChars(0, spanId.length(), chars, SPAN_ID_OFFSET);
                chars[TRACE_OPTION_OFFSET - 1] = '-';
                String traceFlagsHex = spanContext.getTraceFlags().asHex();
                chars[TRACE_OPTION_OFFSET] = traceFlagsHex.charAt(0);
                chars[TRACE_OPTION_OFFSET + 1] = traceFlagsHex.charAt(1);
                return new String(chars, 0, TRACEPARENT_HEADER_SIZE);
            }
            return "";
        }

        public static SpanContext getSpanContextFromTraceParent(String traceparent) {
            traceparent = traceparent == null ? "" : traceparent;
            boolean isValid = (traceparent.length() == TRACEPARENT_HEADER_SIZE || traceparent.length() > TRACEPARENT_HEADER_SIZE && traceparent.charAt(TRACEPARENT_HEADER_SIZE) == '-') && traceparent.charAt(2) == '-' && traceparent.charAt(SPAN_ID_OFFSET - 1) == '-' && traceparent.charAt(TRACE_OPTION_OFFSET - 1) == '-';
            if (!isValid) {
                return SpanContext.getInvalid();
            } else {
                String version = traceparent.substring(0, 2);
                if (!VALID_VERSIONS.contains(version)) {
                    return SpanContext.getInvalid();
                } else if (version.equals("00") && traceparent.length() > TRACEPARENT_HEADER_SIZE) {
                    return SpanContext.getInvalid();
                } else {
                    String traceId = traceparent.substring(3, 3 + TraceId.getLength());
                    String spanId = traceparent.substring(SPAN_ID_OFFSET, SPAN_ID_OFFSET + SpanId.getLength());
                    char firstTraceFlagsChar = traceparent.charAt(TRACE_OPTION_OFFSET);
                    char secondTraceFlagsChar = traceparent.charAt(TRACE_OPTION_OFFSET + 1);
                    if (OtelEncodingUtils.isValidBase16Character(firstTraceFlagsChar) && OtelEncodingUtils.isValidBase16Character(secondTraceFlagsChar)) {
                        TraceFlags traceFlags = TraceFlags.fromByte(OtelEncodingUtils.byteFromBase16(firstTraceFlagsChar, secondTraceFlagsChar));
                        return SpanContext.createFromRemoteParent(traceId, spanId, traceFlags, TraceState.getDefault());
                    } else {
                        return SpanContext.getInvalid();
                    }
                }
            }
        }

    }

    public static class Keys {
        public final static String KEY_TRACE_ID = "trace-id";
        public final static String KEY_SPAN_ID = "span-id";
        public final static String KEY_TTRACE_STATE = "tracestate";
        public final static String KEY_TRACE_PARENT = "traceparent";
    }
}
