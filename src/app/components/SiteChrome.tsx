import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getStoredSession, getUserAvatarUrl, getUserInitials } from "../services/auth";

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
  activeItem?: "explorar" | "planos" | "empresas";
  actions?: ReactNode;
  badge?: string;
  /** Forca menu de conta empresa mesmo antes do sync. */
  companyNav?: boolean;
  hideCompanyLink?: boolean;
  navContent?: ReactNode;
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
  companyNav = false,
  hideCompanyLink = false,
  navContent,
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
  const { profileAvatarUrl, user, loading: authLoading, isCompanyAccount } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerHidden = useHideOnScroll() && !menuOpen;

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 840) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  // Conta empresa vem do Auth (metadata). Enquanto a sessao hidrata, nao mostra
  // links de candidato pra nao piscar Explorar/Empresas.
  const authPending = authLoading && Boolean(getStoredSession());
  const isCompanyNav = companyNav || isCompanyAccount;
  const showCandidatoLinks = !isCompanyNav && !authPending;
  const closeMenu = () => setMenuOpen(false);
  const handleBrandClick = onBrandClick || (() => navigate(isCompanyNav ? "/empresa" : "/"));
  const handleExploreClick = onExploreClick || (() => navigate("/"));
  const handlePlanosClick = onPlanosClick || (() => navigate("/planos"));
  const handleEmpresasClick = onEmpresasClick || (() => navigate("/empresas"));
  const nextProfilePath =
    profilePath || (user ? (isCompanyNav ? "/empresa" : "/perfil") : "/auth");
  const resolvedProfileAvatarUrl = profileAvatarUrl || getUserAvatarUrl(user) || "";
  const nextProfileLabel = profileLabel || (user ? getUserInitials(user) : "Login");
  const nextProfileAriaLabel =
    profileAriaLabel ||
    (user
      ? isCompanyNav
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

  const hasPanel =
    showNav || Boolean(actions ?? defaultActions) || (isCompanyAccount && !hideCompanyLink);

  return (
    <header
      ref={headerRef}
      className={`ws-header${headerHidden ? " ws-header--hidden" : ""}${menuOpen ? " ws-header--menu-open" : ""}`}
    >
      <div className="ws-brand-group">
        <button
          type="button"
          className="ws-brand"
          onClick={() => {
            closeMenu();
            handleBrandClick();
          }}
        >
          Worky
        </button>
        {badge && <span className="ws-badge">{badge}</span>}
      </div>

      {hasPanel && (
        <button
          type="button"
          className="ws-menu-toggle"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="ws-header-panel"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="ws-menu-toggle-bar" />
          <span className="ws-menu-toggle-bar" />
          <span className="ws-menu-toggle-bar" />
        </button>
      )}

      <div
        id="ws-header-panel"
        className="ws-header-panel"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button, a")) closeMenu();
        }}
      >
        {showNav && (
          <nav className="ws-nav" aria-label="Navegacao principal">
            {navContent || (
              <>
                {showCandidatoLinks && (
                  <button
                    type="button"
                    className={`ws-nav-link${activeItem === "explorar" ? " active" : ""}`}
                    onClick={handleExploreClick}
                  >
                    Explorar
                  </button>
                )}
                <button
                  type="button"
                  className={`ws-nav-link${activeItem === "planos" ? " active" : ""}`}
                  onClick={handlePlanosClick}
                >
                  Planos
                </button>
                {showCandidatoLinks && (
                  <button
                    type="button"
                    className={`ws-nav-link${activeItem === "empresas" ? " active" : ""}`}
                    onClick={handleEmpresasClick}
                  >
                    Empresas
                  </button>
                )}
              </>
            )}
          </nav>
        )}

        <div className="ws-actions">
          {isCompanyAccount && !hideCompanyLink && (
            <button type="button" className="ws-btn-secondary" onClick={() => navigate("/empresa")}>
              Painel Empresa
            </button>
          )}
          {actions ?? defaultActions}
        </div>
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
  copy,
  links = defaultFooterLinks,
}: SiteFooterProps) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="ws-footer">
      <div>
        <div className="ws-footer-logo">Worky</div>
        <div className="ws-footer-copy">© {year} Worky. Todos os direitos reservados.</div>
        {copy ? <div className="ws-footer-tagline">{copy}</div> : null}
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
