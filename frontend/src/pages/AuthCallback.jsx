import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// This component is kept as a safety net for any redirect that lands here.
// With Google OAuth (implicit flow), auth is handled directly in Login.jsx.
export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    navigate(user ? "/" : "/login", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-zinc-400">Signing you in…</div>
    </div>
  );
}
