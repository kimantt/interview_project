import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuestionScopeSelector from "../components/QuestionScopeSelector";
import { configureSolveScope } from "../api/solve";
import "../css/SingleRangePage.css";

export default function SingleRangePage() {
  const navigate = useNavigate();
  const [scope, setScope] = useState({ finalSelectedIds: [] });
  const [submitting, setSubmitting] = useState(false);

  const onStart = async () => {
    setSubmitting(true);
    try {
      await configureSolveScope(scope.finalSelectedIds || []);
      navigate("/solve");
    } catch (e) {
      alert(e?.response?.data?.message || "문제 범위를 적용하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="single-range-page">
      <div className="single-range-card">
        <h1>싱글플레이 문제 범위 선택</h1>
        <p>문제 범위를 설정하고 혼자 문제를 풀 수 있습니다.</p>

        <QuestionScopeSelector onSelectionChange={setScope} />

        <div className="single-range-actions">
          <button onClick={() => navigate("/")}>모드 선택으로</button>
          <button onClick={onStart} disabled={submitting}>
            {submitting ? "적용 중..." : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}