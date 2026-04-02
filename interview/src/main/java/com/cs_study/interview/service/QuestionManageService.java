package com.cs_study.interview.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cs_study.interview.dto.ManageCategoryDto;
import com.cs_study.interview.dto.ManageQuestionItemDto;
import com.cs_study.interview.dto.QuestionAnswerUpdateRequest;
import com.cs_study.interview.dto.QuestionCreateRequest;
import com.cs_study.interview.dto.QuestionMetaUpdateRequest;
import com.cs_study.interview.entity.AnswerEntity;
import com.cs_study.interview.entity.QuestionEntity;
import com.cs_study.interview.entity.UserEntity;
import com.cs_study.interview.repository.AnswerRepository;
import com.cs_study.interview.repository.CategoryRepository;
import com.cs_study.interview.repository.QuestionRepository;
import com.cs_study.interview.repository.UserRepository;

@Service
public class QuestionManageService {

	private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public QuestionManageService(
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ManageCategoryDto> categories() {
        return categoryRepository.findAll().stream()
                .map(c -> new ManageCategoryDto(c.getId(), c.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ManageQuestionItemDto> list(long userId) {
        return questionRepository.findForManageByUserId(userId).stream()
                .map(r -> new ManageQuestionItemDto(
                        r.getQuestionId(),
                        r.getQuestionText(),
                        r.getCategoryId(),
                        r.getCategoryName(),
                        r.getAddDate() == null ? null : r.getAddDate().toLocalDate(),
                        r.getAnswerId(),
                        r.getMyAnswer()
                ))
                .toList();
    }

    @Transactional
    public void create(long userId, QuestionCreateRequest req) {
        String questionText = normalize(req.question(), 300, "문제명");
        String answerText = normalizeNullable(req.myAnswer(), 1000);

        var category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 카테고리입니다."));

        LocalDate addDate = req.addDate() == null ? LocalDate.now() : req.addDate();

        var question = new QuestionEntity(null, questionText, addDate, category, null);
        QuestionEntity saved = questionRepository.save(question);

        if (answerText != null && !answerText.isBlank()) {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
            var answer = new AnswerEntity(null, user, saved, answerText);
            answerRepository.save(answer);
        }
    }

    @Transactional
    public void updateMeta(long questionId, QuestionMetaUpdateRequest req) {
        String questionText = normalize(req.question(), 300, "문제명");

        var category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 카테고리입니다."));

        QuestionEntity question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));

        LocalDate addDate = req.addDate() == null ? LocalDate.now() : req.addDate();
        
        question.setQuestion(questionText);
        question.setCategory(category);
        question.setAddDate(addDate);
    }

    @Transactional
    public void upsertMyAnswer(long userId, long questionId, QuestionAnswerUpdateRequest req) {
        String answerText = normalize(req.myAnswer(), 1000, "답변");

        QuestionEntity question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));

        AnswerEntity answer = answerRepository.findByUser_IdAndQuestion_Id(userId, questionId)
                .orElseGet(() -> {
                    UserEntity user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
                    return new AnswerEntity(null, user, question, answerText);
                });

        answer.setAnswer(answerText);
        answerRepository.save(answer);
    }

    @Transactional
    public void deleteQuestion(long questionId) {
        QuestionEntity question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("문제를 찾을 수 없습니다."));
        questionRepository.delete(question);
    }
    
    private String normalize(String value, int maxLength, String fieldName) {
        String v = value == null ? "" : value.trim();
        if (v.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        }
        if (v.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " 길이가 너무 깁니다.");
        }
        return v;
    }

    private String normalizeNullable(String value, int maxLength) {
        if (value == null) return null;
        String v = value.trim();
        if (v.isEmpty()) return null;
        if (v.length() > maxLength) {
            throw new IllegalArgumentException("입력 길이가 너무 깁니다.");
        }
        return v;
    }
}
