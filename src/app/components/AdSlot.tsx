const DEFAULT_SPONSORS = [
  "Mentoria de Carreira",
  "Curso Full Stack",
  "Certificação Cloud",
] as const;

type AdPlacement = "aside" | "banner" | "leaderboard" | "inline";

type AdSlotProps = {
  placement?: AdPlacement;
  label?: string;
  title?: string;
  hint?: string;
  className?: string;
};

function AdIllustration() {
  return (
    <svg className="ws-ad-art" viewBox="0 0 160 112" fill="none" aria-hidden="true">
      <rect width="160" height="112" rx="10" fill="#dce6f4" />
      <circle cx="128" cy="22" r="28" fill="#c5d4ea" />
      <circle cx="18" cy="96" r="22" fill="#cfd9e8" />
      <rect x="18" y="28" width="78" height="10" rx="5" fill="#9aafcc" />
      <rect x="18" y="46" width="54" height="8" rx="4" fill="#b7c7dc" />
      <rect x="22" y="68" width="14" height="28" rx="3" fill="#7f9ac0" />
      <rect x="42" y="56" width="14" height="40" rx="3" fill="#5b7eae" />
      <rect x="62" y="44" width="14" height="52" rx="3" fill="#2563eb" />
      <circle cx="118" cy="64" r="18" fill="#eef3f9" />
      <circle cx="118" cy="58" r="7" fill="#8aa0bd" />
      <path d="M104 88c2.5-10 9-16 14-16s11.5 6 14 16" stroke="#8aa0bd" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function AdSlot({
  placement = "banner",
  label = "Patrocinado",
  className = "",
}: AdSlotProps) {
  const Tag = placement === "aside" || placement === "banner" ? "aside" : "div";

  return (
    <Tag
      className={`ws-ad ws-ad--${placement}${className ? ` ${className}` : ""}`}
      aria-label={label}
      data-ad-placement={placement}
    >
      <div className="ws-ad-inner">
        <AdIllustration />
        <div className="ws-ad-copy">
          <span className="ws-ad-kicker">Patrocinado</span>
          <span className="ws-ad-title">Seu próximo passo profissional</span>
          <span className="ws-ad-hint">Cursos, certificações e ferramentas para quem está de olho no mercado.</span>
        </div>
      </div>
    </Tag>
  );
}

type SponsorMarqueeProps = {
  items?: readonly string[];
  className?: string;
};

export function SponsorMarquee({
  items = DEFAULT_SPONSORS,
  className = "",
}: SponsorMarqueeProps) {
  const segment = Array.from({ length: 8 }, () => [...items]).flat();
  const loop = [...segment, ...segment];

  return (
    <aside
      className={`ws-sponsor-marquee${className ? ` ${className}` : ""}`}
      aria-label="Parceiros e patrocinios"
    >
      <div className="ws-sponsor-marquee-track-wrap">
        <div className="ws-sponsor-marquee-track">
          {loop.map((item, index) => (
            <div
              className="ws-sponsor-chip"
              key={`${item}-${index}`}
              aria-hidden={index >= segment.length}
            >
              <span className="ws-sponsor-chip-mark">Ad</span>
              <span className="ws-sponsor-chip-text">{item}</span>
              <span className="ws-sponsor-chip-cta">Patrocinado</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
