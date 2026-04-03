import { Outlet, useLocation, Link } from "react-router";

export function Root() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-neutral-100">
      {!isLoginPage && (
        <nav className="bg-white border-b-2 border-neutral-300">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2">
                ANÁLISE DE VAGAS
              </div>
              <div className="flex gap-4">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Painel
                </Link>
                <Link
                  to="/search"
                  className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Buscar
                </Link>
                <Link
                  to="/skills"
                  className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Habilidades
                </Link>
                <Link
                  to="/trends"
                  className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Tendências
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2 border-2 border-neutral-900 hover:bg-neutral-200"
                >
                  Sair
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}
      <Outlet />
    </div>
  );
}