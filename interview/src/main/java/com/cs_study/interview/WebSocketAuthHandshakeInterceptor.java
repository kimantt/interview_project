package com.cs_study.interview;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;

public class WebSocketAuthHandshakeInterceptor implements HandshakeInterceptor {

	@Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (request instanceof ServletServerHttpRequest servletReq) {
            HttpServletRequest httpReq = servletReq.getServletRequest();

            var session = httpReq.getSession(false);
            if (session == null || session.getAttribute("USER_ID") == null) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            // 이후 STOMP 핸들러에서 쓸 수 있도록 attributes에 사용자 정보 저장
            attributes.put("USER_ID", session.getAttribute("USER_ID"));
            attributes.put("USERNAME", session.getAttribute("USERNAME"));
            return true;
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {}
}
