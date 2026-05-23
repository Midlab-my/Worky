import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Career } from "./pages/Career";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./layouts/ProtectedRoute";
import { AdminPanel } from "./pages/AdminPanel";

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
    ],
  },
]);
