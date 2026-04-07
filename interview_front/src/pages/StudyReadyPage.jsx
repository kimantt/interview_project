import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStomp } from "../ws/StompContext";
import "../css/StudyReadyPage.css";
import { configureSolveScope } from "../api/solve";
import QuestionScopeSelector from "../components/QuestionScopeSelector";

// 멀티플레이 준비방: 참가자/준비/시작 + 문제범위 설정
export default function StudyReadyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const {
    status,
    participants,
    connectAndEnter,
    toggleReady,
    sendLeave,
    disconnect,
    startSignal,
    sendStart,
  } = useStomp();

  // participants가 undefined/null/객체여도 항상 배열로 보정
  const participantsArr = Array.isArray(participants) ? participants : [];

  useEffect(() => {
    connectAndEnter(user.userId);

    const onBeforeUnload = () => {
      try {
        sendLeave();
      } catch (_) {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.userId]);

  // START 브로드캐스트 수신 시 전원 이동
  useEffect(() => {
    if (startSignal) {
      sessionStorage.setItem("solveMode", "multi");
      navigate("/solve", { state: { mode: "multi" } });
    }
  }, [startSignal, navigate]);

  // 정렬도 participantsArr만
  const sorted = useMemo(() => {
    return participantsArr
      .slice()
      .sort((a, b) => String(a.username).localeCompare(String(b.username)));
  }, [participantsArr]);

  // myReady도 participantsArr만
  const myReady = useMemo(() => {
    const me = participantsArr.find(
      (p) => String(p.userId) === String(user.userId)
    );
    return me?.ready ?? false;
  }, [participantsArr, user.userId]);

  const [scope, setScope] = useState({ finalSelectedIds: [] });

  const isHost = String(user.userId) === "1";
  const allReady =
    participantsArr.length > 0 && participantsArr.every((p) => !!p.ready);

  // 호스트 시작 시 범위를 먼저 서버에 적용한 뒤 START 발행
  const onMainButtonClick = async () => {
    if (isHost && allReady) {
      try {
        await configureSolveScope(scope.finalSelectedIds || []);
        sendStart();
      } catch (e) {
        alert(e?.response?.data?.message || "문제 범위를 적용하지 못했습니다.");
      }
      return;
    }
    toggleReady();
  };

  const mainButtonText =
    isHost && allReady ? "시작" : myReady ? "준비 해제" : "준비";
  const mainButtonDisabled = status !== "CONNECTED";

  const onBackToMode = () => {
    navigate("/");
  };

  const onLogout = async () => {
    try {
      sendLeave();
      disconnect();
      await logout();
      alert("로그아웃");
    } catch (e) {
      alert("로그아웃 실패");
    }
  };

  return (
    <div className="study-ready-page">
      <header className="study-ready-header">
        <div>
          <div className="study-ready-title">스터디 준비</div>
          <div className="study-ready-sub">
            로그인: <b>{user.username}</b> / STOMP:{" "}
            <StatusBadge status={status} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="study-ready-small-btn" onClick={onBackToMode}>
            모드 선택으로
          </button>
          <button className="study-ready-small-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="study-ready-main">
        <section className="study-ready-card">
          <div className="study-ready-card-header">
            <div className="study-ready-card-title">현재 접속자</div>
            <div className="study-ready-count">{sorted.length}명</div>
          </div>

          <div className="study-ready-list">
            {sorted.length === 0 ? (
              <div className="study-ready-empty">접속자가 없습니다.</div>
            ) : (
              sorted.map((p) => (
                <div key={p.userId} className="study-ready-row">
                  <div className="study-ready-name">
                    {p.username}
                    {String(p.userId) === String(user.userId) && (
                      <span className="study-ready-me-tag">나</span>
                    )}
                  </div>
                  <span
                    className="study-ready-ready-tag"
                    style={{
                      background: p.ready ? "#DCFCE7" : "#E5E7EB",
                      color: p.ready ? "#166534" : "#374151",
                    }}
                  >
                    {p.ready ? "준비" : "대기"}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="study-ready-divider" />

          <div className="study-ready-actions">
            <button
              className="study-ready-btn"
              style={{
                background:
                  isHost && allReady
                    ? "#2563eb"
                    : myReady
                    ? "#16a34a"
                    : "#111827",
                opacity: status === "CONNECTED" ? 1 : 0.5,
                cursor: status === "CONNECTED" ? "pointer" : "not-allowed",
              }}
              disabled={mainButtonDisabled}
              onClick={onMainButtonClick}
              title={status !== "CONNECTED" ? "STOMP 연결 필요" : ""}
            >
              {mainButtonText}
            </button>
          </div>
        </section>

        <section className="study-ready-range-card">
          <div className="study-ready-card-header">
            <div className="study-ready-card-title">문제 범위 설정</div>
          </div>
          <div className="study-ready-range-placeholder">
            <QuestionScopeSelector compact onSelectionChange={setScope} />
          </div>
        </section>
      </main>
    </div>
  );
}

// 뱃지 컴포넌트 (동적 색상 처리는 인라인 유지)
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
    <span className="study-ready-status" style={{ background: bg, color }}>
      {status}
    </span>
  );
}