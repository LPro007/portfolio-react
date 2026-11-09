import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabase";

// undefined while checking, null when signed out, otherwise the session.
export function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession)
    );
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return session;
}

export function RequireAuth({ children }) {
  const session = useSession();
  if (session === undefined) return null;
  if (!session) return <Navigate to="/wiser/login" replace />;
  return children;
}
