package com.cs_study.interview.dto;

import java.time.LocalDate;

public record QuestionMetaUpdateRequest(
		String question,
		Long categoryId,
        LocalDate addDate
        ) {

}
