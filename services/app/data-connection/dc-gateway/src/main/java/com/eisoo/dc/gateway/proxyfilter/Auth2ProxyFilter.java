package com.eisoo.dc.gateway.proxyfilter;

import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.gateway.domain.vo.IntrospectInfo;
import com.eisoo.dc.gateway.util.AFUtil;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Set;

@Slf4j
public class Auth2ProxyFilter implements Filter {

    private boolean isOpen;
    private String  tokenIntrospect;
    private AFUtil afUtil = new AFUtil();
    private Gson gson = new Gson();
    public Auth2ProxyFilter(boolean isOpen, String  tokenIntrospect) {
        this.isOpen = isOpen;
        this.tokenIntrospect=tokenIntrospect;
    }

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String userId = "";
        String auth2Token = request.getHeader("Authorization");
        // uri
        if(isOpen)
        {
            String uri = request.getRequestURI();
            if (uri.startsWith("/api/virtual_engine_service/v1/view")
                    || uri.startsWith("/api/virtual_engine_service/v1/fetch") || uri.startsWith("/api/virtual_engine_service/v1/download")
                    || uri.startsWith("/api/virtual_engine_service/v1/preview")|| uri.startsWith("/api/virtual_engine_service/v1/query")
                    || uri.startsWith("/api/vega-data-source/v1/excel")) {
                if(auth2Token == null)
                {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    AiShuException aiShuException = new AiShuException(ErrorCodeEnum.AuthTokenUnAuthRIZEDError,(Object)Message.getMessageDetail(ErrorCodeEnum.AuthTokenUnAuthRIZEDError),
                            Message.getMessageSolutions(ErrorCodeEnum.AuthTokenUnAuthRIZEDError));
                    write(response, null, gson.toJson(aiShuException));
                    return ;
                }
                try {

                    if (auth2Token == null || !auth2Token.startsWith("Bearer ")) {
                        //格式错误
                        response.setStatus(400);
                        response.setContentType("application/json");
                        AiShuException aiShuException = new AiShuException(ErrorCodeEnum.AuthTokenRequestFormatError,(Object)Message.getMessageDetail(ErrorCodeEnum.AuthTokenRequestFormatError),
                                Message.getMessageSolutions(ErrorCodeEnum.AuthTokenRequestFormatError) );
                        write(response, null, gson.toJson(aiShuException));
                        return;
                    }
                    String token= auth2Token.substring("Bearer ".length()).trim();
                    IntrospectInfo introspectInfo=afUtil.getIntrospectInfoByToken(tokenIntrospect,token,"all");
                    userId = introspectInfo.getSub()!=null?introspectInfo.getSub():""; // 用户id
                    //log.info("client_id:%s,sub:%s,exp:%s,token_type:%s", introspectInfo.getClientId(),introspectInfo.getSub(),introspectInfo.getExp(),introspectInfo.getTokenType());
                    if(!introspectInfo.isActive())
                    {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        AiShuException aiShuException = new AiShuException(ErrorCodeEnum.AuthTokenForbiddenError,(Object)Message.getMessageDetail(ErrorCodeEnum.AuthTokenForbiddenError),
                                Message.getMessageSolutions(ErrorCodeEnum.AuthTokenRequestFormatError) );
                        write(response, null, gson.toJson(aiShuException));
                        return ;
                    }
                } catch (Exception e) {
                    response.setStatus(500);
                    response.setContentType("application/json");
                    AiShuException aiShuException = new AiShuException(ErrorCodeEnum.ConnectAuthServerFail,Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
                    write(response, null, gson.toJson(aiShuException));
                    return ;
                }
            }
        }
        servletRequest.setAttribute("Authorization", auth2Token);
        servletRequest.setAttribute("userId", userId);
        filterChain.doFilter(servletRequest, servletResponse);
    }

    private void write(HttpServletResponse response, HttpHeaders headers, String body) throws IOException {
        if (headers != null) {
            Set<String> headerKeys = headers.keySet();
            for (String key : headerKeys) {
                response.setHeader(key, headers.get(key).toString());
            }
        }
        if (headers!= null && headers.getContentType() != null) {
            response.setContentType(headers.getContentType().toString());
        }
        if (body != null) {
            // 在getWriterz之前执行，否则不生效
            response.setCharacterEncoding("UTF-8");
            PrintWriter writer = response.getWriter();
            writer.write(body);
            writer.flush();
        }
    }


    @Override
    public void destroy() {}

}