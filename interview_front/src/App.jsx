import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import StudyReadyPage from "./pages/StudyReadyPage";
import SolvePage from "./pages/SolvePage";
import ModeSelectPage from "./pages/ModeSelectPage";
import SingleRangePage from "./pages/SingleRangePage";
import QuestionManagePage from "./pages/QuestionManagePage";
import { StompProvider } from "./ws/StompContext";

export default function App() {
  // 인증 상태 기반 페이지 라우팅 진입점
  return (
    <BrowserRouter>
      <AuthProvider>
        <StompProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ModeSelectPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/multiplayer"
              element={
                <ProtectedRoute>
                  <StudyReadyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/single/range"
              element={
                <ProtectedRoute>
                  <SingleRangePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions/manage"
              element={
                <ProtectedRoute>
                  <QuestionManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/solve"
              element={
                <ProtectedRoute>
                  <SolvePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
          </Routes>
        </StompProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}