package com.cs_study.interview.dto;

import java.time.LocalDate;

public record QuestionCreateRequest(
		String question,
        Long categoryId,
        LocalDate addDate,
        String myAnswer
        ) {

}
