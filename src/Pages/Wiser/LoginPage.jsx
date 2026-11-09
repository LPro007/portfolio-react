import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import WiserLayout from "./WiserLayout";
import { useSession } from "./auth";
import { supabase } from "./supabase";

export default function LoginPage() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign in | Wiser";
  }, []);

  if (session) return <Navigate to="/wiser/stories" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  };

  return (
    <WiserLayout>
      <main className="wiser-login">
        <h1 className="wiser-login__title">Sign in</h1>
        <form onSubmit={submit}>
          <label className="wiser-field">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="wiser-field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p className="wiser-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="wiser-button wiser-login__submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </WiserLayout>
  );
}
