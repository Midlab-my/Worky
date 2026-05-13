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
    document.title = "Worky";
  }, [location.pathname, location.search]);

  return <Outlet />;
}
