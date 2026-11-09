import { Link, useNavigate } from "react-router-dom";
import { AUTHOR } from "./articles";
import { useSession } from "./auth";
import { supabase } from "./supabase";
import "./Wiser.css";

export function Avatar({ size = 24 }) {
  const initials = AUTHOR.split(" ")
    .map((word) => word[0])
    .join("");

  return (
    <span
      className="wiser-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function AuthorNav() {
  const session = useSession();
  const navigate = useNavigate();

  if (!session) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/wiser");
  };

  return (
    <>
      <Link to="/wiser/new" className="wiser-header__link">
        Write
      </Link>
      <Link to="/wiser/stories" className="wiser-header__link">
        Stories
      </Link>
      <button type="button" className="wiser-header__link" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}

export default function WiserLayout({ children, status, actions }) {
  return (
    <div className="wiser">
      <header className="wiser-header">
        <div className="wiser-header__start">
          <Link to="/wiser" className="wiser-header__logo">
            WISER
          </Link>
          {status && <span className="wiser-header__status">{status}</span>}
        </div>
        <div className="wiser-header__actions">
          {actions || <AuthorNav />}
        </div>
      </header>
      {children}
    </div>
  );
}
