package com.cs_study.interview.listener;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.cs_study.interview.store.StudyPresenceStore;

@Component
public class StudyDisconnectListener {

	private final StudyPresenceStore store;

    public StudyDisconnectListener(StudyPresenceStore store) {
        this.store = store;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = acc.getSessionId();

        // sessionToUser 기반으로 제거
        store.leaveBySessionId(sessionId);
    }
}
