export type PlatformBrand = {
  id: string;
  label: string;
  domain: string;
  color: string;
  bg: string;
  /** Slug em cdn.simpleicons.org quando existir */
  iconSlug?: string;
};

const BRANDS: PlatformBrand[] = [
  { id: "alura", label: "Alura", domain: "alura.com.br", color: "#0527de", bg: "#e8ecff" },
  { id: "coursera", label: "Coursera", domain: "coursera.org", color: "#0056d2", bg: "#e8f1ff", iconSlug: "coursera" },
  { id: "udemy", label: "Udemy", domain: "udemy.com", color: "#a435f0", bg: "#f3e8ff", iconSlug: "udemy" },
  { id: "fgv", label: "FGV", domain: "educacao-executiva.fgv.br", color: "#003366", bg: "#e8eef5" },
  { id: "google", label: "Google", domain: "grow.google", color: "#4285f4", bg: "#e8f0fe", iconSlug: "google" },
  { id: "microsoft", label: "Microsoft", domain: "learn.microsoft.com", color: "#00a4ef", bg: "#e5f6fd", iconSlug: "microsoft" },
  { id: "aws", label: "AWS", domain: "aws.amazon.com", color: "#ff9900", bg: "#fff4e5", iconSlug: "amazonwebservices" },
  { id: "amazon", label: "AWS", domain: "aws.amazon.com", color: "#ff9900", bg: "#fff4e5", iconSlug: "amazonwebservices" },
  { id: "linkedin", label: "LinkedIn Learning", domain: "linkedin.com", color: "#0a66c2", bg: "#e8f3fb", iconSlug: "linkedin" },
  { id: "edx", label: "edX", domain: "edx.org", color: "#02262b", bg: "#e6eaea", iconSlug: "edx" },
  { id: "cisco", label: "Cisco", domain: "skillsforall.com", color: "#049fd9", bg: "#e6f6fc", iconSlug: "cisco" },
  { id: "ibm", label: "IBM", domain: "ibm.com", color: "#054ada", bg: "#e8eeff", iconSlug: "ibm" },
  { id: "meta", label: "Meta", domain: "coursera.org", color: "#0668e1", bg: "#e8f1fc", iconSlug: "meta" },
  { id: "rocketseat", label: "Rocketseat", domain: "rocketseat.com.br", color: "#8257e5", bg: "#f0e9ff" },
  { id: "freecodecamp", label: "freeCodeCamp", domain: "freecodecamp.org", color: "#0a0a23", bg: "#e8e8ef", iconSlug: "freecodecamp" },
  { id: "deeplearning", label: "DeepLearning.AI", domain: "deeplearning.ai", color: "#1a73e8", bg: "#e8f1fc" },
  { id: "udacity", label: "Udacity", domain: "udacity.com", color: "#02b3e4", bg: "#e6f8fc", iconSlug: "udacity" },
  { id: "senai", label: "SENAI", domain: "sp.senai.br", color: "#e30613", bg: "#fde8ea" },
  { id: "sebrae", label: "Sebrae", domain: "sebrae.com.br", color: "#005ca9", bg: "#e6f0f8" },
  { id: "worky", label: "Worky", domain: "worky.vercel.app", color: "#0052ff", bg: "#e8efff" },
  { id: "azure", label: "Microsoft Learn", domain: "learn.microsoft.com", color: "#00a4ef", bg: "#e5f6fd", iconSlug: "microsoft" },
  { id: "comptia", label: "CompTIA", domain: "comptia.org", color: "#c8102e", bg: "#fde8ec" },
  { id: "oracle", label: "Oracle", domain: "education.oracle.com", color: "#f80000", bg: "#ffe8e8", iconSlug: "oracle" },
  { id: "pmi", label: "PMI", domain: "pmi.org", color: "#1a5632", bg: "#e8f2ec" },
];

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolvePlatformBrand(nameOrPlatform: string, url?: string): PlatformBrand {
  const hay = normalizeKey(`${nameOrPlatform} ${url || ""}`);
  for (const brand of BRANDS) {
    if (hay.includes(brand.id) || hay.includes(normalizeKey(brand.label))) {
      return brand;
    }
  }

  try {
    if (url) {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return {
        id: host,
        label: nameOrPlatform || host,
        domain: host,
        color: "#4459a8",
        bg: "#e8ecff",
      };
    }
  } catch {
    // ignore invalid url
  }

  return {
    id: "generic",
    label: nameOrPlatform || "Curso",
    domain: "google.com",
    color: "#4459a8",
    bg: "#e8ecff",
  };
}

export function brandLogoUrl(brand: PlatformBrand, size = 128) {
  if (brand.iconSlug) {
    return `https://cdn.simpleicons.org/${brand.iconSlug}/${brand.color.replace("#", "")}`;
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(brand.domain)}&sz=${size}`;
}

export function brandInitials(brand: PlatformBrand) {
  const words = brand.label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (brand.id === "senai") return "SN";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

export function buildCertSearchUrl(nome: string, empresa: string) {
  const q = [nome, empresa, "certificação"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

/** URLs de busca da plataforma: sempre abrem pagina valida (IA inventa link e quebra). */
export function buildCertOpenUrl(nome: string, empresa: string, _url?: string) {
  const brand = resolvePlatformBrand(empresa);
  const query = [nome, empresa].filter(Boolean).join(" ").trim();
  const encoded = encodeURIComponent(query);
  const nameOnly = encodeURIComponent(nome.trim() || query);

  switch (brand.id) {
    case "coursera":
      return `https://www.coursera.org/search?query=${nameOnly}`;
    case "udemy":
      return `https://www.udemy.com/courses/search/?q=${nameOnly}`;
    case "alura":
      return `https://www.alura.com.br/busca?query=${nameOnly}`;
    case "linkedin":
      return `https://www.linkedin.com/learning/search?keywords=${encoded}`;
    case "microsoft":
    case "azure":
      return `https://learn.microsoft.com/search/?terms=${encoded}`;
    case "aws":
    case "amazon":
      return `https://aws.amazon.com/search/?searchQuery=${encoded}`;
    case "google":
      return `https://grow.google/certificates/`;
    case "edx":
      return `https://www.edx.org/search?q=${nameOnly}`;
    case "ibm":
      return `https://www.coursera.org/search?query=${encodeURIComponent(`${nome} IBM`)}`;
    case "meta":
      return `https://www.coursera.org/search?query=${encodeURIComponent(`${nome} Meta`)}`;
    case "cisco":
      return `https://skillsforall.com/search?query=${nameOnly}`;
    case "senai":
      return `https://www.google.com/search?q=${encodeURIComponent(`SENAI ${nome} curso OR certificação`)}`;
    case "sebrae":
      return `https://www.google.com/search?q=${encodeURIComponent(`Sebrae ${nome}`)}`;
    case "fgv":
      return `https://www.google.com/search?q=${encodeURIComponent(`FGV ${nome} curso`)}`;
    case "rocketseat":
      return `https://www.rocketseat.com.br/`;
    case "freecodecamp":
      return `https://www.freecodecamp.org/news/search/?query=${nameOnly}`;
    case "udacity":
      return `https://www.udacity.com/courses/all?search=${nameOnly}`;
    case "oracle":
      return `https://education.oracle.com/search?q=${nameOnly}`;
    case "comptia":
      return `https://www.comptia.org/search#q=${nameOnly}`;
    case "pmi":
      return `https://www.pmi.org/search#q=${encoded}`;
    default:
      return buildCertSearchUrl(nome, empresa);
  }
}
