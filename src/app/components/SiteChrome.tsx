import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getUserAvatarUrl, getUserInitials } from "../services/auth";

type SiteHeaderProps = {
  activeItem?: "explorar" | "sobre";
  actions?: ReactNode;
  badge?: string;
  navContent?: ReactNode;
  onAboutClick?: () => void;
  onBrandClick?: () => void;
  onExploreClick?: () => void;
  profileAriaLabel?: string;
  profileLabel?: string;
  profilePath?: string;
  showNav?: boolean;
  showProfileAction?: boolean;
};

export function SiteHeader({
  activeItem = "explorar",
  actions,
  badge,
  navContent,
  onBrandClick,
  onExploreClick,
  profileAriaLabel,
  profileLabel,
  profilePath,
  showNav = true,
  showProfileAction = true,
}: SiteHeaderProps) {
  const navigate = useNavigate();
  const { profileAvatarUrl, user } = useAuth();

  const handleBrandClick = onBrandClick || (() => navigate("/"));
  const handleExploreClick = onExploreClick || (() => navigate("/"));
  const handleAboutClick = () => {
    window.location.assign("https://myworky.lovable.app/");
  };
  const nextProfilePath = profilePath || (user ? "/perfil" : "/auth");
  const resolvedProfileAvatarUrl = profileAvatarUrl || getUserAvatarUrl(user) || "";
  const nextProfileLabel = profileLabel || (user ? getUserInitials(user) : "Login");
  const nextProfileAriaLabel = profileAriaLabel || (user ? `Abrir perfil de ${user.name}` : "Entrar");

  const defaultActions = showProfileAction ? (
    <button
      type="button"
      className={`ws-btn-primary${user ? " ws-profile-avatar" : ""}`}
      onClick={() => navigate(nextProfilePath)}
      aria-label={nextProfileAriaLabel}
      title={nextProfileAriaLabel}
    >
      {user && !profileLabel && resolvedProfileAvatarUrl ? (
        <img className="ws-profile-avatar-image" src={resolvedProfileAvatarUrl} alt="" aria-hidden="true" />
      ) : (
        nextProfileLabel
      )}
    </button>
  ) : null;

  return (
    <header className="ws-header">
      <div className="ws-brand-group">
        <button type="button" className="ws-brand" onClick={handleBrandClick}>
          Worky
        </button>
        {badge && <span className="ws-badge">{badge}</span>}
      </div>

      {showNav && (
        <nav className="ws-nav" aria-label="Navegacao principal">
          {navContent || (
            <>
              <button
                type="button"
                className={`ws-nav-link${activeItem === "explorar" ? " active" : ""}`}
                onClick={handleExploreClick}
              >
                Explorar
              </button>
              <button
                type="button"
                className={`ws-nav-link${activeItem === "sobre" ? " active" : ""}`}
                onClick={handleAboutClick}
              >
                Sobre
              </button>
            </>
          )}
        </nav>
      )}

      <div className="ws-actions">{actions ?? defaultActions}</div>
    </header>
  );
}

type SiteFooterProps = {
  copy?: string;
  links?: Array<string | { label: string; path?: string }>;
};

const defaultFooterLinks = [
  { label: "Privacidade", path: "/privacidade" },
  { label: "Termos", path: "/termos" },
  { label: "Contato", path: "/contato" },
  { label: "Suporte", path: "/suporte" },
];

const footerPathByLabel: Record<string, string> = {
  Privacidade: "/privacidade",
  Termos: "/termos",
  Contato: "/contato",
  Suporte: "/suporte",
};

export function SiteFooter({
  copy = "2026 Worky. Inteligencia de Mercado.",
  links = defaultFooterLinks,
}: SiteFooterProps) {
  const navigate = useNavigate();

  return (
    <footer className="ws-footer">
      <div>
        <div className="ws-footer-logo">Worky</div>
        <div className="ws-footer-copy">{copy}</div>
      </div>
      <div className="ws-footer-links">
        {links.map((link) => {
          const label = typeof link === "string" ? link : link.label;
          const path = typeof link === "string" ? footerPathByLabel[link] : link.path;

          return (
            <button
              type="button"
              key={label}
              className="ws-footer-link"
              onClick={() => {
                if (path) {
                  navigate(path);
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
