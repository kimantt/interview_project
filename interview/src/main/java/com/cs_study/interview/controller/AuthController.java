package com.cs_study.interview.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cs_study.interview.dto.LoginRequest;
import com.cs_study.interview.dto.LoginResponse;
import com.cs_study.interview.dto.MeResponse;
import com.cs_study.interview.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
public class AuthController {
	
	private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req, HttpSession session) {
        LoginResponse res = authService.login(req, session);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpSession session, HttpServletResponse response) {
        session.invalidate();

        ResponseCookie deleteCookie = ResponseCookie.from("SESSION", "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", deleteCookie.toString());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/auth/me")
    public ResponseEntity<MeResponse> me(HttpSession session) {
        Long userId = (Long) session.getAttribute("USER_ID");
        String username = (String) session.getAttribute("USERNAME");
        return ResponseEntity.ok(new MeResponse(userId, username));
    }
}
