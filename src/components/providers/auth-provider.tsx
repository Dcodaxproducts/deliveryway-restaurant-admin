"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { API_BASE_URL } from "@/lib/constants";
import {
  isAuthInitializationCurrent,
  nextAuthRevisionForStorageSync,
  syncAuthStorageEvent,
  type AuthStorageSyncSource,
} from "@/lib/auth-initialization";
import { getRequestLocale } from "@/config/i18n";
import {
  AUTH_STORAGE_EVENT,
  AUTH_STORAGE_KEY,
  AuthStorage,
  AuthUser,
  clearTransientWorkspaceSelection,
  clearStoredAuth,
  getStoredAuth,
  normalizeAuthPayload,
  normalizeUser,
  saveStoredAuth,
} from "@/lib/auth";
import { refreshStoredAccessToken } from "@/lib/axios";

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
  const authRevision = useRef(0);

  const fetchMe = async (accessToken: string, fallback?: AuthStorage | null) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        "Accept-Language": getRequestLocale(),
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
      const initializationRevision = authRevision.current;

      try {
        const stored = getStoredAuth();

        if (!stored?.accessToken) {
          setLoading(false);
          return;
        }

        try {
          const me = clearTransientWorkspaceSelection(
            await fetchMe(stored.accessToken, stored),
          );
          const normalizedStored = normalizeAuthPayload({ ...stored, user: me }, stored);

          if (
            !isAuthInitializationCurrent(authRevision.current, initializationRevision)
          ) {
            return;
          }

          saveStoredAuth(normalizedStored);
          setUser(me);
          setToken(stored.accessToken);
        } catch (error: unknown) {
          if (!isAuthInitializationCurrent(authRevision.current, initializationRevision)) {
            return;
          }

          const isUnauthorized =
            error instanceof Error && error.message === "UNAUTHORIZED";

          if (!isUnauthorized) {
            void error;
            setUser(
              clearTransientWorkspaceSelection(
                normalizeUser(stored.user, null),
              ),
            );
            setToken(stored.accessToken);
            setLoading(false);
            return;
          }

          let newAccessToken: string | null;

          try {
            newAccessToken = await refreshStoredAccessToken();
          } catch {
            if (!isAuthInitializationCurrent(authRevision.current, initializationRevision)) {
              return;
            }
            setUser(
              clearTransientWorkspaceSelection(
                normalizeUser(stored.user, null),
              ),
            );
            setToken(stored.accessToken);
            return;
          }

          if (
            !isAuthInitializationCurrent(authRevision.current, initializationRevision)
          ) {
            return;
          }

          if (!newAccessToken) {
            clearStoredAuth();
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
          }

          const updatedStored = getStoredAuth();
          const me = clearTransientWorkspaceSelection(
            await fetchMe(newAccessToken, updatedStored),
          );
          const normalizedStored = normalizeAuthPayload(
            { ...updatedStored, accessToken: newAccessToken, user: me },
            updatedStored
          );

          if (!isAuthInitializationCurrent(authRevision.current, initializationRevision)) {
            return;
          }

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

  useEffect(() => {
    const syncStoredAuth = (source: AuthStorageSyncSource) => {
      authRevision.current = nextAuthRevisionForStorageSync(
        authRevision.current,
        source,
      );
      const stored = getStoredAuth();
      setToken(stored?.accessToken || null);
      setUser(
        stored?.user
          ? clearTransientWorkspaceSelection(normalizeUser(stored.user, null))
          : null,
      );
    };

    const syncSameTabAuth = () => syncStoredAuth("same-tab");
    const syncCrossTabAuth = (event: StorageEvent) => {
      syncAuthStorageEvent(event.key, AUTH_STORAGE_KEY, () => {
        syncStoredAuth("cross-tab");
      });
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncSameTabAuth);
    window.addEventListener("storage", syncCrossTabAuth);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncSameTabAuth);
      window.removeEventListener("storage", syncCrossTabAuth);
    };
  }, []);

  const login = (data: unknown) => {
    authRevision.current += 1;
    const normalizedData = normalizeAuthPayload(data);
    const user = clearTransientWorkspaceSelection(normalizedData.user);
    const sanitizedData = { ...normalizedData, user };

    saveStoredAuth(sanitizedData);
    setToken(sanitizedData.accessToken || null);
    setUser(user);
  };

  const logout = () => {
    authRevision.current += 1;
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
