import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type AuthSession,
  type AuthUser,
  clearStoredSession,
  fetchCurrentUser,
  getStoredSession,
  isSessionExpired,
  refreshSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  storeSession,
} from "../services/auth";

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

type AuthActionResult = {
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (input: SignInInput) => Promise<AuthActionResult>;
  signUp: (input: SignUpInput) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveSessionAndUser(
  existingSession: AuthSession,
): Promise<{ session: AuthSession; user: AuthUser | null }> {
  let session = existingSession;

  if (isSessionExpired(session)) {
    const refreshed = await refreshSession(session.refreshToken);
    if (!refreshed.session) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }
    session = refreshed.session;
    storeSession(session);
  }

  const user = await fetchCurrentUser(session.accessToken);
  return { session, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const storedSession = getStoredSession();
      if (!storedSession) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const resolved = await resolveSessionAndUser(storedSession);
        if (!cancelled) {
          setSession(resolved.session);
          setUser(resolved.user);
        }
      } catch {
        clearStoredSession();
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: Boolean(user && session),
      async signIn(input) {
        const result = await signInWithEmail(input.email, input.password);
        if (!result.session) {
          throw new Error("Nao foi possivel iniciar a sessao agora.");
        }

        const resolvedUser = result.user ?? (await fetchCurrentUser(result.session.accessToken));
        if (!resolvedUser) {
          throw new Error("Nao foi possivel carregar seu perfil agora.");
        }

        storeSession(result.session);
        setSession(result.session);
        setUser(resolvedUser);

        return {
          needsEmailConfirmation: false,
        };
      },
      async signUp(input) {
        const result = await signUpWithEmail(input.name, input.email, input.password);

        if (result.session) {
          const resolvedUser = result.user ?? (await fetchCurrentUser(result.session.accessToken));
          if (!resolvedUser) {
            throw new Error("Sua conta foi criada, mas nao foi possivel carregar o perfil agora.");
          }
          storeSession(result.session);
          setSession(result.session);
          setUser(resolvedUser);
          return {
            needsEmailConfirmation: false,
          };
        }

        clearStoredSession();
        setSession(null);
        setUser(null);

        return {
          needsEmailConfirmation: true,
        };
      },
      async signOut() {
        const activeSession = session;
        clearStoredSession();
        setSession(null);
        setUser(null);

        if (activeSession) {
          await signOut(activeSession.accessToken).catch(() => undefined);
        }
      },
      async refreshUser() {
        if (!session) {
          setUser(null);
          return;
        }

        const resolved = await resolveSessionAndUser(session);
        setSession(resolved.session);
        setUser(resolved.user);
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
