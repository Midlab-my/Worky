import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Career } from "./pages/Career";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { AdminPanel } from "./pages/AdminPanel";
import { ContactPage, PrivacyPage, SupportPage, TermsPage } from "./pages/LegalPages";

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
      { path: "privacidade", Component: PrivacyPage },
      { path: "termos", Component: TermsPage },
      { path: "contato", Component: ContactPage },
      { path: "suporte", Component: SupportPage },
    ],
  },
]);
