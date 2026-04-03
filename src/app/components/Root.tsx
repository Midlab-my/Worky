import { Outlet, useLocation, Link } from "react-router";

export function Root() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {!isLoginPage && (
        <nav className="bg-white border-b-2 border-neutral-300 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* MOBILE VIEW - Apenas Responsividade */}
            <div className="flex flex-col items-center py-4 md:hidden gap-4">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2 text-center w-full">
                ANÁLISE DE VAGAS
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
                  Tendências
                </Link>
                <Link
                  to="/"
                  className="col-span-2 px-3 py-2 text-sm border-2 border-neutral-900 hover:bg-neutral-200 text-center font-mono"
                >
                  Sair
                </Link>
              </div>
            </div>

            {/* DESKTOP VIEW - Estilo Original */}
            <div className="hidden md:flex items-center justify-between py-4">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2">
                ANÁLISE DE VAGAS
              </div>
              <div className="flex gap-4">
                <Link to="/dashboard" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Painel</Link>
                <Link to="/search" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Buscar</Link>
                <Link to="/skills" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Habilidades</Link>
                <Link to="/trends" className="px-4 py-2 border-2 border-neutral-400 hover:bg-neutral-200 font-mono">Tendências</Link>
                <Link to="/" className="px-4 py-2 border-2 border-neutral-900 hover:bg-neutral-200 font-mono">Sair</Link>
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