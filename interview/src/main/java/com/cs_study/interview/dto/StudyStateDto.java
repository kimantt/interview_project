package com.cs_study.interview.dto;

import java.util.List;

public record StudyStateDto(
		int onlineCount,
        List<ParticipantDto> participants
        ) {

}
