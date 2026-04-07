package com.cs_study.interview.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cs_study.interview.dto.MyAnswerResponse;
import com.cs_study.interview.dto.SolveAnswerUpdateRequest;
import com.cs_study.interview.dto.SolveEventDto;
import com.cs_study.interview.dto.SolveScopeRequest;
import com.cs_study.interview.entity.AnswerEntity;
import com.cs_study.interview.repository.AnswerRepository;
import com.cs_study.interview.repository.QuestionRepository;
import com.cs_study.interview.repository.UserRepository;
import com.cs_study.interview.service.SolveService;
import com.cs_study.interview.store.SolveRoomStore;

import jakarta.servlet.http.HttpSession;

//문제풀이 실시간(STOMP) + 개인 답안/범위(REST) 엔드포인트
@RestController
@RequestMapping("/api/solve")
public class SolveController {

	private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final SolveService solveService;
    private final SolveRoomStore roomStore;
    private final SimpMessagingTemplate messaging;

    public SolveController(
            AnswerRepository answerRepository,
            QuestionRepository questionRepository,
            UserRepository userRepository,
            SolveService solveService,
            SolveRoomStore roomStore,
            SimpMessagingTemplate messaging
    ) {
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.solveService = solveService;
        this.roomStore = roomStore;
        this.messaging = messaging;
    }
    
    // 현재 room 상태를 구독자들에게 동기화할 때 사용
    @MessageMapping("/solve/sync")
    public void sync(Message<byte[]> message) {
        solveService.loadQuestionsIfEmpty();
        broadcastState();
    }

    // 다음/이전 조작
    @MessageMapping("/solve/next")
    public void next(Message<byte[]> message) {
        Long userId = getUserId(message);
        if (userId == null) return;

        solveService.loadQuestionsIfEmpty();
        solveService.next();
        broadcastState();
    }

    @MessageMapping("/solve/prev")
    public void prev(Message<byte[]> message) {
        Long userId = getUserId(message);
        if (userId == null) return;

        solveService.loadQuestionsIfEmpty();
        solveService.prev();
        broadcastState();
    }

    private void broadcastState() {
        var state = solveService.currentState();
        messaging.convertAndSend("/topic/solve", new SolveEventDto("STATE", state));
    }

    private Long getUserId(Message<byte[]> message) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        var attrs = acc.getSessionAttributes();
        if (attrs == null) return null;
        Object userIdObj = attrs.get("USER_ID");
        if (!(userIdObj instanceof Number n)) return null;
        return n.longValue();
    }

    // 정답 보기 버튼 클릭 시 호출
    @GetMapping("/my-answer")
    public ResponseEntity<MyAnswerResponse> myAnswer(
            @RequestParam("question") String question,
            HttpSession session
    ) {
    	long userId = currentUserId(session);

        var entityOpt = answerRepository.findFirstByUser_IdAndQuestion_QuestionOrderByIdAsc(userId, question);
        if (entityOpt.isEmpty()) {
            // 해당 질문에 대한 내 답변이 없을 수 있음
            return ResponseEntity.ok(new MyAnswerResponse(question, ""));
        }

        var e = entityOpt.get();
        return ResponseEntity.ok(new MyAnswerResponse(question, e.getAnswer()));
    }
    
    // 문제풀이 시작 전에 사용할 문제 범위를 서버 메모리에 저장
    @PostMapping("/scope")
    public ResponseEntity<?> configureScope(@RequestBody SolveScopeRequest req) {
    	var ids = (req == null || req.questionIds() == null)
                ? java.util.List.<Long>of()
                : req.questionIds().stream().filter(id -> id != null && id > 0).distinct().toList();

        if (ids.isEmpty()) {
            throw new IllegalArgumentException("문제 범위를 먼저 선택해주세요.");
        }
        
        roomStore.setSelectedQuestionIds(ids);
        roomStore.setQuestions(java.util.List.of());
        roomStore.reset();
        return ResponseEntity.noContent().build();
    }
    
    // 현재 로그인 사용자의 답안을 생성/수정(upsert)
    @PostMapping("/my-answer")
    public ResponseEntity<?> upsertMyAnswer(@RequestBody SolveAnswerUpdateRequest req, HttpSession session) {
        long userId = currentUserId(session);

        String questionText = normalize(req.question(), 300, "문제");
        String answerText = normalize(req.answer(), 1000, "답안");

        var question = questionRepository.findFirstByQuestionOrderByIdAsc(questionText)
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));

        AnswerEntity entity = answerRepository.findByUser_IdAndQuestion_Id(userId, question.getId())
                .orElseGet(() -> {
                    var user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
                    return new AnswerEntity(null, user, question, answerText);
                });

        entity.setAnswer(answerText);
        answerRepository.save(entity);
        return ResponseEntity.noContent().build();
    }

    private long currentUserId(HttpSession session) {
        Object userIdObj = session.getAttribute("USER_ID");
        if (!(userIdObj instanceof Number n)) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return n.longValue();
    }

    private String normalize(String value, int maxLength, String fieldName) {
        String v = value == null ? "" : value.trim();
        if (v.isBlank()) throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        if (v.length() > maxLength) throw new IllegalArgumentException(fieldName + " 길이가 너무 깁니다.");
        return v;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
