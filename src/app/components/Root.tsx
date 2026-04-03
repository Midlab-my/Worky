import { Outlet, useLocation, Link } from "react-router";

export function Root() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {!isLoginPage && (
        <nav className="bg-white border-b-2 border-neutral-300 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
              <div className="text-xl font-mono border-2 border-neutral-900 px-4 py-2 text-center md:text-left w-full md:w-auto">
                ANÁLISE DE VAGAS
              </div>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full md:w-auto">
                <Link
                  to="/dashboard"
                  className="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Painel
                </Link>
                <Link
                  to="/search"
                  className="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Buscar
                </Link>
                <Link
                  to="/skills"
                  className="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Habilidades
                </Link>
                <Link
                  to="/trends"
                  className="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base border-2 border-neutral-400 hover:bg-neutral-200"
                >
                  Tendências
                </Link>
                <Link
                  to="/"
                  className="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base border-2 border-neutral-900 hover:bg-neutral-200"
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