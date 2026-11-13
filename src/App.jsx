import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthPage from "./components/AuthPage.jsx";
import HomePage from "./components/HomePage.jsx";

const EditorPage = lazy(() => import("./components/EditorPage.jsx"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Chargement de votre session…</div>;
  }
  return user ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <Suspense fallback={<div className="page-loading">Chargement de l’éditeur…</div>}>
              <EditorPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
