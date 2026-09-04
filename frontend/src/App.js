import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import FeatureDetail from "./pages/FeatureDetails";
import FeatureEdit from "./pages/FeatureEdit";
import ImportPage from "./pages/ImportPage";
import AdminCoreFeatures from "./pages/AdminCoreFeatures";
import QuickAdd from "./pages/QuickAdd";
import Layout from "./components/Layout";
import { Toaster } from "sonner";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-zinc-400">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="features" element={<Features />} />
        <Route path="features/quick-add" element={<QuickAdd />} />
        <Route path="features/new" element={<FeatureEdit />} />
        <Route path="features/:id" element={<FeatureDetail />} />
        <Route path="features/:id/edit" element={<FeatureEdit />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="admin/core-features" element={<AdminCoreFeatures />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
