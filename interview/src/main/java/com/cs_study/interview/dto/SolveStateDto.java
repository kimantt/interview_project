package com.cs_study.interview.dto;

public record SolveStateDto(
		int questionIndex,
        int totalQuestions,
        String question,
        long solverUserId,
        String solverUsername
        ) {

}
