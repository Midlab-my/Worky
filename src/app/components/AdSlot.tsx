const DEFAULT_SPONSORS = [
  "Curso Full Stack",
  "Bootcamp Data",
  "Certificação Cloud",
  "Mentoria de Carreira",
  "Plataforma de Vagas",
  "English for Tech",
] as const;

type AdPlacement = "aside" | "banner" | "leaderboard" | "inline";

type AdSlotProps = {
  placement?: AdPlacement;
  label?: string;
  title?: string;
  hint?: string;
  className?: string;
};

export function AdSlot({
  placement = "banner",
  label = "Patrocinado",
  title = "Propaganda aqui",
  hint = "Espaço reservado para parceiros da Worky",
  className = "",
}: AdSlotProps) {
  const Tag = placement === "aside" || placement === "banner" ? "aside" : "div";

  return (
    <Tag
      className={`ws-ad ws-ad--${placement}${className ? ` ${className}` : ""}`}
      aria-label={label}
      data-ad-placement={placement}
    >
      <div className="ws-ad-body">
        <span className="ws-ad-title">{title}</span>
        <span className="ws-ad-hint">{hint}</span>
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
  const loop = [...items, ...items];

  return (
    <aside
      className={`ws-sponsor-marquee${className ? ` ${className}` : ""}`}
      aria-label="Parceiros e patrocinios"
    >
      <div className="ws-sponsor-marquee-track-wrap">
        <div className="ws-sponsor-marquee-track">
          {loop.map((item, index) => (
            <div className="ws-sponsor-chip" key={`${item}-${index}`} aria-hidden={index >= items.length}>
              <span className="ws-sponsor-chip-mark">Ad</span>
              <span className="ws-sponsor-chip-text">{item}</span>
              <span className="ws-sponsor-chip-cta">Propaganda aqui</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
