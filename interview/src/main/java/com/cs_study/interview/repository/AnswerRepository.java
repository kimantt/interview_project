package com.cs_study.interview.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cs_study.interview.entity.AnswerEntity;

public interface AnswerRepository extends JpaRepository<AnswerEntity, Long> {

	Optional<AnswerEntity> findFirstByUser_IdAndQuestion_QuestionOrderByIdAsc(Long userId, String question);
	
	Optional<AnswerEntity> findByUser_IdAndQuestion_Id(Long userId, Long questionId);
}
