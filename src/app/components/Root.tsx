import { Outlet, useLocation, Link } from "react-router";

export function Root() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {!isLoginPage && (
        <nav className="bg-white border-b-2 border-neutral-300 w-full mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* MOBILE VIEW (2 col grid) */}
            <div className="flex flex-col items-center py-4 md:hidden gap-6">
              <div className="text-xl font-mono border-4 border-neutral-900 px-6 py-2 text-center w-full">
                WORKY
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Link
                  to="/dashboard"
                  className="px-3 py-3 text-sm border-2 border-neutral-400 hover:bg-neutral-100 text-center font-mono active:bg-neutral-200"
                >
                  PAINEL
                </Link>
                <Link
                  to="/search"
                  className="px-3 py-3 text-sm border-2 border-neutral-400 hover:bg-neutral-100 text-center font-mono active:bg-neutral-200"
                >
                  BUSCAR
                </Link>
                <Link
                  to="/skills"
                  className="px-3 py-3 text-sm border-2 border-neutral-400 hover:bg-neutral-100 text-center font-mono active:bg-neutral-200"
                >
                  SKILLS
                </Link>
                <Link
                  to="/trends"
                  className="px-3 py-3 text-sm border-2 border-neutral-400 hover:bg-neutral-100 text-center font-mono active:bg-neutral-200"
                >
                  TRACKS
                </Link>
                <Link
                  to="/"
                  className="col-span-2 px-3 py-3 text-sm border-2 border-neutral-900 bg-neutral-900 text-white text-center font-mono hover:bg-neutral-800"
                >
                  [ SAIR ]
                </Link>
              </div>
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:flex items-center justify-between py-6">
              <div className="text-2xl font-mono border-4 border-neutral-900 px-6 py-2">
                WORKY
              </div>
              <div className="flex gap-4">
                <Link to="/dashboard" className="px-6 py-2 border-2 border-neutral-400 hover:border-neutral-900 font-mono transition-colors">Painel</Link>
                <Link to="/search" className="px-6 py-2 border-2 border-neutral-400 hover:border-neutral-900 font-mono transition-colors">Buscar</Link>
                <Link to="/skills" className="px-6 py-2 border-2 border-neutral-400 hover:border-neutral-900 font-mono transition-colors">Habilidades</Link>
                <Link to="/trends" className="px-6 py-2 border-2 border-neutral-400 hover:border-neutral-900 font-mono transition-colors">Tendências</Link>
                <Link to="/" className="px-6 py-2 border-2 border-neutral-900 hover:bg-neutral-900 hover:text-white font-mono transition-colors">Sair</Link>
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