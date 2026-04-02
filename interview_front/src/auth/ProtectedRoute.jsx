import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return children;
}