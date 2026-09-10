export type PlatformBrand = {
  id: string;
  label: string;
  domain: string;
  color: string;
  bg: string;
};

const BRANDS: PlatformBrand[] = [
  { id: "alura", label: "Alura", domain: "alura.com.br", color: "#0527de", bg: "#e8ecff" },
  { id: "coursera", label: "Coursera", domain: "coursera.org", color: "#0056d2", bg: "#e8f1ff" },
  { id: "udemy", label: "Udemy", domain: "udemy.com", color: "#a435f0", bg: "#f3e8ff" },
  { id: "fgv", label: "FGV", domain: "fgv.br", color: "#003366", bg: "#e8eef5" },
  { id: "google", label: "Google", domain: "grow.google", color: "#4285f4", bg: "#e8f0fe" },
  { id: "microsoft", label: "Microsoft", domain: "microsoft.com", color: "#00a4ef", bg: "#e5f6fd" },
  { id: "aws", label: "AWS", domain: "aws.amazon.com", color: "#ff9900", bg: "#fff4e5" },
  { id: "amazon", label: "AWS", domain: "aws.amazon.com", color: "#ff9900", bg: "#fff4e5" },
  { id: "linkedin", label: "LinkedIn Learning", domain: "linkedin.com", color: "#0a66c2", bg: "#e8f3fb" },
  { id: "edx", label: "edX", domain: "edx.org", color: "#02262b", bg: "#e6eaea" },
  { id: "cisco", label: "Cisco", domain: "cisco.com", color: "#049fd9", bg: "#e6f6fc" },
  { id: "ibm", label: "IBM", domain: "ibm.com", color: "#054ada", bg: "#e8eeff" },
  { id: "meta", label: "Meta", domain: "metacareers.com", color: "#0668e1", bg: "#e8f1fc" },
  { id: "rocketseat", label: "Rocketseat", domain: "rocketseat.com.br", color: "#8257e5", bg: "#f0e9ff" },
  { id: "freecodecamp", label: "freeCodeCamp", domain: "freecodecamp.org", color: "#0a0a23", bg: "#e8e8ef" },
  { id: "deeplearning", label: "DeepLearning.AI", domain: "deeplearning.ai", color: "#1a73e8", bg: "#e8f1fc" },
  { id: "udacity", label: "Udacity", domain: "udacity.com", color: "#02b3e4", bg: "#e6f8fc" },
  { id: "senai", label: "SENAI", domain: "senai.br", color: "#e30613", bg: "#fde8ea" },
  { id: "sebrae", label: "Sebrae", domain: "sebrae.com.br", color: "#005ca9", bg: "#e6f0f8" },
  { id: "worky", label: "Worky", domain: "worky.vercel.app", color: "#0052ff", bg: "#e8efff" },
  { id: "azure", label: "Microsoft Learn", domain: "learn.microsoft.com", color: "#00a4ef", bg: "#e5f6fd" },
  { id: "comptia", label: "CompTIA", domain: "comptia.org", color: "#c8102e", bg: "#fde8ec" },
  { id: "oracle", label: "Oracle", domain: "oracle.com", color: "#f80000", bg: "#ffe8e8" },
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
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(brand.domain)}&sz=${size}`;
}

export function brandInitials(brand: PlatformBrand) {
  const words = brand.label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

export function buildCertSearchUrl(nome: string, empresa: string) {
  const q = [nome, empresa, "certificação"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
