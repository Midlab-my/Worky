import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Career } from "./components/Career";
import { Dashboard } from "./components/Dashboard";
import { AuthPage } from "./components/AuthPage";
import { Profile } from "./components/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPanel } from "./components/AdminPanel";

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
