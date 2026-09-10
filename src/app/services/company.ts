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
  for (const value of [errorPayload.message, errorPayload.msg, errorPayload.error_description, errorPayload.error, errorPayload.hint]) {
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

export async function createCompanyProfile(
  accessToken: string,
  userId: string,
  input: UpsertCompanyProfileInput,
): Promise<CompanyProfile> {
  const companyName = input.companyName.trim();
  if (!companyName) {
    throw new Error("Informe o nome da empresa.");
  }

  const rows = await restRequest<Record<string, unknown>[]>(
    "company_profiles",
    accessToken,
    {
      method: "POST",
      prefer: "return=representation",
      body: {
        user_id: userId,
        company_name: companyName,
        size: input.size?.trim() || "",
        cnpj: input.cnpj?.trim() || "",
        location: input.location?.trim() || "",
        sector: input.sector?.trim() || "",
        linkedin: input.linkedin?.trim() || "",
        plan: input.plan || "starter",
      },
    },
  );

  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) {
    throw new Error("Conta empresa criada no Auth, mas o perfil RH nao foi salvo. Rode o SQL supabase_company_rh.sql.");
  }
  return mapCompanyProfile(first);
}

export async function updateCompanyPlan(
  accessToken: string,
  userId: string,
  plan: CompanyPlan,
): Promise<CompanyProfile> {
  const rows = await restRequest<Record<string, unknown>[]>(
    `company_profiles?user_id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: { plan },
    },
  );
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first) {
    throw new Error("Perfil da empresa nao encontrado. Cadastre-se como Empresa primeiro.");
  }
  return mapCompanyProfile(first);
}

export async function listCompanyJobs(accessToken: string, userId: string): Promise<CompanyJob[]> {
  const rows = await restRequest<Record<string, unknown>[]>(
    `company_jobs?select=*&company_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`,
    accessToken,
  );
  return (Array.isArray(rows) ? rows : []).map(mapCompanyJob);
}

export async function createCompanyJob(
  accessToken: string,
  userId: string,
  input: UpsertCompanyJobInput,
): Promise<CompanyJob> {
  const titulo = input.titulo.trim();
  if (!titulo) {
    throw new Error("Informe o titulo da vaga.");
  }

  const rows = await restRequest<Record<string, unknown>[]>(
    "company_jobs",
    accessToken,
    {
      method: "POST",
      prefer: "return=representation",
      body: {
        company_user_id: userId,
        titulo,
        local: input.local.trim(),
        modelo: input.modelo,
        requisitos: input.requisitos.trim(),
        descricao: input.descricao.trim(),
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
  const titulo = input.titulo.trim();
  if (!titulo) {
    throw new Error("Informe o titulo da vaga.");
  }

  const rows = await restRequest<Record<string, unknown>[]>(
    `company_jobs?id=eq.${encodeURIComponent(jobId)}&company_user_id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        titulo,
        local: input.local.trim(),
        modelo: input.modelo,
        requisitos: input.requisitos.trim(),
        descricao: input.descricao.trim(),
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

  try {
    const rows = await restRequest<Record<string, unknown>[]>(
      "professional_profiles?select=user_id,profile_json,completed_at&order=updated_at.desc&limit=40",
      accessToken,
    );

    const candidates = (Array.isArray(rows) ? rows : [])
      .map((row) => {
        const profileJson =
          row.profile_json && typeof row.profile_json === "object"
            ? (row.profile_json as Record<string, unknown>)
            : {};
        const scored = scoreProfileAgainstJob(profileJson, job);
        return {
          id: String(row.user_id || crypto.randomUUID()),
          name: scored.name,
          role: scored.role,
          match: scored.match,
          skills: scored.skills,
          summary: scored.summary,
          email: scored.email,
          location: scored.location,
          locked: false,
        } satisfies CompanyCandidate;
      })
      .sort((a, b) => b.match - a.match)
      .slice(0, 8);

    if (candidates.length > 0) {
      return candidates;
    }
  } catch {
    // Sem perfis ainda ou SQL/policy pendente: fallback desbloqueado de demonstracao.
  }

  return buildLockedPlaceholders(job).map((candidate, index) => ({
    ...candidate,
    id: `${job.id}-demo-${index}`,
    name: `Candidato ${index + 1}`,
    locked: false,
    skills: tokenize(job.requisitos).slice(0, 3),
    summary: `Compatibilidade estimada com ${job.titulo}.`,
  }));
}
