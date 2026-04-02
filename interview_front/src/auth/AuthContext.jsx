import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, logoutApi, meApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // { userId, username } or null
  const [loading, setLoading] = useState(true);  // 앱 시작 시 me 조회

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await meApi();
        if (mounted) setUser(me);
      } catch (e) {
        // 401이면 로그인 안된 상태로 둠
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => {
    return {
      user,
      loading,
      isLoggedIn: !!user,

      async login(username, password) {
        const data = await loginApi(username, password);
        setUser(data);
        return data;
      },

      async logout() {
        await logoutApi();
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}