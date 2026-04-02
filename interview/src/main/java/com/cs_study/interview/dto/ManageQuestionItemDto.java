package com.cs_study.interview.dto;

import java.time.LocalDate;

public record ManageQuestionItemDto(
		Long questionId,
        String question,
        Long categoryId,
        String categoryName,
        LocalDate addDate,
        Long answerId,
        String myAnswer
        ) {

}
