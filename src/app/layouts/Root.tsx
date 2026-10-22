import { Navigate, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CookieBanner } from "../components/CookieBanner";
import { SessionTimeoutManager } from "../components/SessionTimeoutManager";

function AuthenticatedOutlet() {
  const { session, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div role="status" className="min-h-screen flex items-center justify-center">Verificando sessao...</div>;
  if (session && !isAuthenticated && location.pathname !== '/auth') {
    return <Navigate to={'/auth?next=' + encodeURIComponent(location.pathname + location.search)} replace />;
  }
  return <Outlet />;
}

export function Root() {
  const location = useLocation();

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
    if (location.pathname === "/privacidade" || location.pathname === "/institucional/politicas") {
      document.title = "Worky: Políticas";
      return;
    }
    if (location.pathname === "/termos" || location.pathname === "/institucional/termos") {
      document.title = "Worky: Termos";
      return;
    }
    if (location.pathname === "/contato" || location.pathname === "/institucional/contato") {
      document.title = "Worky: Contato";
      return;
    }
    if (location.pathname === "/suporte" || location.pathname === "/institucional/suporte") {
      document.title = "Worky: Suporte";
      return;
    }
    if (location.pathname === "/empresas") {
      document.title = "Worky: Empresas";
      return;
    }
    if (location.pathname.startsWith("/institucional")) {
      document.title = "Worky: Institucional";
      return;
    }
    document.title = "Worky";
  }, [location.pathname, location.search]);

  return (
    <AuthProvider>
      <AuthenticatedOutlet />
      <CookieBanner />
      <SessionTimeoutManager />
    </AuthProvider>
  );
}
