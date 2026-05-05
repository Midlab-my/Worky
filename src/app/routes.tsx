import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Career } from "./components/Career";
import { Dashboard } from "./components/Dashboard";
import { JobSearch } from "./components/JobSearch";
import { JobResults } from "./components/JobResults";
import { JobDetail } from "./components/JobDetail";
import { SkillsAnalysis } from "./components/SkillsAnalysis";
import { MarketTrends } from "./components/MarketTrends";
import { ReportJob } from "./components/ReportJob";
import { AuthPage } from "./components/AuthPage";
import { Profile } from "./components/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
      { path: "dashboard", Component: Dashboard },
      { path: "search", Component: JobSearch },
      { path: "results", Component: JobResults },
      { path: "job/:id", Component: JobDetail },
      { path: "skills", Component: SkillsAnalysis },
      { path: "trends", Component: MarketTrends },
      { path: "report/:id", Component: ReportJob },
    ],
  },
]);
