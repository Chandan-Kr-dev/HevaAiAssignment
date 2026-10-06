"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/types";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Pure fetch: no state writes, so both the mount effect and manual
  // refresh can share it without tripping set-state-in-effect rules.
  const loadSession = useCallback(async (): Promise<SessionUser | null> => {
    try {
      return await apiFetch<SessionUser>("/auth/me");
    } catch (err) {
      // 401 just means signed out; anything else is a real problem.
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await loadSession());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [loadSession]);

  useEffect(() => {
    // Async continuations only (never synchronous setState): the guard flag
    // drops late responses after unmount instead of cascading renders.
    let cancelled = false;
    loadSession()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load session",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  const logout = useCallback(async () => {
    await apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, error, logout, refresh }),
    [user, loading, error, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
