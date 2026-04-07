package com.cs_study.interview.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.cs_study.interview.dto.SolveStateDto;
import com.cs_study.interview.repository.QuestionRepository;
import com.cs_study.interview.store.SolveRoomStore;
import com.cs_study.interview.store.StudyPresenceStore;
import com.cs_study.interview.store.StudyPresenceStore.ParticipantState;

@Service
public class SolveService {

    private final QuestionRepository questionRepository;
    private final SolveRoomStore roomStore;
    private final StudyPresenceStore presenceStore;

    public SolveService(QuestionRepository questionRepository, SolveRoomStore roomStore, StudyPresenceStore presenceStore) {
        this.questionRepository = questionRepository;
        this.roomStore = roomStore;
        this.presenceStore = presenceStore;
    }

    // 문제풀이 시작 시: 문제 리스트 구성 + 풀이자 순서 초기화
    public synchronized void initSolveIfNeeded(boolean shuffleQuestions) {
    	// 1) 문제 목록을 매번 새로 구성
    	var list = buildQuestionList(shuffleQuestions);
        roomStore.setQuestions(list);

    	// 2) 참가자 턴 순서를 매번 랜덤 고정
        List<ParticipantState> participants = presenceStore.snapshot().stream()
                .sorted(Comparator.comparingLong(ParticipantState::getUserId))
                .toList();

        var order = new ArrayList<Long>();
        for (var p : participants) {
            order.add(p.getUserId());
        }

        if (order.size() >= 2) {
            Collections.shuffle(order);
        }

        roomStore.setTurnOrderUserIds(order);

        // 인덱스 초기화(문제 0번, solver 0번)
        roomStore.reset();
    }

    public void loadQuestionsIfEmpty() {
        if (!roomStore.getQuestions().isEmpty()) return;

        roomStore.setQuestions(buildQuestionList(false));
    }

    public void reloadQuestions(boolean shuffleQuestions) {
    	var list = buildQuestionList(shuffleQuestions);
        roomStore.setQuestions(list);
        roomStore.reset();
    }

    // scope로 선택된 questionId 기준으로 실제 출제용 문제 리스트를 생성
    private ArrayList<String> buildQuestionList(boolean shuffleQuestions) {
        List<Long> scopedIds = roomStore.getSelectedQuestionIds();
        if (scopedIds == null || scopedIds.isEmpty()) {
            return new ArrayList<>();
        }

        var list = new ArrayList<>(questionRepository.findQuestionsByIdsOrdered(scopedIds));
        if (shuffleQuestions && list.size() >= 2) {
            Collections.shuffle(list);
        }

        return list;
    }

    public SolveStateDto currentState() {
        List<String> questions = roomStore.getQuestions();
        int total = questions.size();
        int qi = roomStore.getQuestionIndex();
        String question = (total == 0) ? "" : questions.get(qi);

        List<Long> order = roomStore.getTurnOrderUserIds();

        long solverUserId = 0L;
        String solverUsername = "";

        if (!order.isEmpty()) {
            int si = roomStore.getSolverIndex();
            if (si >= order.size()) si = 0;

            long uid = order.get(si);

            var map = presenceStore.snapshot().stream()
                    .collect(java.util.stream.Collectors.toMap(
                            ParticipantState::getUserId,
                            ParticipantState::getUsername,
                            (a, b) -> a
                    ));

            solverUserId = uid;
            solverUsername = map.getOrDefault(uid, "");
        }

        return new SolveStateDto(qi, total, question, solverUserId, solverUsername);
    }

    public void next() {
        roomStore.next();
    }

    public void prev() {
        roomStore.prev();
    }
}