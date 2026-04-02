import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStomp } from "../ws/StompContext";
import { fetchMyAnswer, upsertMyAnswer } from "../api/solve";
import "../css/SolvePage.css";

// 마크다운 렌더러
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function SolvePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    status,
    solveState,
    connectAndEnter,
    sendSolveSync,
    sendSolveNext,
    sendSolvePrev,
    clearStartSignal,
  } = useStomp();

  // 내 답안(개별)
  const [myAnswer, setMyAnswer] = useState("");
  const [answerVisible, setAnswerVisible] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");

  // 답안 탭 상태 (MARKDOWN | RAW)
  const [answerTab, setAnswerTab] = useState("MARKDOWN");
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");

  // 1) SolvePage 진입 시 STOMP 연결 보장
  useEffect(() => {
    if (status === "DISCONNECTED") {
      connectAndEnter(user.userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user.userId]);

  // 2) CONNECTED 되면 sync 발행
  useEffect(() => {
    if (status === "CONNECTED") {
      sendSolveSync();
    }
  }, [status, sendSolveSync]);

  // 문제/인덱스 바뀌면 내 정답 보기 상태는 로컬에서만 초기화
  useEffect(() => {
    setAnswerVisible(false);
    setMyAnswer("");
    setAnswerError("");
    setLoadingAnswer(false);

    setSavingAnswer(false);
    setAnswerTab("MARKDOWN");
    setIsEditingAnswer(false);
    setAnswerDraft("");
  }, [solveState?.questionIndex, solveState?.question]);

  const total = solveState?.totalQuestions ?? 0;
  const idx = solveState?.questionIndex ?? 0;

  const hasQuestions = total > 0;
  const isLastQuestion = hasQuestions && idx === total - 1;
  const isFirstQuestion = hasQuestions && idx === 0;

  // 현재 문제 푸는 사람만 이전/다음 가능(턴 기반)
  const isMyTurn =
    solveState && String(solveState.solverUserId) === String(user.userId);

  const progressText = useMemo(() => {
    if (!solveState || !solveState.totalQuestions) return "0 / 0";
    return `${solveState.questionIndex + 1} / ${solveState.totalQuestions}`;
  }, [solveState]);

  const onPrev = () => {
    if (status !== "CONNECTED") return;
    if (!isMyTurn) return;
    sendSolvePrev();
  };

  const onNext = () => {
    if (status !== "CONNECTED") return;
    if (!isMyTurn) return;

    // 마지막 문제에서는 더 이상 넘어가지 않음
    if (isLastQuestion) return;

    sendSolveNext();
  };

  // 내 답안 보기(개별 REST)
  const onToggleAnswer = async () => {
    if (!solveState?.question) return;

    if (answerVisible) {
      setAnswerVisible(false);
      setIsEditingAnswer(false);
      return;
    }

    if (!myAnswer) {
      setLoadingAnswer(true);
      setAnswerError("");
      try {
        const data = await fetchMyAnswer(solveState.question);
        setMyAnswer(data?.answer ?? "");
      } catch (e) {
        setAnswerError("정답을 불러오지 못했습니다.");
      } finally {
        setLoadingAnswer(false);
      }
    }

    setAnswerVisible(true);
  };

  const onStartEditAnswer = () => {
    setAnswerError("");
    setAnswerDraft(myAnswer || "");
    setIsEditingAnswer(true);
  };

  const onSubmitAnswer = async () => {
    if (!solveState?.question) return;

    setSavingAnswer(true);
    setAnswerError("");
    try {
      await upsertMyAnswer(solveState.question, answerDraft);
      setMyAnswer(answerDraft);
      setIsEditingAnswer(false);
    } catch (e) {
      setAnswerError(e?.response?.data?.message || "답안 저장에 실패했습니다.");
    } finally {
      setSavingAnswer(false);
    }
  };

  // 문제풀이 종료(준비방으로 이동)
  const onExitSolve = () => {
    const ok = window.confirm("문제풀이를 종료하고 준비방으로 이동할까요?");
    if (!ok) return;

    try {
      clearStartSignal?.();
    } catch (_) {}

    navigate("/");
  };

  // 로딩/미동기화 상태 처리
  if (!solveState) {
    return (
      <div className="solve-page">
        <header className="solve-header">
          <div>
            <div className="solve-title">문제 풀이</div>
            <div className="solve-sub">
              로그인: <b>{user.username}</b> / STOMP: <StatusBadge status={status} />
            </div>
          </div>
          <button className="solve-header-btn" onClick={onExitSolve}>
            문제풀이 종료
          </button>
        </header>

        <main className="solve-main">
          <section className="solve-card">
            <div className="solve-section">
              <div className="solve-label">상태</div>
              <div className="solve-question-box">문제 상태를 불러오는 중...</div>
              <div className="solve-hint">
                CONNECTED가 되면 자동으로 /app/solve/sync를 발행합니다.
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="solve-page">
      <header className="solve-header">
        <div>
          <div className="solve-title">문제 풀이</div>
          <div className="solve-sub">
            로그인: <b>{user.username}</b> / STOMP: <StatusBadge status={status} />
          </div>
          <div className="solve-sub2">
            진행: <b>{progressText}</b>
            <span className="solve-dot">·</span>
            내 차례: <b>{isMyTurn ? "YES" : "NO"}</b>
          </div>
        </div>

        <button className="solve-header-btn" onClick={onExitSolve}>
          문제풀이 종료
        </button>
      </header>

      <main className="solve-main">
        <section className="solve-card">
          {/* 질문이 하나도 없는 경우 */}
          {!hasQuestions && (
            <div className="solve-section">
              <div className="solve-label">알림</div>
              <div className="solve-question-box">등록된 문제가 없습니다.</div>
              <div className="solve-hint">DB에 interview 질문이 있는지 확인해주세요.</div>
            </div>
          )}

          {/* 질문이 있는 경우 */}
          {hasQuestions && (
            <>
              <div className="solve-section">
                <div className="solve-label">현재 문제 푸는 사람</div>
                <div className="solve-big-text">{solveState.solverUsername || "-"}</div>
                {!isMyTurn && (
                  <div className="solve-hint">
                    지금은 <b>{solveState.solverUsername || "다른 사용자"}</b>님의 차례입니다.
                  </div>
                )}
              </div>

              <div className="solve-section">
                <div className="solve-label">문제</div>
                <div className="solve-question-box">
                  {solveState.question ? solveState.question : "문제가 없습니다."}
                </div>
              </div>

              <div className="solve-section">
                <div className="solve-label">내 답안</div>

                <button
                  className="solve-answer-btn"
                  style={{
                    opacity: status === "CONNECTED" ? 1 : 0.5,
                    cursor: status === "CONNECTED" ? "pointer" : "not-allowed",
                  }}
                  disabled={status !== "CONNECTED" || !solveState.question}
                  onClick={onToggleAnswer}
                >
                  {answerVisible ? "답안 숨기기" : "답안 보기"}
                </button>

                {loadingAnswer && <div className="solve-hint">불러오는 중...</div>}
                {answerError && (
                  <div className="solve-hint" style={{ color: "#991B1B" }}>
                    {answerError}
                  </div>
                )}

                {/* 탭 + 답안 박스 */}
                {answerVisible && !loadingAnswer && (
                  <>
                    {/* 탭 바 */}
                    <div className="solve-tab-bar">
                      <button
                        type="button"
                        onClick={() => setAnswerTab("MARKDOWN")}
                        className={`solve-tab ${answerTab === "MARKDOWN" ? "active" : ""}`}
                      >
                        마크다운
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswerTab("RAW")}
                        className={`solve-tab ${answerTab === "RAW" ? "active" : ""}`}
                      >
                        원문
                      </button>

                      <button
                        type="button"
                        className="solve-answer-edit-btn"
                        onClick={isEditingAnswer ? onSubmitAnswer : onStartEditAnswer}
                        disabled={savingAnswer}
                      >
                        {savingAnswer
                          ? "저장 중..."
                          : isEditingAnswer
                          ? "등록 완료"
                          : myAnswer
                          ? "답안 수정"
                          : "답안 등록"}
                      </button>
                    </div>

                    {/* 답안 내용 */}
                    <div className="solve-answer-box">
                      {isEditingAnswer ? (
                        <textarea
                          className="solve-answer-editor"
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          placeholder="답안을 입력하세요"
                        />
                      ) : myAnswer ? (
                        answerTab === "RAW" ? (
                          // 원문 보기
                          <div className="solve-raw-text">{myAnswer}</div>
                        ) : (
                          // 마크다운 렌더링
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {myAnswer}
                          </ReactMarkdown>
                        )
                      ) : (
                        <div style={{ color: "#6B7280" }}>등록된 답안이 없습니다.</div>
                      )}
                    </div>
                  </>
                )}

                <div className="solve-hint">답안은 사용자별로 다르며, 내 답안만 조회됩니다.</div>
              </div>

              <div className="solve-divider" />

              <div className="solve-nav-row">
                <button
                  className="solve-nav-btn"
                  style={{
                    opacity:
                      status === "CONNECTED" && isMyTurn && !isFirstQuestion ? 1 : 0.5,
                    cursor:
                      status === "CONNECTED" && isMyTurn && !isFirstQuestion
                        ? "pointer"
                        : "not-allowed",
                  }}
                  disabled={status !== "CONNECTED" || !isMyTurn || total === 0 || isFirstQuestion}
                  onClick={onPrev}
                  title={
                    isFirstQuestion
                      ? "첫 번째 문제입니다."
                      : !isMyTurn
                      ? "내 턴에서만 이동할 수 있습니다."
                      : ""
                  }
                >
                  {isFirstQuestion ? "첫 번째 문제입니다" : "이전"}
                </button>

                <button
                  className="solve-nav-btn"
                  style={{
                    opacity: status === "CONNECTED" && isMyTurn && !isLastQuestion ? 1 : 0.5,
                    cursor:
                      status === "CONNECTED" && isMyTurn && !isLastQuestion
                        ? "pointer"
                        : "not-allowed",
                  }}
                  disabled={
                    status !== "CONNECTED" || !isMyTurn || total === 0 || isLastQuestion
                  }
                  onClick={onNext}
                  title={
                    isLastQuestion
                      ? "마지막 문제입니다."
                      : !isMyTurn
                      ? "내 턴에서만 이동할 수 있습니다."
                      : ""
                  }
                >
                  {isLastQuestion ? "마지막 문제입니다" : "다음"}
                </button>
              </div>

              {isLastQuestion && (
                <div className="solve-hint">
                  마지막 문제입니다. 더 이상 다음 문제로 넘어갈 수 없습니다.
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

// 뱃지용 컴포넌트 (동적 색상 처리는 인라인 스타일 유지)
function StatusBadge({ status }) {
  const bg =
    status === "CONNECTED"
      ? "#DCFCE7"
      : status === "CONNECTING"
      ? "#FEF9C3"
      : status === "ERROR"
      ? "#FEE2E2"
      : "#E5E7EB";

  const color =
    status === "CONNECTED"
      ? "#166534"
      : status === "CONNECTING"
      ? "#854D0E"
      : status === "ERROR"
      ? "#991B1B"
      : "#374151";

  return (
    <span className="solve-status" style={{ background: bg, color }}>
      {status}
    </span>
  );
}