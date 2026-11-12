import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined while checking, null when signed out, otherwise the session.
  const [session, setSession] = useState(undefined);
  // undefined until known for the signed-in user.
  const [isAuthor, setIsAuthor] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const userId = session ? session.user.id : null;

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession),
    );
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsAuthor(undefined);
    setProfile(null);
    if (!userId) return undefined;

    let cancelled = false;
    supabase
      .from("authors")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => !cancelled && setIsAuthor(Boolean(data)));
    supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => !cancelled && setProfile(data));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <AuthContext.Provider value={{ session, isAuthor, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Only same-site blog paths, so a crafted link can't redirect elsewhere.
export function safeNext(value) {
  return value && value.startsWith("/wiser") ? value : "/wiser";
}

export function loginPath(next, mode) {
  const params = new URLSearchParams({ next: safeNext(next) });
  if (mode) params.set("mode", mode);
  return `/wiser/login?${params}`;
}

export function RequireAuthor({ children }) {
  const { session, isAuthor } = useAuth();
  const location = useLocation();

  if (session === undefined) return null;
  if (!session) {
    return <Navigate to={loginPath(location.pathname)} replace />;
  }
  if (isAuthor === undefined) return null;
  if (!isAuthor) return <Navigate to="/wiser" replace />;
  return children;
}
