import { Outlet, useLocation, Link } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserFirstName } from "../services/auth";

export function Root() {
  const location = useLocation();
  const { user } = useAuth();
  const hasOwnNavigation =
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/carreira" ||
    location.pathname === "/auth" ||
    location.pathname === "/perfil";
  const profilePath = user ? "/perfil" : "/auth";
  const profileLabel = user ? getUserFirstName(user) : "Perfil";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cargo = params.get("cargo")?.trim();

    if (location.pathname === "/carreira" && cargo) {
      document.title = `Worky: ${cargo}`;
      return;
    }

    if (location.pathname === "/perfil") {
      document.title = "Worky: Perfil";
      return;
    }

    if (location.pathname === "/auth") {
      document.title = "Worky: Acesso";
      return;
    }

    document.title = "Worky";
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {!hasOwnNavigation && (
        <nav className="bg-white border-b-2 border-neutral-300 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center py-4 md:hidden gap-4">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2 text-center w-full">
                ANALISE DE VAGAS
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 text-sm border-2 border-neutral-400 hover:bg-neutral-200 text-center font-mono"
                >
                  Painel
                </Link>
                <Link
                  to="/search"
                  className="px-3 py-2 text-sm border-2 border-neutral-400 hover:bg-neutral-200 text-center font-mono"
                >
                  Buscar
                </Link>
                <Link
                  to="/skills"
                  className="px-3 py-2 text-sm border-2 border-neutral-400 hover:bg-neutral-200 text-center font-mono"
                >
                  Habilidades
                </Link>
                <Link
                  to="/trends"
                  className="px-3 py-2 text-sm border-2 border-neutral-400 hover:bg-neutral-200 text-center font-mono"
                >
                  Tendencias
                </Link>
                <Link
                  to="/"
                  className="px-3 py-2 text-sm border-2 border-neutral-900 hover:bg-neutral-200 text-center font-mono"
                >
                  Inicio
                </Link>
                <Link
                  to={profilePath}
                  className="px-3 py-2 text-sm border-2 border-blue-600 text-blue-700 hover:bg-blue-50 text-center font-mono"
                >
                  {profileLabel}
                </Link>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-between py-4">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2">
                ANALISE DE VAGAS
              </div>
              <div className="flex gap-4">
                <Link to="/dashboard" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Painel</Link>
                <Link to="/search" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Buscar</Link>
                <Link to="/skills" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Habilidades</Link>
                <Link to="/trends" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Tendencias</Link>
                <Link to={profilePath} className="px-4 py-2 border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-mono">{profileLabel}</Link>
                <Link to="/" className="px-4 py-2 border-2 border-neutral-900 hover:bg-neutral-200 font-mono">Inicio</Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
