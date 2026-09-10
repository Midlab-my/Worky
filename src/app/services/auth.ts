const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const AUTH_STORAGE_KEY = "worky.auth.session";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string | null;
  emailConfirmedAt: string | null;
  userMetadata: Record<string, unknown>;
}

type AuthResponse = {
  session: AuthSession | null;
  user: AuthUser | null;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  accessToken?: string;
};

function assertAuthConfig(): void {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return;
  }

  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend para habilitar login e cadastro.");
}

function parseJsonSafely(raw: string): unknown {
  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const errorPayload = payload as Record<string, unknown>;
  const candidates = [
    errorPayload.msg,
    errorPayload.message,
    errorPayload.error_description,
    errorPayload.error,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function getNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveAvatarUrlFromMetadata(userMetadata: Record<string, unknown>): string {
  const candidates = [userMetadata.avatar_url, userMetadata.avatarUrl, userMetadata.picture];

  for (const value of candidates) {
    const avatarUrl = getStringValue(value);
    if (avatarUrl) {
      return avatarUrl;
    }
  }

  return "";
}

function normalizeUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const user = raw as Record<string, unknown>;
  const userMetadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  const fallbackName = getStringValue(user.email).split("@")[0] || "Perfil Worky";
  const name =
    getStringValue(userMetadata.full_name) ||
    getStringValue(userMetadata.name) ||
    fallbackName;

  return {
    id: getStringValue(user.id),
    email: getStringValue(user.email),
    name,
    avatarUrl: resolveAvatarUrlFromMetadata(userMetadata) || null,
    createdAt: getStringValue(user.created_at) || null,
    emailConfirmedAt:
      getStringValue(user.email_confirmed_at) ||
      getStringValue(user.confirmed_at) ||
      null,
    userMetadata,
  };
}

function normalizeResponse(payload: unknown): AuthResponse {
  if (!payload || typeof payload !== "object") {
    return { session: null, user: null };
  }

  const root = payload as Record<string, unknown>;
  const sessionSource =
    root.session && typeof root.session === "object"
      ? (root.session as Record<string, unknown>)
      : root;

  const accessToken = getStringValue(sessionSource.access_token);
  const refreshToken = getStringValue(sessionSource.refresh_token);
  const tokenType = getStringValue(sessionSource.token_type) || "bearer";
  const expiresAtFromPayload = getNumericValue(sessionSource.expires_at);
  const expiresIn = getNumericValue(sessionSource.expires_in) ?? 3600;
  const expiresAt = expiresAtFromPayload ?? Math.floor(Date.now() / 1000) + expiresIn;

  const session =
    accessToken && refreshToken
      ? {
          accessToken,
          refreshToken,
          expiresAt,
          tokenType,
        }
      : null;

  const userSource =
    root.user && typeof root.user === "object"
      ? root.user
      : sessionSource.user && typeof sessionSource.user === "object"
        ? sessionSource.user
        : null;

  return {
    session,
    user: normalizeUser(userSource),
  };
}

async function authRequest<T = unknown>(
  path: string,
  { method = "GET", body, accessToken }: RequestOptions = {},
): Promise<T> {
  assertAuthConfig();

  const headers = new Headers({
    apikey: SUPABASE_ANON_KEY,
  });

  if (body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawBody = await response.text();
  const payload = parseJsonSafely(rawBody);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Nao foi possivel completar a autenticacao."));
  }

  return payload as T;
}

export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.accessToken === "string" &&
      typeof parsed.refreshToken === "string" &&
      typeof parsed.expiresAt === "number"
    ) {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt,
        tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : "bearer",
      };
    }
  } catch {
    // ignore invalid local data
  }

  clearStoredSession();
  return null;
}

export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isSessionExpired(session: AuthSession): boolean {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return session.expiresAt <= nowInSeconds + 30;
}

export function getUserFirstName(user: AuthUser | null): string {
  if (!user?.name) {
    return "Perfil";
  }

  return user.name.trim().split(/\s+/)[0] || "Perfil";
}

export function getUserAvatarUrl(user: AuthUser | null): string {
  return getStringValue(user?.avatarUrl) || resolveAvatarUrlFromMetadata(user?.userMetadata || {});
}

export function getUserInitials(user: AuthUser | null): string {
  const source = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const initials = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "W";
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const payload = await authRequest("/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });

  return normalizeResponse(payload);
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  extraData: Record<string, unknown> = {},
): Promise<AuthResponse> {
  const payload = await authRequest("/signup", {
    method: "POST",
    body: {
      email,
      password,
      data: {
        full_name: name,
        name,
        ...extraData,
      },
    },
  });

  return normalizeResponse(payload);
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  const payload = await authRequest("/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });

  return normalizeResponse(payload);
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  const payload = await authRequest("/user", {
    accessToken,
  });

  return normalizeUser(payload);
}

function getProfileAvatarUrlFromPayload(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    return "";
  }

  const root = raw as Record<string, unknown>;
  return getStringValue(root.avatarUrl);
}

export async function fetchProfileAvatarUrl(userId: string, accessToken: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !userId || !accessToken) {
    return null;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/professional_profiles?select=profile_json&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const rawBody = await response.text();
  const payload = parseJsonSafely(rawBody);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Nao foi possivel carregar a foto do perfil."));
  }

  const rows = Array.isArray(payload) ? payload : [];
  const firstRow = rows[0] as Record<string, unknown> | undefined;
  const avatarUrl = getProfileAvatarUrlFromPayload(firstRow?.profile_json);

  return avatarUrl || null;
}

export async function signOut(accessToken: string): Promise<void> {
  await authRequest("/logout", {
    method: "POST",
    accessToken,
  });
}
