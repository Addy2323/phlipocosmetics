import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SessionUser, UserRole } from "./auth-server";

type AuthCtx = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
  updateUser: (u: SessionUser) => void;
  hasRole: (roles: UserRole[]) => boolean;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  updateUser: () => {},
  hasRole: () => false,
});

const AUTH_STORAGE_KEY = "philipo_auth_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionUser;
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = (u: SessionUser) => {
    setUser(u);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUser = (u: SessionUser) => {
    setUser(u);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
  };

  const checkRole = (roles: UserRole[]) => {
    if (!user || !user.isActive) return false;
    return roles.includes(user.role);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        updateUser,
        hasRole: checkRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
