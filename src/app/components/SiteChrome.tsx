import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getUserInitials } from "../services/auth";

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
  onAboutClick,
  onBrandClick,
  onExploreClick,
  profileAriaLabel,
  profileLabel,
  profilePath,
  showNav = true,
  showProfileAction = true,
}: SiteHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBrandClick = onBrandClick || (() => navigate("/"));
  const handleExploreClick = onExploreClick || (() => navigate("/"));
  const handleAboutClick = () => {
    window.open("https://myworky.lovable.app/", "_blank", "noopener,noreferrer");
  };
  const nextProfilePath = profilePath || (user ? "/perfil" : "/auth");
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
      {nextProfileLabel}
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
  links?: string[];
};

export function SiteFooter({
  copy = "2026 Worky. Inteligencia de Mercado.",
  links = ["Privacidade", "Termos", "Contato", "Suporte"],
}: SiteFooterProps) {
  return (
    <footer className="ws-footer">
      <div>
        <div className="ws-footer-logo">Worky</div>
        <div className="ws-footer-copy">{copy}</div>
      </div>
      <div className="ws-footer-links">
        {links.map((label) => (
          <button type="button" key={label} className="ws-footer-link">
            {label}
          </button>
        ))}
      </div>
    </footer>
  );
}
