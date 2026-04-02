package com.cs_study.interview.store;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

@Component
public class SolveRoomStore {

    // distinct question list
    private volatile List<String> questions = List.of();

    // ✅ 문제풀이 시작 시점에 고정되는 "턴 순서"
    // (예: [3, 1, 7] => 3번 유저 -> 1번 유저 -> 7번 유저 -> 다시 3번 ...)
    private volatile List<Long> turnOrderUserIds = List.of();
    
    private volatile List<Long> selectedQuestionIds = List.of();

    private final AtomicInteger questionIndex = new AtomicInteger(0);
    private final AtomicInteger solverIndex = new AtomicInteger(0);

    public synchronized void setQuestions(List<String> list) {
        this.questions = (list == null) ? List.of() : List.copyOf(list);
        if (questionIndex.get() >= this.questions.size()) questionIndex.set(0);
    }

    public List<String> getQuestions() {
        return questions;
    }

    public int getQuestionIndex() {
        return questionIndex.get();
    }

    public int getSolverIndex() {
        return solverIndex.get();
    }

    // ✅ turn order 설정/조회
    public synchronized void setTurnOrderUserIds(List<Long> userIds) {
        this.turnOrderUserIds = (userIds == null) ? List.of() : List.copyOf(userIds);
        if (solverIndex.get() >= this.turnOrderUserIds.size()) solverIndex.set(0);
    }

    public List<Long> getTurnOrderUserIds() {
        return turnOrderUserIds;
    }
    
    public synchronized void setSelectedQuestionIds(List<Long> ids) {
        this.selectedQuestionIds = (ids == null) ? List.of() : List.copyOf(ids);
    }

    public List<Long> getSelectedQuestionIds() {
        return selectedQuestionIds;
    }

    public synchronized void reset() {
        questionIndex.set(0);
        solverIndex.set(0);
        // turnOrder는 "문제풀이 시작 시점에 고정"이므로 reset에서 지우지 않음
        // 필요하면 아래를 켜서 완전 초기화 가능:
        // turnOrderUserIds = List.of();
    }

    public synchronized void next() {
        if (questions.isEmpty()) return;

        // 문제는 무조건 다음(순환)
        questionIndex.set((questionIndex.get() + 1) % questions.size());

        // 참가자가 있으면 solver도 다음(순환)
        if (!turnOrderUserIds.isEmpty()) {
            solverIndex.set((solverIndex.get() + 1) % turnOrderUserIds.size());
        }
    }

    public synchronized void prev() {
        if (questions.isEmpty()) return;

        int qi = questionIndex.get() - 1;
        if (qi < 0) qi = questions.size() - 1;
        questionIndex.set(qi);

        if (!turnOrderUserIds.isEmpty()) {
            int si = solverIndex.get() - 1;
            if (si < 0) si = turnOrderUserIds.size() - 1;
            solverIndex.set(si);
        }
    }
}