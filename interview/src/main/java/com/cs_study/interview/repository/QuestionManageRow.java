package com.cs_study.interview.repository;

import java.time.LocalDateTime;

public interface QuestionManageRow {
	Long getQuestionId();
    String getQuestionText();
    Long getCategoryId();
    String getCategoryName();
    LocalDateTime getAddDate();
    Long getAnswerId();
    String getMyAnswer();
}
