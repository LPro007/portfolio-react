import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase is not configured: fill in the values in .env");
}

// createClient throws without a URL, which would also take down /portfolio.
// With placeholders, requests fail and the blog shows its normal error state.
export const supabase = createClient(
  url || "http://localhost:54321",
  key || "not-configured",
  // PKCE returns from Google with ?code=, which survives the GitHub Pages
  // 404 fallback; the library exchanges it and removes it from the URL.
  { auth: { flowType: "pkce" } },
);
