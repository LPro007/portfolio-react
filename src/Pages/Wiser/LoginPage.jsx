import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import WiserLayout from "./WiserLayout";
import { loginPath, safeNext, useAuth } from "./auth";
import { supabase } from "./supabase";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const isSignUp = searchParams.get("mode") === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = `${isSignUp ? "Sign up" : "Sign in"} | Wiser`;
    setError("");
    setCheckEmail(false);
  }, [isSignUp]);

  if (session) return <Navigate to={next} replace />;

  const returnUrl = `${window.location.origin}${next}`;

  const continueWithGoogle = async () => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: returnUrl },
    });
    if (oauthError) setError(oauthError.message);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: returnUrl,
        },
      });
      if (signUpError) setError(signUpError.message);
      // With email confirmation on there is no session until the link is used.
      else if (!data.session) setCheckEmail(true);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) setError(signInError.message);
    }
    setSubmitting(false);
  };

  if (checkEmail) {
    return (
      <WiserLayout>
        <main className="wiser-login">
          <h1 className="wiser-login__title">Check your inbox.</h1>
          <p className="wiser-login__text">
            We sent a confirmation link to <strong>{email}</strong>. Open it to
            finish creating your account.
          </p>
        </main>
      </WiserLayout>
    );
  }

  return (
    <WiserLayout>
      <main className="wiser-login">
        <h1 className="wiser-login__title">
          {isSignUp ? "Join WISER." : "Welcome back."}
        </h1>

        <button
          type="button"
          className="wiser-google"
          onClick={continueWithGoogle}
        >
          <GoogleLogo />
          {isSignUp ? "Sign up with Google" : "Sign in with Google"}
        </button>

        <div className="wiser-login__or">or</div>

        <form onSubmit={submit}>
          {isSignUp && (
            <label className="wiser-field">
              Name
              <input
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label className="wiser-field">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="wiser-field">
            Password
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={isSignUp ? 8 : undefined}
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
            {submitting
              ? "One moment…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="wiser-login__switch">
          {isSignUp ? "Already have an account? " : "No account? "}
          <Link to={loginPath(next, isSignUp ? undefined : "signup")}>
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </main>
    </WiserLayout>
  );
}
