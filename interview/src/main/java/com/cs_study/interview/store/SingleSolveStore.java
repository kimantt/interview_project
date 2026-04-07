package com.cs_study.interview.store;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

@Component
public class SingleSolveStore {

	private final Map<Long, SingleState> states = new ConcurrentHashMap<>();

    public void configureScope(long userId, List<Long> questionIds) {
        SingleState state = states.computeIfAbsent(userId, ignored -> new SingleState());
        synchronized (state) {
            state.selectedQuestionIds = (questionIds == null) ? List.of() : List.copyOf(questionIds);
            state.questions = List.of();
            state.questionIndex.set(0);
        }
    }

    public List<Long> getSelectedQuestionIds(long userId) {
        SingleState state = states.get(userId);
        if (state == null) return List.of();
        synchronized (state) {
            return state.selectedQuestionIds;
        }
    }

    public void setQuestions(long userId, List<String> questions) {
        SingleState state = states.computeIfAbsent(userId, ignored -> new SingleState());
        synchronized (state) {
            state.questions = (questions == null) ? List.of() : List.copyOf(questions);
            if (state.questionIndex.get() >= state.questions.size()) {
                state.questionIndex.set(0);
            }
        }
    }

    public List<String> getQuestions(long userId) {
        SingleState state = states.get(userId);
        if (state == null) return List.of();
        synchronized (state) {
            return state.questions;
        }
    }

    public int getQuestionIndex(long userId) {
        SingleState state = states.get(userId);
        if (state == null) return 0;
        return state.questionIndex.get();
    }

    public void next(long userId) {
        SingleState state = states.get(userId);
        if (state == null) return;
        synchronized (state) {
            if (state.questions.isEmpty()) return;
            state.questionIndex.set((state.questionIndex.get() + 1) % state.questions.size());
        }
    }

    public void prev(long userId) {
        SingleState state = states.get(userId);
        if (state == null) return;
        synchronized (state) {
            if (state.questions.isEmpty()) return;
            int qi = state.questionIndex.get() - 1;
            if (qi < 0) qi = state.questions.size() - 1;
            state.questionIndex.set(qi);
        }
    }

    private static class SingleState {
        private volatile List<Long> selectedQuestionIds = List.of();
        private volatile List<String> questions = List.of();
        private final AtomicInteger questionIndex = new AtomicInteger(0);
    }
}
