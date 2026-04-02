package com.cs_study.interview;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	// SockJS + STOMP 엔드포인트
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
        		.addInterceptors(new WebSocketAuthHandshakeInterceptor())
        		.setAllowedOriginPatterns("http://*:3000", "http://*:5173")
                .withSockJS();
    }

    // 메시지 브로커, prefix 설정
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트 -> 서버로 보내는 메시지 destination prefix
        registry.setApplicationDestinationPrefixes("/app");

        // 서버 -> 클라이언트로 보내는 브로커 destination prefix
        registry.enableSimpleBroker("/topic", "/queue");

        // 1:1 전송 prefix
        registry.setUserDestinationPrefix("/user");
    }
}
