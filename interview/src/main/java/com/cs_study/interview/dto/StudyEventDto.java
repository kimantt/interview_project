package com.cs_study.interview.dto;

public record StudyEventDto(
		String type,            // "ENTER" | "LEAVE" | "READY"
        ParticipantDto participant
        ) {

}
