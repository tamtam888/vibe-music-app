import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ONBOARDED_KEY } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Checks for Supabase magic-link / OAuth callback tokens in the URL hash.
 * While these are present we must not redirect — Supabase needs time to
 * exchange them for a session before we know the user's auth state.
 */
function hasMagicLinkHash(): boolean {
  return window.location.hash.includes("access_token");
}

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Remain on the loading screen until auth state is resolved, or while a
  // magic-link callback is being processed.
  if (loading || hasMagicLinkHash()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(30_25%_6%)]">
        <Loader2 className="animate-spin text-amber-400" size={24} />
      </div>
    );
  }

  if (user) {
    // Keep the onboarded flag in sync for authenticated users.
    localStorage.setItem(ONBOARDED_KEY, "1");
    return <>{children}</>;
  }

  // Allow access for users who have previously passed the entry screen
  // (local-only mode — no account required to use the player).
  if (localStorage.getItem(ONBOARDED_KEY)) {
    return <>{children}</>;
  }

  // First-time visitor, not authenticated → redirect to the auth entry screen.
  return <Navigate to="/auth" state={{ from: location }} replace />;
}
