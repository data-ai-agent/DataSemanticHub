package com.eisoo.dc.common.mybatis.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;

import java.sql.Statement;
import java.util.Properties;

/**
 * SQL拦截器，用于跟踪SQL执行
 */
@Slf4j
@Intercepts({
        @Signature(type = StatementHandler.class, method = "update", args = {Statement.class}),
        @Signature(type = StatementHandler.class, method = "query", args = {Statement.class, org.apache.ibatis.session.ResultHandler.class})
})
public class ARTraceSqlStatementInterceptor implements Interceptor {

    public ARTraceSqlStatementInterceptor(String traceEndpointUrl, String serviceName, String serviceVersion, String dbType) {
        // 构造函数接受四个参数，但我们只记录日志而不执行复杂逻辑
        log.debug("Initializing ARTraceSqlStatementInterceptor with traceEndpointUrl: {}, serviceName: {}, serviceVersion: {}, dbType: {}", 
                  traceEndpointUrl, serviceName, serviceVersion, dbType);
    }

    public ARTraceSqlStatementInterceptor() {
        // 默认构造函数
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 记录SQL执行时间
        long startTime = System.currentTimeMillis();
        try {
            Object result = invocation.proceed();
            return result;
        } finally {
            long endTime = System.currentTimeMillis();
            log.debug("SQL执行耗时: {} ms", (endTime - startTime));
        }
    }

    @Override
    public Object plugin(Object target) {
        return org.apache.ibatis.plugin.Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 设置属性
    }
}