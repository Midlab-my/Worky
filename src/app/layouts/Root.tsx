import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";

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
    if (location.pathname === "/admin") {
      document.title = "Worky: Admin";
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

  return <Outlet />;
}
