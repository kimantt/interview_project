package com.cs_study.interview.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cs_study.interview.dto.LoginRequest;
import com.cs_study.interview.dto.LoginResponse;
import com.cs_study.interview.entity.UserEntity;
import com.cs_study.interview.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@Service
public class AuthService {
	
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest req, HttpSession session) {
        String username = req.username() == null ? "" : req.username().trim();
        String password = req.password() == null ? "" : req.password();

        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("아이디/비밀번호를 입력해주세요.");
        }

        UserEntity user = userRepository.findByUsername(username)
        	    .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // 세션에 로그인 정보 저장
        session.setAttribute("USER_ID", user.getId());
        session.setAttribute("USERNAME", user.getUsername());

        return new LoginResponse(user.getId(), user.getUsername());
    }
}
