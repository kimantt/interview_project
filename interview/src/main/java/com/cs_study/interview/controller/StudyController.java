package com.cs_study.interview.controller;

import java.util.Comparator;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cs_study.interview.dto.ParticipantDto;
import com.cs_study.interview.dto.ParticipantsResponse;
import com.cs_study.interview.dto.StudyEventDto;
import com.cs_study.interview.dto.SolveEventDto;
import com.cs_study.interview.service.SolveService;
import com.cs_study.interview.store.StudyPresenceStore;

@RestController
@RequestMapping("/api/study")
public class StudyController {

    private final StudyPresenceStore store;
    private final SimpMessagingTemplate messagingTemplate;
    private final SolveService solveService;

    public StudyController(
            StudyPresenceStore store,
            SimpMessagingTemplate messagingTemplate,
            SolveService solveService
    ) {
        this.store = store;
        this.messagingTemplate = messagingTemplate;
        this.solveService = solveService;
    }

    @GetMapping("/participants")
    public ParticipantsResponse participants() {
        var list = store.snapshot().stream()
                .map(p -> new ParticipantDto(p.getUserId(), p.getUsername(), p.isReady()))
                .sorted(Comparator.comparing(ParticipantDto::username))
                .toList();

        return new ParticipantsResponse(list);
    }

    // 클라이언트: /app/study/enter
    @MessageMapping("/study/enter")
    public void enter(org.springframework.messaging.Message<byte[]> message) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        var attrs = acc.getSessionAttributes();
        if (attrs == null) return;

        Object userIdObj = attrs.get("USER_ID");
        Object usernameObj = attrs.get("USERNAME");
        if (userIdObj == null || usernameObj == null) return;

        long userId = ((Number) userIdObj).longValue();
        String username = String.valueOf(usernameObj);

        String sessionId = acc.getSessionId();
        store.enter(sessionId, userId, username);

        ParticipantDto p = new ParticipantDto(userId, username, false);
        messagingTemplate.convertAndSend("/topic/study", new StudyEventDto("ENTER", p));
    }

    // 클라이언트: /app/study/leave
    @MessageMapping("/study/leave")
    public void leave(org.springframework.messaging.Message<byte[]> message) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        var attrs = acc.getSessionAttributes();
        if (attrs == null) return;

        Object userIdObj = attrs.get("USER_ID");
        Object usernameObj = attrs.get("USERNAME");
        if (userIdObj == null || usernameObj == null) return;

        long userId = ((Number) userIdObj).longValue();
        String username = String.valueOf(usernameObj);

        String sessionId = acc.getSessionId();
        store.leaveBySessionId(sessionId);

        ParticipantDto p = new ParticipantDto(userId, username, false);
        messagingTemplate.convertAndSend("/topic/study", new StudyEventDto("LEAVE", p));
    }

    // 클라이언트: /app/study/ready.toggle
    @MessageMapping("/study/ready.toggle")
    public void toggleReady(org.springframework.messaging.Message<byte[]> message) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        var attrs = acc.getSessionAttributes();
        if (attrs == null) return;

        Object userIdObj = attrs.get("USER_ID");
        Object usernameObj = attrs.get("USERNAME");
        if (userIdObj == null || usernameObj == null) return;

        long userId = ((Number) userIdObj).longValue();
        String username = String.valueOf(usernameObj);

        store.toggleReady(userId);

        boolean ready = store.find(userId)
                .map(StudyPresenceStore.ParticipantState::isReady)
                .orElse(false);

        ParticipantDto p = new ParticipantDto(userId, username, ready);
        messagingTemplate.convertAndSend("/topic/study", new StudyEventDto("READY", p));
    }

    // 클라이언트: /app/study/start
    @MessageMapping("/study/start")
    public void start(org.springframework.messaging.Message<byte[]> message) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        var attrs = acc.getSessionAttributes();
        if (attrs == null) return;

        Object userIdObj = attrs.get("USER_ID");
        Object usernameObj = attrs.get("USERNAME");
        if (userIdObj == null || usernameObj == null) return;

        long userId = ((Number) userIdObj).longValue();
        String username = String.valueOf(usernameObj);

        // 호스트만 시작 가능 (userId=1)
        if (userId != 1L) return;

        // 모두 준비 완료일 때만 시작 가능
        if (!store.allReady()) return;

        // ✅ 1) 문제풀이 시작 시점에:
        //    - (선택) 문제도 랜덤 섞기(true)
        //    - ✅ 참가자 턴 순서를 랜덤으로 "고정"하고, reset(인덱스 0부터)
        solveService.initSolveIfNeeded(true);

        // ✅ 2) START 이벤트 브로드캐스트 (프론트가 /solve로 이동)
        ParticipantDto host = new ParticipantDto(userId, username, true);
        messagingTemplate.convertAndSend("/topic/study", new StudyEventDto("START", host));

        // ✅ 3) Solve 상태를 바로 브로드캐스트해서,
        //    클라이언트가 /solve 진입하자마자 state를 받을 수 있게
        var state = solveService.currentState();
        messagingTemplate.convertAndSend("/topic/solve", new SolveEventDto("STATE", state));
    }
}