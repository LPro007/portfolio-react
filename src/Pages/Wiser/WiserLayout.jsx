import { Link, useLocation, useNavigate } from "react-router-dom";
import { AUTHOR } from "./articles";
import { loginPath, useAuth } from "./auth";
import { supabase } from "./supabase";
import "./Wiser.css";

export function Avatar({ size = 24, name = AUTHOR, src = "" }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src) {
    return (
      <img
        className="wiser-avatar"
        style={style}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <span className="wiser-avatar" style={style} aria-hidden="true">
      {initials || "?"}
    </span>
  );
}

function AccountNav() {
  const { session, isAuthor, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (session === undefined) return null;

  if (!session) {
    return (
      <>
        <Link to={loginPath(location.pathname)} className="wiser-header__link">
          Sign in
        </Link>
        <Link
          to={loginPath(location.pathname, "signup")}
          className="wiser-button wiser-button--small"
        >
          Get started
        </Link>
      </>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    if (/^\/wiser\/(edit|stories|new)/.test(location.pathname)) {
      navigate("/wiser");
    }
  };

  return (
    <>
      {isAuthor && (
        <>
          <Link to="/wiser/new" className="wiser-header__link">
            Write
          </Link>
          <Link to="/wiser/stories" className="wiser-header__link">
            Stories
          </Link>
        </>
      )}
      <button type="button" className="wiser-header__link" onClick={signOut}>
        Sign out
      </button>
      {profile && (
        <span title={profile.display_name}>
          <Avatar
            size={32}
            name={profile.display_name}
            src={profile.avatar_url}
          />
        </span>
      )}
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
        <div className="wiser-header__actions">{actions || <AccountNav />}</div>
      </header>
      {children}
    </div>
  );
}
