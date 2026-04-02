package com.cs_study.interview;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 60 * 60 * 24 * 7)
public class SessionConfig {

	@Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();

        serializer.setCookieName("SESSION");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);

        // 브라우저 종료 후에도 남도록 영속 쿠키로: 7일(초 단위)
        serializer.setCookieMaxAge(60 * 60 * 24 * 7);

        // 현재 개발환경(http) 기준
        serializer.setUseSecureCookie(false);
        serializer.setSameSite("Lax");

        return serializer;
    }
}
