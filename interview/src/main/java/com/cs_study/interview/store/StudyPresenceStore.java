package com.cs_study.interview.store;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class StudyPresenceStore {
	
	public static class ParticipantState {
        private final long userId;
        private final String username;
        private volatile boolean ready;

        public ParticipantState(long userId, String username, boolean ready) {
            this.userId = userId;
            this.username = username;
            this.ready = ready;
        }

        public long getUserId() { return userId; }
        public String getUsername() { return username; }
        public boolean isReady() { return ready; }
        public void setReady(boolean ready) { this.ready = ready; }
        public void toggleReady() { this.ready = !this.ready; }
    }

    // userId -> participant
    private final ConcurrentHashMap<Long, ParticipantState> online = new ConcurrentHashMap<>();

    // stomp sessionId -> userId (새로고침/탭종료 대응)
    private final ConcurrentHashMap<String, Long> sessionToUser = new ConcurrentHashMap<>();

    public void enter(String stompSessionId, long userId, String username) {
        // 같은 userId가 여러 탭이면 "마지막 접속" 기준으로 덮어씀
        online.put(userId, new ParticipantState(userId, username, false));
        sessionToUser.put(stompSessionId, userId);
    }

    public void leaveBySessionId(String stompSessionId) {
        Long userId = sessionToUser.remove(stompSessionId);
        if (userId != null) {
            online.remove(userId);
        }
    }

    public void toggleReady(long userId) {
        ParticipantState p = online.get(userId);
        if (p != null) p.toggleReady();
    }

    public Optional<ParticipantState> find(long userId) {
        return Optional.ofNullable(online.get(userId));
    }

    public List<ParticipantState> snapshot() {
        return new ArrayList<>(online.values());
    }
    
    public boolean allReady() {
        var list = online.values();
        if (list.isEmpty()) return false;
        for (ParticipantState p : list) {
            if (!p.isReady()) return false;
        }
        return true;
    }
}
