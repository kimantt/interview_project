import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../css/ModeSelectPage.css";

export default function ModeSelectPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mode-select-page">
      <div className="mode-select-card">
        <div className="mode-select-header">
          <h1>플레이 모드 선택</h1>
          <p>
            <b>{user?.username}</b>님, 플레이 방식을 선택해주세요.
          </p>
        </div>

        <div className="mode-select-actions">
          <button onClick={() => navigate("/multiplayer")}>멀티플레이</button>
          <button onClick={() => navigate("/single/range")}>싱글플레이</button>
          <button onClick={() => navigate("/questions/manage")}>문제 관리</button>
        </div>

        <button className="mode-select-logout" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
