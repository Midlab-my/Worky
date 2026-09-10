import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./layouts/Root";
import { Career } from "./pages/Career";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { AdminPanel } from "./pages/AdminPanel";
import { ContactPage, PrivacyPage, SupportPage, TermsPage } from "./pages/LegalPages";
import { PlansPage } from "./pages/PlansPage";
import { ReferralProgramPage } from "./pages/ReferralProgramPage";
import { CompanyPanel } from "./pages/CompanyPanel";
import { CompaniesPage } from "./pages/CompaniesPage";
import { InstitutionalLayout } from "./pages/institutional/InstitutionalLayout";
import { InstitutionalAbout } from "./pages/institutional/InstitutionalAbout";

function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "auth", Component: AuthPage },
      { path: "perfil", Component: ProtectedProfilePage },
      { path: "carreira", Component: Career },
      { path: "admin", Component: AdminPanel },
      {
        path: "institucional",
        Component: InstitutionalLayout,
        children: [
          { index: true, element: <Navigate to="sobre" replace /> },
          { path: "sobre", Component: InstitutionalAbout },
          { path: "politicas", Component: PrivacyPage },
          { path: "termos", Component: TermsPage },
          { path: "contato", Component: ContactPage },
          { path: "suporte", Component: SupportPage },
        ],
      },
      { path: "sobre", element: <Navigate to="/institucional/sobre" replace /> },
      { path: "privacidade", element: <Navigate to="/institucional/politicas" replace /> },
      { path: "termos", element: <Navigate to="/institucional/termos" replace /> },
      { path: "contato", element: <Navigate to="/institucional/contato" replace /> },
      { path: "suporte", element: <Navigate to="/institucional/suporte" replace /> },
      { path: "planos", Component: PlansPage },
      { path: "indicacoes", Component: ReferralProgramPage },
      { path: "empresa", Component: CompanyPanel },
      { path: "empresas", Component: CompaniesPage },
    ],
  },
]);
