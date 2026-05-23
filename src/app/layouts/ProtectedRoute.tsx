import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
        <div className="bg-white border border-neutral-200 rounded-2xl px-8 py-10 text-center shadow-sm max-w-md w-full">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              border: "3px solid #dbeafe",
              borderTopColor: "#2563eb",
              margin: "0 auto 1rem",
              animation: "worky-spin 1s linear infinite",
            }}
          />
          <p className="text-neutral-700 font-medium">Verificando seu perfil...</p>
          <style>{`@keyframes worky-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
}
