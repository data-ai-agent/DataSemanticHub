package com.eisoo.dc.datasource.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.eisoo.dc.common.mybatis.interceptor.ARTraceSqlStatementInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
public class MybatisPlusConfig {

    @Autowired
    AnyRobotConfigruation anyRobotConfigruation;

    @Value(value = "${spring.application.db-type}")
    private String dbType;;

    /**
     * 新的分页插件,一缓和二缓遵循mybatis的规则,需要设置 MybatisConfiguration#useDeprecatedExecutor = false 避免缓存出现问题(该属性会在旧插件移除后一同移除)
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        //	自定义 的 like 转义特殊字符%_\
        interceptor.addInnerInterceptor(new EscapeInterceptor());
        //	mybatis-plus 的 分页查询
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MARIADB));

        return interceptor;
    }

    /**
     * mybatis 自定义拦截器(特殊字符处理)
     *
     * @return
     */
    @Bean
    public EscapeInterceptor getEscapeInterceptor() {
        EscapeInterceptor interceptor = new EscapeInterceptor();
        return interceptor;
    }




    /**
     * Mybatis 链路追踪，打印SQL 逻辑
     */
    @Bean
    ARTraceSqlStatementInterceptor sqlStatementInterceptor() {
        String traceEndpointUrl = anyRobotConfigruation.getTraceEnabled() == false ? null : anyRobotConfigruation.getTraceEndpointUrl();
        return new ARTraceSqlStatementInterceptor(
                traceEndpointUrl,
                anyRobotConfigruation.getServiceName(),
                anyRobotConfigruation.getServiceVersion(),
                dbType);
    }

}
