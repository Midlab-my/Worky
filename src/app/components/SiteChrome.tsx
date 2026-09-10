import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getUserAvatarUrl, getUserInitials } from "../services/auth";
import { fetchCompanyProfile } from "../services/company";

const HEADER_HIDE_THRESHOLD = 80;

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const currentY = window.scrollY;
      if (currentY <= HEADER_HIDE_THRESHOLD) {
        setHidden(false);
      } else if (currentY > lastY) {
        setHidden(true);
      } else if (currentY < lastY) {
        setHidden(false);
      }
      lastY = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

type SiteHeaderProps = {
  activeItem?: "explorar" | "planos" | "empresas" | "institucional";
  actions?: ReactNode;
  badge?: string;
  hideCompanyLink?: boolean;
  navContent?: ReactNode;
  onAboutClick?: () => void;
  onInstitucionalClick?: () => void;
  onBrandClick?: () => void;
  onExploreClick?: () => void;
  onPlanosClick?: () => void;
  onEmpresasClick?: () => void;
  profileAriaLabel?: string;
  profileLabel?: string;
  profilePath?: string;
  showNav?: boolean;
  showProfileAction?: boolean;
};

export function SiteHeader({
  activeItem,
  actions,
  badge,
  hideCompanyLink = false,
  navContent,
  onAboutClick,
  onInstitucionalClick,
  onBrandClick,
  onExploreClick,
  onPlanosClick,
  onEmpresasClick,
  profileAriaLabel,
  profileLabel,
  profilePath,
  showNav = true,
  showProfileAction = true,
}: SiteHeaderProps) {
  const navigate = useNavigate();
  const { profileAvatarUrl, user, session, isAuthenticated } = useAuth();
  const [hasCompanySession, setHasCompanySession] = useState(false);
  const headerHidden = useHideOnScroll();

  useEffect(() => {
    let cancelled = false;

    const syncCompany = async () => {
      if (!isAuthenticated || !session?.accessToken || !user?.id) {
        if (!cancelled) {
          setHasCompanySession(false);
        }
        return;
      }

      try {
        const profile = await fetchCompanyProfile(session.accessToken, user.id);
        if (!cancelled) {
          setHasCompanySession(Boolean(profile));
        }
      } catch {
        if (!cancelled) {
          setHasCompanySession(false);
        }
      }
    };

    void syncCompany();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session?.accessToken, user?.id]);

  const handleBrandClick = onBrandClick || (() => navigate("/"));
  const handleExploreClick = onExploreClick || (() => navigate("/"));
  const handlePlanosClick = onPlanosClick || (() => navigate("/planos"));
  const handleEmpresasClick = onEmpresasClick || (() => navigate("/empresas"));
  const handleInstitucionalClick =
    onInstitucionalClick || onAboutClick || (() => navigate("/institucional"));
  const nextProfilePath =
    profilePath || (user ? (hasCompanySession ? "/empresa" : "/perfil") : "/auth");
  const resolvedProfileAvatarUrl = profileAvatarUrl || getUserAvatarUrl(user) || "";
  const nextProfileLabel = profileLabel || (user ? getUserInitials(user) : "Login");
  const nextProfileAriaLabel =
    profileAriaLabel ||
    (user
      ? hasCompanySession
        ? `Abrir painel da empresa ${user.name}`
        : `Abrir perfil de ${user.name}`
      : "Entrar");

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
    <header className={`ws-header${headerHidden ? " ws-header--hidden" : ""}`}>
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
                className={`ws-nav-link${activeItem === "planos" ? " active" : ""}`}
                onClick={handlePlanosClick}
              >
                Planos
              </button>
              <button
                type="button"
                className={`ws-nav-link${activeItem === "empresas" ? " active" : ""}`}
                onClick={handleEmpresasClick}
              >
                Empresas
              </button>
              <button
                type="button"
                className={`ws-nav-link${activeItem === "institucional" ? " active" : ""}`}
                onClick={handleInstitucionalClick}
              >
                Institucional
              </button>
            </>
          )}
        </nav>
      )}

      <div className="ws-actions">
        {hasCompanySession && !hideCompanyLink && (
          <button type="button" className="ws-btn-secondary" onClick={() => navigate("/empresa")}>
            Painel Empresa
          </button>
        )}
        {actions ?? defaultActions}
      </div>
    </header>
  );
}

type SiteFooterProps = {
  copy?: string;
  links?: Array<string | { label: string; path?: string }>;
};

const defaultFooterLinks = [
  { label: "Sobre", path: "/institucional/sobre" },
  { label: "Privacidade", path: "/institucional/politicas" },
  { label: "Termos", path: "/institucional/termos" },
  { label: "Contato", path: "/institucional/contato" },
  { label: "Suporte", path: "/institucional/suporte" },
];

const footerPathByLabel: Record<string, string> = {
  Sobre: "/institucional/sobre",
  Privacidade: "/institucional/politicas",
  Termos: "/institucional/termos",
  Contato: "/institucional/contato",
  Suporte: "/institucional/suporte",
};

export function SiteFooter({
  copy = "2026 Worky. Dados de mercado de trabalho.",
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
