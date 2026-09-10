import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Building2,
  FileText,
  LifeBuoy,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SponsorMarquee } from "../../components/AdSlot";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";

export type InstitutionalNavId = "sobre" | "politicas" | "termos" | "contato" | "suporte";

export type InstitutionalNavItem = {
  id: InstitutionalNavId;
  label: string;
  path: string;
  description: string;
  icon: LucideIcon;
};

export const INSTITUTIONAL_NAV: InstitutionalNavItem[] = [
  {
    id: "sobre",
    label: "Sobre",
    path: "/institucional/sobre",
    description: "Missão, produto e equipe",
    icon: Building2,
  },
  {
    id: "politicas",
    label: "Políticas",
    path: "/institucional/politicas",
    description: "Privacidade e LGPD",
    icon: ShieldCheck,
  },
  {
    id: "termos",
    label: "Termos",
    path: "/institucional/termos",
    description: "Regras de uso",
    icon: FileText,
  },
  {
    id: "contato",
    label: "Contato",
    path: "/institucional/contato",
    description: "Fale com a Worky",
    icon: Mail,
  },
  {
    id: "suporte",
    label: "Suporte",
    path: "/institucional/suporte",
    description: "Ajuda e chamados",
    icon: LifeBuoy,
  },
];

function activeNavItem(pathname: string): InstitutionalNavItem {
  return INSTITUTIONAL_NAV.find((item) => pathname.startsWith(item.path)) || INSTITUTIONAL_NAV[0];
}

export function InstitutionalLayout() {
  const location = useLocation();
  const current = activeNavItem(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="wi-root">
      <style>{layoutCss}</style>
      <SponsorMarquee />
      <SiteHeader activeItem="institucional" />

      <section className="wi-hero">
        <div className="wi-hero-inner">
          <span className="wi-kicker">Institucional</span>
          <h1>{current.label}</h1>
          <p>{current.description}</p>
        </div>
      </section>

      <div className="wi-shell">
        <aside className="wi-sidebar" aria-label="Menu institucional">
          <div className="wi-sidebar-title">Navegação</div>
          <nav className="wi-side-nav">
            {INSTITUTIONAL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `wi-side-link${isActive ? " active" : ""}`}
                >
                  <span className="wi-side-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="wi-side-copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="wi-main">
          <Outlet />
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

const layoutCss = `
  .wi-root {
    min-height: 100vh;
    background: #f4f7fb;
    color: #0f172a;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .wi-hero {
    background:
      radial-gradient(ellipse 70% 80% at 8% 0%, rgba(37, 99, 235, 0.16), transparent 55%),
      linear-gradient(180deg, #0f172a 0%, #13233f 100%);
    color: #fff;
    border-bottom: 1px solid #1e293b;
  }

  .wi-hero-inner {
    width: min(1120px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 2.4rem 0 2.1rem;
  }

  .wi-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.28rem 0.75rem;
    border-radius: 999px;
    background: rgba(147, 197, 253, 0.16);
    border: 1px solid rgba(147, 197, 253, 0.35);
    color: #bfdbfe;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.85rem;
  }

  .wi-hero h1 {
    margin: 0 0 0.45rem;
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.7rem, 3.5vw, 2.35rem);
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .wi-hero p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.98rem;
    line-height: 1.55;
    max-width: 520px;
  }

  .wi-shell {
    width: min(1120px, calc(100% - 2rem));
    margin: -1.35rem auto 0;
    padding-bottom: 3rem;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 1.25rem;
    align-items: start;
    flex: 1;
  }

  .wi-sidebar {
    position: sticky;
    top: 76px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 1rem;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  }

  .wi-sidebar-title {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    margin: 0 0 0.7rem 0.35rem;
  }

  .wi-side-nav {
    display: grid;
    gap: 0.35rem;
  }

  .wi-side-link {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.7rem 0.65rem;
    border-radius: 12px;
    text-decoration: none;
    color: #475569;
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }

  .wi-side-link:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  .wi-side-link.active {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .wi-side-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #64748b;
    flex: 0 0 auto;
  }

  .wi-side-link.active .wi-side-icon {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .wi-side-copy {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .wi-side-copy strong {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .wi-side-copy small {
    font-size: 0.72rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .wi-side-link.active .wi-side-copy small {
    color: #60a5fa;
  }

  .wi-main {
    min-width: 0;
  }

  @media (max-width: 900px) {
    .wi-shell {
      grid-template-columns: 1fr;
      margin-top: -1rem;
    }

    .wi-sidebar {
      position: static;
      padding: 0.85rem;
    }

    .wi-side-nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.45rem;
    }

    .wi-side-copy small {
      display: none;
    }
  }

  @media (max-width: 560px) {
    .wi-side-nav {
      grid-template-columns: 1fr;
    }
  }
`;
