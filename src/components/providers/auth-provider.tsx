"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { API_BASE_URL } from "@/lib/constants";
import {
  AuthStorage,
  AuthUser,
  clearStoredAuth,
  getStoredAuth,
  normalizeAuthPayload,
  normalizeUser,
  saveStoredAuth,
} from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (data: unknown) => void;
  logout: () => void;
  loading: boolean;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = async () => {
    const stored = getStoredAuth();
    if (!stored?.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: stored.refreshToken,
        }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const mergedData = normalizeAuthPayload(data, stored);

      saveStoredAuth(mergedData);

      return mergedData.accessToken || false;
    } catch (err) {
      void err;
      return false;
    }
  };

  const fetchMe = async (accessToken: string, fallback?: AuthStorage | null) => {
    const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      throw new Error("FETCH_ME_FAILED");
    }

    const data = await res.json();
    return normalizeUser(data?.data ?? data, fallback?.user ?? null);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = getStoredAuth();

        if (!stored?.accessToken) {
          setLoading(false);
          return;
        }

        try {
          const me = await fetchMe(stored.accessToken, stored);
          const normalizedStored = normalizeAuthPayload({ ...stored, user: me }, stored);

          saveStoredAuth(normalizedStored);
          setUser(me);
          setToken(stored.accessToken);
        } catch (error: unknown) {
          const isUnauthorized =
            error instanceof Error && error.message === "UNAUTHORIZED";

          if (!isUnauthorized) {
            void error;
            setUser(normalizeUser(stored.user, null));
            setToken(stored.accessToken);
            setLoading(false);
            return;
          }

          const newAccessToken = await refreshToken();

          if (!newAccessToken) {
            clearStoredAuth();
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
          }

          const updatedStored = getStoredAuth();
          const me = await fetchMe(newAccessToken, updatedStored);
          const normalizedStored = normalizeAuthPayload(
            { ...updatedStored, accessToken: newAccessToken, user: me },
            updatedStored
          );

          saveStoredAuth(normalizedStored);
          setUser(me);
          setToken(newAccessToken);
        }
      } catch (error) {
        void error;
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (data: unknown) => {
    const normalizedData = normalizeAuthPayload(data);

    saveStoredAuth(normalizedData);
    setToken(normalizedData.accessToken || null);
    setUser(normalizedData.user || null);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return ctx;
};
