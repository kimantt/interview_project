package com.cs_study.interview.dto;

public record SolveEventDto(
		String type,       // "STATE" | "END"
        SolveStateDto state
        ) {

}
