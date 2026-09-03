import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Career } from "./pages/Career";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { AdminPanel } from "./pages/AdminPanel";
import { ContactPage, PrivacyPage, SupportPage, TermsPage } from "./pages/LegalPages";
import { About } from "./pages/About";
import { PlansPage } from "./pages/PlansPage";
import { ReferralProgramPage } from "./pages/ReferralProgramPage";
import { CompanyPanel } from "./pages/CompanyPanel";
import { InstitutionalPage } from "./pages/InstitutionalPage";

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
      { path: "sobre", Component: About },
      { path: "planos", Component: PlansPage },
      { path: "indicacoes", Component: ReferralProgramPage },
      { path: "empresa", Component: CompanyPanel },
      { path: "institucional", Component: InstitutionalPage },
      { path: "privacidade", Component: PrivacyPage },
      { path: "termos", Component: TermsPage },
      { path: "contato", Component: ContactPage },
      { path: "suporte", Component: SupportPage },
    ],
  },
]);
