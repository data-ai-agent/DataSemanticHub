package com.eisoo.dc.common.webfilter;

import com.eisoo.dc.common.util.CommonUtil;
import com.eisoo.dc.common.helper.ARTraceHelper;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.context.Context;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.RequestFacade;
import org.apache.catalina.connector.ResponseFacade;

import javax.servlet.*;
import java.io.IOException;


@Slf4j
public class ArTraceFilter implements Filter {

    public ArTraceFilter(String endpointUrl, String serviceName, String serviceVersion) {
        ARTraceHelper.init(endpointUrl, serviceName, serviceVersion);
    }


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        Context parentContext = getParentSpanInfo(request);
        Span span = ARTraceHelper.spanStart(getSpanBuilderName(request), SpanKind.SERVER, parentContext);
        setSpanAttribute(request, span);
        int httpCode = -1;
        try {
            addHttpRequestAttribute(request, span);
            ARTraceHelper.addMDC(span.getSpanContext());
            chain.doFilter(request, response);
            httpCode = ((ResponseFacade) response).getStatus();
        } finally {
            if (httpCode >= 200 && httpCode < 300) {
                ARTraceHelper.spanSuccessEnd(span);
            } else {
                ARTraceHelper.spanErrorEnd(span);
            }
            SpanContext spanContext = Span.fromContext(parentContext).getSpanContext();
            ARTraceHelper.resetMDC(spanContext);
        }
    }

    public String getClientIp(ServletRequest request) {
        String clientIp = ((RequestFacade) request).getHeader("X-Forwarded-For");
        if (clientIp != null && clientIp.length() > 0) {
            return clientIp;
        }
        return request.getRemoteAddr();
    }


    private void setSpanAttribute(ServletRequest request, Span span) {
        RequestFacade servletRequest = (RequestFacade) request;
        span.setAttribute("http.method", servletRequest.getMethod());
        span.setAttribute("http.route", servletRequest.getRequestURI());
        span.setAttribute("http.client_ip", getClientIp(request));
        span.setAttribute("func.path", "");


    }

    public String getSpanBuilderName(ServletRequest servletRequest) {
        return ((RequestFacade) servletRequest).getRequestURI();
    }

    public static Context getParentSpanInfo(ServletRequest servletRequest) {
        RequestFacade request = (RequestFacade) servletRequest;
        // 从Attribute 取traceparent 信息
        String attrTraceParent = (String) request.getAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT);
        // 如果Attribute 没有traceparent，将header里面的traceparent放入Attribute
        if (CommonUtil.isEmpty(attrTraceParent)) {
            // 从header 取traceparent 信息
            String headerTraceParent = request.getHeader(ARTraceHelper.Keys.KEY_TRACE_PARENT);
            request.setAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT, headerTraceParent == null ? "" : headerTraceParent);

        }

        String traceParent = (String) request.getAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT);
        SpanContext spanContext = ARTraceHelper.W3CTraceContextPropagator.getSpanContextFromTraceParent(traceParent);
        return ARTraceHelper.spanContext2Context(spanContext);
    }

    public static void addHttpRequestAttribute(ServletRequest request, Span span) {
        try {
            request.removeAttribute(ARTraceHelper.Keys.KEY_TRACE_ID);
            request.removeAttribute(ARTraceHelper.Keys.KEY_SPAN_ID);
            request.removeAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT);
            request.removeAttribute(ARTraceHelper.Keys.KEY_TTRACE_STATE);

            request.setAttribute(ARTraceHelper.Keys.KEY_TRACE_ID, span.getSpanContext().getTraceId());
            request.setAttribute(ARTraceHelper.Keys.KEY_SPAN_ID, span.getSpanContext().getSpanId());
            request.setAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT, ARTraceHelper.W3CTraceContextPropagator.createTraceParent(span));
            TraceState traceState = span.getSpanContext().getTraceState();
            if (!traceState.isEmpty()) {
                request.setAttribute(ARTraceHelper.Keys.KEY_TTRACE_STATE, ARTraceHelper.W3CTraceContextPropagator.createTraceParent(span));
            }

        } catch (Exception e) {
            log.warn("", e);
        }
    }

}
