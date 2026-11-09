import { Link } from "react-router-dom";
import { AUTHOR } from "./articles";
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

export default function WiserLayout({ children }) {
  return (
    <div className="wiser">
      <header className="wiser-header">
        <Link to="/wiser" className="wiser-header__logo">
          Wiser
        </Link>
        <Link to="/portfolio" className="wiser-header__link">
          Portfolio
        </Link>
      </header>
      {children}
    </div>
  );
}
