import { useEffect, useMemo, useState } from "react";
import { fetchManageQuestions } from "../api/questionManage";
import "../css/QuestionScopeSelector.css";

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuestionScopeSelector({ compact = false, onSelectionChange }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maxCount, setMaxCount] = useState(10);
  const [activeTab, setActiveTab] = useState("date");
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await fetchManageQuestions();
        setQuestions(Array.isArray(rows) ? rows : []);
      } catch (e) {
        setError(e?.response?.data?.message || "문제 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const maxLimit = Math.max(1, questions.length || 1);

  const clampedMaxCount = useMemo(() => {
    const n = Number(maxCount);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > maxLimit) return maxLimit;
    return n;
  }, [maxCount, maxLimit]);

  useEffect(() => {
    setMaxCount((prev) => {
      const n = Number(prev);
      if (!Number.isFinite(n)) return 1;
      if (n > maxLimit) return maxLimit;
      if (n < 1) return 1;
      return n;
    });
  }, [maxLimit]);

  const groupsByDate = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      const key = q.addDate || "미지정";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    });
    return [...map.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  }, [questions]);

  const groupsByCategory = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      const key = q.categoryName || "미분류";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    });
    return [...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [questions]);

  const currentGroups = activeTab === "date" ? groupsByDate : groupsByCategory;

  const selectedCount = selectedIds.size;

  const autoFilledIds = useMemo(() => {
    if (selectedCount >= clampedMaxCount) return [];
    const remain = questions
      .map((q) => q.questionId)
      .filter((id) => !selectedIds.has(id));
    return shuffle(remain).slice(0, clampedMaxCount - selectedCount);
  }, [questions, selectedIds, selectedCount, clampedMaxCount]);

  const finalCount = Math.min(clampedMaxCount, selectedCount + autoFilledIds.length);

  const finalSelectedIds = useMemo(() => [
    ...Array.from(selectedIds),
    ...autoFilledIds,
  ], [selectedIds, autoFilledIds]);

  useEffect(() => {
    onSelectionChange?.({
      maxCount: clampedMaxCount,
      manualSelectedIds: Array.from(selectedIds),
      finalSelectedIds,
    });
  }, [onSelectionChange, clampedMaxCount, selectedIds, finalSelectedIds]);

  const toggleQuestion = (questionId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
        return next;
      }
      if (next.size >= clampedMaxCount) {
        alert(`최대 문제 갯수(${clampedMaxCount})를 초과할 수 없습니다.`);
        return prev;
      }
      next.add(questionId);
      return next;
    });
  };

  const toggleGroup = (groupQuestions) => {
    const ids = groupQuestions.map((q) => q.questionId);
    const allChecked = ids.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        ids.forEach((id) => next.delete(id));
        return next;
      }

      const toAdd = ids.filter((id) => !next.has(id));
      if (next.size + toAdd.length > clampedMaxCount) {
        alert(`최대 문제 갯수(${clampedMaxCount})를 초과해서 그룹 선택할 수 없습니다.`);
        return prev;
      }

      toAdd.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = questions.map((q) => q.questionId);
    const isAllChecked = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

    if (isAllChecked) {
      setSelectedIds(new Set());
      return;
    }

    if (clampedMaxCount < allIds.length) {
      setMaxCount(allIds.length);
    }

    setSelectedIds(new Set(allIds));
  };

  return (
    <div className={`scope-selector ${compact ? "compact" : ""}`}>
      <div className="scope-header-row">
        <div className="scope-label">최대 문제 갯수</div>
        <div className="scope-count">직접 선택: {selectedCount} / {clampedMaxCount}</div>
      </div>

      <div className="scope-max-row">
        <input
          type="range"
          min={1}
          max={maxLimit}
          value={clampedMaxCount}
          onChange={(e) => setMaxCount(Number(e.target.value))}
        />
        <input
          type="number"
          min={1}
          max={maxLimit}
          value={clampedMaxCount}
          onChange={(e) => setMaxCount(Number(e.target.value))}
        />
      </div>

      <div className="scope-sub-count">
        최종 출제 수: <b>{finalCount}</b>개 (랜덤 보충 {autoFilledIds.length}개)
      </div>

      <div className="scope-tab-row">
        <button
          type="button"
          className={activeTab === "date" ? "active" : ""}
          onClick={() => setActiveTab("date")}
        >
          학습날짜
        </button>
        <button
          type="button"
          className={activeTab === "category" ? "active" : ""}
          onClick={() => setActiveTab("category")}
        >
          카테고리
        </button>
      </div>

      <label className="scope-all-check">
        <input
          type="checkbox"
          checked={
            questions.length > 0 && questions.every((q) => selectedIds.has(q.questionId))
          }
          onChange={toggleAll}
        />
        문제 전체 선택
      </label>

      {loading && <div className="scope-info">문제 목록 불러오는 중...</div>}
      {error && <div className="scope-error">{error}</div>}

      {!loading && !error && questions.length === 0 && (
        <div className="scope-info">등록된 문제가 없습니다.</div>
      )}

      {!loading && !error && questions.length > 0 && (
        <div className="scope-groups">
          {currentGroups.map(([groupName, groupQuestions]) => {
            const ids = groupQuestions.map((q) => q.questionId);
            const groupChecked = ids.every((id) => selectedIds.has(id));

            return (
              <div key={groupName} className="scope-group">
                <label className="scope-group-head">
                  <input
                    type="checkbox"
                    checked={groupChecked}
                    onChange={() => toggleGroup(groupQuestions)}
                  />
                  <span>{groupName}</span>
                  <span className="scope-group-count">({groupQuestions.length})</span>
                </label>

                <div className="scope-question-list">
                  {groupQuestions.map((q) => (
                    <label key={q.questionId} className="scope-question-item">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.questionId)}
                        onChange={() => toggleQuestion(q.questionId)}
                      />
                      <span>{q.question || "(문제 없음)"}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}