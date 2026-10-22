import {
  INPUT_LIMITS,
  rejectUnsafeText,
  rejectWeakText,
  sanitizeMultiline,
  sanitizePlainText,
} from "../lib/input-security";
import { logAppError } from "../lib/user-error";
import { isAuthConfigured } from "./auth";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export type CompanyPlan = "starter" | "pro" | "enterprise";
export type CompanyJobModelo = "Remoto" | "Híbrido" | "Presencial";

export type CompanyProfile = {
  userId: string;
  companyName: string;
  size: string;
  cnpj: string;
  location: string;
  sector: string;
  linkedin: string;
  plan: CompanyPlan;
  createdAt: string;
  updatedAt: string;
};

export type CompanyJob = {
  id: string;
  companyUserId: string;
  titulo: string;
  local: string;
  modelo: CompanyJobModelo;
  requisitos: string;
  descricao: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyCandidate = {
  id: string;
  name: string;
  role: string;
  match: number;
  skills: string[];
  summary: string;
  email: string;
  location: string;
  locked: boolean;
};

export type UpsertCompanyProfileInput = {
  companyName: string;
  size?: string;
  cnpj?: string;
  location?: string;
  sector?: string;
  linkedin?: string;
  plan?: CompanyPlan;
};

export type UpsertCompanyJobInput = {
  titulo: string;
  local: string;
  modelo: CompanyJobModelo;
  requisitos: string;
  descricao: string;
};

export type PublicCatalogJob = {
  id: string;
  titulo: string;
  local: string;
  modelo: string;
  requisitos: string;
  descricao: string;
};

export type PublicCatalogCompany = {
  id: string;
  name: string;
  sector: string;
  location: string;
  size: string;
  jobs: PublicCatalogJob[];
};

export type PublicCatalogJobDetail = PublicCatalogJob & {
  companyId: string;
  companyName: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

function mapPublicJob(raw: Record<string, unknown>): PublicCatalogJob {
  return {
    id: String(raw.id || ""),
    titulo: String(raw.titulo || ""),
    local: String(raw.local || ""),
    modelo: String(raw.modelo || "Remoto"),
    requisitos: String(raw.requisitos || ""),
    descricao: String(raw.descricao || ""),
  };
}

function mapPublicCompany(raw: Record<string, unknown>): PublicCatalogCompany {
  const jobsRaw = Array.isArray(raw.jobs) ? raw.jobs : [];
  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    sector: String(raw.sector || ""),
    location: String(raw.location || ""),
    size: String(raw.size || ""),
    jobs: jobsRaw
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map(mapPublicJob)
      .filter((job) => job.id && job.titulo),
  };
}

async function catalogRequest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`);
    if (response.status === 404) return null;
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) return null;
    return payload as T;
  } catch {
    return null;
  }
}

export async function fetchPublicCompanyCatalog(): Promise<PublicCatalogCompany[]> {
  const payload = await catalogRequest<{ empresas?: unknown[] }>("/catalogo/empresas");
  if (!payload) return [];
  const rows = Array.isArray(payload.empresas) ? payload.empresas : [];
  return rows
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map(mapPublicCompany)
    .filter((company) => company.id && company.name);
}

export async function fetchPublicCompany(companyId: string): Promise<PublicCatalogCompany | null> {
  const payload = await catalogRequest<Record<string, unknown>>(
    `/catalogo/empresas/${encodeURIComponent(companyId)}`,
  );
  if (!payload) return null;
  const company = mapPublicCompany(payload);
  return company.id ? company : null;
}

export async function fetchPublicJob(jobId: string): Promise<PublicCatalogJobDetail | null> {
  const payload = await catalogRequest<Record<string, unknown>>(
    `/catalogo/vagas/${encodeURIComponent(jobId)}`,
  );
  if (!payload) return null;
  const job = mapPublicJob(payload);
  if (!job.id) return null;
  return {
    ...job,
    companyId: String(payload.companyId || ""),
    companyName: String(payload.companyName || "Empresa Worky"),
  };
}

function assertCompanyConfig(): void {
  if (!isAuthConfigured() || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Depois rode backend/supabase_company_rh.sql no SQL Editor.",
    );
  }
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
  for (const value of [errorPayload.message, errorPayload.msg, errorPayload.detail, errorPayload.error_description, errorPayload.error, errorPayload.hint]) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

async function restRequest<T>(
  path: string,
  accessToken: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown> | Record<string, unknown>[];
    prefer?: string;
  } = {},
): Promise<T> {
  assertCompanyConfig();

  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  const payload = parseJsonSafely(rawBody);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Nao foi possivel falar com o Supabase agora."));
  }

  return payload as T;
}

function asPlan(value: unknown): CompanyPlan {
  if (value === "pro" || value === "enterprise" || value === "starter") {
    return value;
  }
  return "starter";
}

function asModelo(value: unknown): CompanyJobModelo {
  if (value === "Remoto" || value === "Híbrido" || value === "Presencial") {
    return value;
  }
  return "Remoto";
}

function mapCompanyProfile(row: Record<string, unknown>): CompanyProfile {
  return {
    userId: String(row.user_id || ""),
    companyName: String(row.company_name || ""),
    size: String(row.size || ""),
    cnpj: String(row.cnpj || ""),
    location: String(row.location || ""),
    sector: String(row.sector || ""),
    linkedin: String(row.linkedin || ""),
    plan: asPlan(row.plan),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapCompanyJob(row: Record<string, unknown>): CompanyJob {
  return {
    id: String(row.id || ""),
    companyUserId: String(row.company_user_id || ""),
    titulo: String(row.titulo || ""),
    local: String(row.local || ""),
    modelo: asModelo(row.modelo),
    requisitos: String(row.requisitos || ""),
    descricao: String(row.descricao || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

export function canUnlockCandidates(plan: CompanyPlan): boolean {
  return plan === "pro" || plan === "enterprise";
}

export async function fetchCompanyProfile(
  accessToken: string,
  userId: string,
): Promise<CompanyProfile | null> {
  const rows = await restRequest<Record<string, unknown>[]>(
    `company_profiles?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    accessToken,
  );
  const first = Array.isArray(rows) ? rows[0] : null;
  return first ? mapCompanyProfile(first) : null;
}

/** Se o Auth tem account_type=empresa mas company_profiles ainda nao existe (ex: confirmacao de e-mail), cria agora. */
export async function ensureCompanyProfileFromMetadata(
  accessToken: string,
  user: { id: string; name: string; userMetadata?: Record<string, unknown> },
): Promise<CompanyProfile | null> {
  const meta = user.userMetadata || {};
  const accountType = String(meta.account_type || meta.accountType || "").toLowerCase();
  if (accountType !== "empresa") {
    return null;
  }

  const existing = await fetchCompanyProfile(accessToken, user.id);
  if (existing) {
    return existing;
  }

  const companyName =
    String(meta.company_name || meta.full_name || meta.name || user.name || "").trim() || "Empresa Worky";

  return createCompanyProfile(accessToken, user.id, {
    companyName,
    size: String(meta.company_size || ""),
    cnpj: String(meta.company_cnpj || ""),
    location: String(meta.company_location || ""),
    sector: String(meta.company_sector || ""),
    linkedin: String(meta.company_linkedin || ""),
    plan: "starter",
  });
}

export async function createCompanyProfile(
  accessToken: string,
  userId: string,
  input: UpsertCompanyProfileInput,
): Promise<CompanyProfile> {
  const companyName = sanitizePlainText(input.companyName, INPUT_LIMITS.name);
  const size = sanitizePlainText(input.size || "", INPUT_LIMITS.short);
  const cnpj = sanitizePlainText(input.cnpj || "", INPUT_LIMITS.cpfCnpj);
  const location = sanitizePlainText(input.location || "", INPUT_LIMITS.short);
  const sector = sanitizePlainText(input.sector || "", INPUT_LIMITS.short);
  const linkedin = sanitizePlainText(input.linkedin || "", INPUT_LIMITS.text);

  const nameError = rejectWeakText(companyName, "Nome da empresa", 3);
  if (nameError) throw new Error(nameError);
  for (const [label, value] of [
    ["Setor", sector],
    ["Local", location],
    ["LinkedIn", linkedin],
  ] as const) {
    const unsafe = rejectUnsafeText(value, label);
    if (unsafe) throw new Error(unsafe);
  }

  const body = {
    user_id: userId,
    company_name: companyName,
    size,
    cnpj,
    location,
    sector,
    linkedin,
  };

  try {
    const rows = await restRequest<Record<string, unknown>[]>(
      "company_profiles",
      accessToken,
      {
        method: "POST",
        prefer: "return=representation",
        body,
      },
    );
    const first = Array.isArray(rows) ? rows[0] : null;
    if (first) return mapCompanyProfile(first);
  } catch (error) {
    logAppError("insert company_profiles via rest");
    const created = await createCompanyProfileViaApi(accessToken, userId, {
      companyName,
      size,
      cnpj,
      location,
      sector,
      linkedin,
    });
    if (created) return created;
    throw error instanceof Error ? error : new Error("Não foi possível criar o perfil RH agora.");
  }

  const created = await createCompanyProfileViaApi(accessToken, userId, {
    companyName,
    size,
    cnpj,
    location,
    sector,
    linkedin,
  });
  if (created) return created;
  throw new Error("Não foi possível criar o perfil RH agora.");
}

async function createCompanyProfileViaApi(
  accessToken: string,
  userId: string,
  input: {
    companyName: string;
    size: string;
    cnpj: string;
    location: string;
    sector: string;
    linkedin: string;
  },
): Promise<CompanyProfile | null> {
  try {
    const response = await fetch(`${API_URL}/empresa/perfil`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || typeof payload !== "object") {
      return null;
    }
    const row = payload as Record<string, unknown>;
    if (!row.userId && !row.user_id) return null;
    return {
      userId: String(row.userId || row.user_id || userId),
      companyName: String(row.companyName || row.company_name || input.companyName),
      size: String(row.size || input.size),
      cnpj: String(row.cnpj || input.cnpj),
      location: String(row.location || input.location),
      sector: String(row.sector || input.sector),
      linkedin: String(row.linkedin || input.linkedin),
      plan: asPlan(row.plan),
      createdAt: String(row.createdAt || row.created_at || ""),
      updatedAt: String(row.updatedAt || row.updated_at || ""),
    };
  } catch {
    return null;
  }
}

export async function updateCompanyPlan(
  accessToken: string,
  userId: string,
  plan: CompanyPlan,
): Promise<void> {
  const api = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  const response = await fetch(`${api}/empresa/plano`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) throw new Error("Não foi possível solicitar o plano.");
}

export async function listCompanyJobs(accessToken: string, userId: string): Promise<CompanyJob[]> {
  const rows = await restRequest<Record<string, unknown>[]>(
    `company_jobs?select=*&company_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`,
    accessToken,
  );
  return (Array.isArray(rows) ? rows : []).map(mapCompanyJob);
}

function sanitizeJobInput(input: UpsertCompanyJobInput): UpsertCompanyJobInput {
  const titulo = sanitizePlainText(input.titulo, INPUT_LIMITS.title);
  const local = sanitizePlainText(input.local, INPUT_LIMITS.short);
  const requisitos = sanitizeMultiline(input.requisitos, INPUT_LIMITS.text);
  const descricao = sanitizeMultiline(input.descricao, INPUT_LIMITS.longText);

  const tituloError = rejectWeakText(titulo, "Titulo", 5);
  if (tituloError) throw new Error(tituloError);
  const localUnsafe = rejectUnsafeText(local, "Local");
  if (localUnsafe) throw new Error(localUnsafe);
  if (!local.trim()) throw new Error("Informe o local da vaga.");
  const requisitosError = rejectWeakText(requisitos, "Requisitos", 8);
  if (requisitosError) throw new Error(requisitosError);
  const descricaoError = rejectWeakText(descricao, "Descricao", 20);
  if (descricaoError) throw new Error(descricaoError);

  return { titulo, local, modelo: input.modelo, requisitos, descricao };
}

export async function createCompanyJob(
  accessToken: string,
  userId: string,
  input: UpsertCompanyJobInput,
): Promise<CompanyJob> {
  const safe = sanitizeJobInput(input);

  const rows = await restRequest<Record<string, unknown>[]>(
    "company_jobs",
    accessToken,
    {
      method: "POST",
      prefer: "return=representation",
      body: {
        company_user_id: userId,
        titulo: safe.titulo,
        local: safe.local,
        modelo: safe.modelo,
        requisitos: safe.requisitos,
        descricao: safe.descricao,
      },
    },
  );

  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) {
    throw new Error("Nao foi possivel criar a vaga.");
  }
  return mapCompanyJob(first);
}

export async function updateCompanyJob(
  accessToken: string,
  userId: string,
  jobId: string,
  input: UpsertCompanyJobInput,
): Promise<CompanyJob> {
  const safe = sanitizeJobInput(input);

  const rows = await restRequest<Record<string, unknown>[]>(
    `company_jobs?id=eq.${encodeURIComponent(jobId)}&company_user_id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        titulo: safe.titulo,
        local: safe.local,
        modelo: safe.modelo,
        requisitos: safe.requisitos,
        descricao: safe.descricao,
      },
    },
  );

  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) {
    throw new Error("Vaga nao encontrada.");
  }
  return mapCompanyJob(first);
}

export async function deleteCompanyJob(
  accessToken: string,
  userId: string,
  jobId: string,
): Promise<void> {
  await restRequest(
    `company_jobs?id=eq.${encodeURIComponent(jobId)}&company_user_id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    { method: "DELETE" },
  );
}

function tokenize(...parts: string[]): string[] {
  return parts
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9+#.\u00c0-\u024f]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function scoreProfileAgainstJob(profileJson: Record<string, unknown>, job: CompanyJob): {
  match: number;
  skills: string[];
  role: string;
  name: string;
  email: string;
  location: string;
  summary: string;
} {
  const skillsRaw = profileJson.skills;
  const skillLabels = Array.isArray(skillsRaw)
    ? skillsRaw.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "label" in item) {
          return String((item as { label?: unknown }).label || "");
        }
        return "";
      }).filter(Boolean)
    : [];

  const headline = String(profileJson.headline || profileJson.title || profileJson.cargo || job.titulo);
  const name = String(profileJson.fullName || profileJson.name || profileJson.nome || "Candidato");
  const email = String(profileJson.email || "");
  const location = String(profileJson.location || profileJson.cidade || job.local || "Brasil");
  const about = String(profileJson.about || profileJson.bio || profileJson.summary || "");

  const jobTokens = new Set(tokenize(job.titulo, job.requisitos, job.descricao));
  const profileTokens = new Set(tokenize(headline, about, skillLabels.join(" ")));
  let hits = 0;
  jobTokens.forEach((token) => {
    if (profileTokens.has(token)) {
      hits += 1;
    }
  });

  const base = jobTokens.size > 0 ? Math.round((hits / jobTokens.size) * 100) : 70;
  const match = Math.max(55, Math.min(98, base + Math.min(skillLabels.length, 8)));

  return {
    match,
    skills: skillLabels.slice(0, 4),
    role: headline,
    name,
    email,
    location,
    summary: about || `Perfil com afinidade para ${job.titulo}.`,
  };
}

function buildLockedPlaceholders(job: CompanyJob): CompanyCandidate[] {
  const count = 3 + (job.titulo.length % 3);
  return Array.from({ length: count }, (_, index) => ({
    id: `${job.id}-locked-${index}`,
    name: "Candidato bloqueado",
    role: job.titulo,
    match: Math.max(72, 94 - index * 5),
    skills: [],
    summary: "",
    email: "",
    location: job.local || job.modelo,
    locked: true,
  }));
}

export async function listCandidatesForJob(
  accessToken: string,
  job: CompanyJob,
  plan: CompanyPlan,
): Promise<CompanyCandidate[]> {
  if (!canUnlockCandidates(plan)) {
    return buildLockedPlaceholders(job);
  }

  const api = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  const response = await fetch(`${api}/empresa/candidatos/${encodeURIComponent(job.id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Consulta de candidatos não autorizada ou indisponível.");
  return await response.json() as CompanyCandidate[];
}