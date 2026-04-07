package com.cs_study.interview.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cs_study.interview.dto.QuestionAnswerUpdateRequest;
import com.cs_study.interview.dto.QuestionCreateRequest;
import com.cs_study.interview.dto.QuestionMetaUpdateRequest;
import com.cs_study.interview.service.QuestionManageService;

import jakarta.servlet.http.HttpSession;

//문제/카테고리/개인답변 관리 REST API
@RestController
@RequestMapping("/api/questions/manage")
public class QuestionManageController {

	private final QuestionManageService questionManageService;

    public QuestionManageController(QuestionManageService questionManageService) {
        this.questionManageService = questionManageService;
    }

    @GetMapping("/categories")
    public ResponseEntity<?> categories() {
        return ResponseEntity.ok(questionManageService.categories());
    }

    @GetMapping("/list")
    public ResponseEntity<?> list(HttpSession session) {
        long userId = currentUserId(session);
        return ResponseEntity.ok(questionManageService.list(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody QuestionCreateRequest req, HttpSession session) {
        long userId = currentUserId(session);
        questionManageService.create(userId, req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{questionId}/meta")
    public ResponseEntity<?> updateMeta(@PathVariable long questionId, @RequestBody QuestionMetaUpdateRequest req) {
        questionManageService.updateMeta(questionId, req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{questionId}/answer")
    public ResponseEntity<?> upsertAnswer(
            @PathVariable long questionId,
            @RequestBody QuestionAnswerUpdateRequest req,
            HttpSession session
    ) {
        long userId = currentUserId(session);
        questionManageService.upsertMyAnswer(userId, questionId, req);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable long questionId) {
        questionManageService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    private long currentUserId(HttpSession session) {
        Object userIdObj = session.getAttribute("USER_ID");
        if (!(userIdObj instanceof Number n)) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return n.longValue();
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
