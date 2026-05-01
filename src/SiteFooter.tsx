import { Link, useLocation } from "react-router-dom";

export function SiteFooter() {
  const location = useLocation();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-byline">
          <span className="site-footer-name">Made by Tal Vilozny</span>
        </p>
        <p className="site-footer-tagline">
          Frontend Developer crafting beautiful, performant web experiences
        </p>
        <p className="site-footer-email">
          <a href="mailto:TalVilozny@gmail.com">TalVilozny@gmail.com</a>
        </p>
        <p className="site-footer-nav">
          <Link
            to="/"
            className="site-footer-link"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Home
          </Link>
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>
          <Link
            to="/purchase-history"
            className="site-footer-link"
            onClick={(e) => {
              if (
                location.pathname === "/history" ||
                location.pathname === "/purchase-history"
              ) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Purchase history
          </Link>
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>
          <Link
            to="/spending-personality"
            className="site-footer-link"
            onClick={(e) => {
              if (
                location.pathname === "/personality" ||
                location.pathname === "spending-personality"
              ) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Spending personality
          </Link>
        </p>
        <p className="site-footer-meta">
          © 2026 Tal Vilozny. All rights reserved.{" "}
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>{" "}
          <Link
            to="/privacy"
            className="site-footer-link"
            onClick={(e) => {
              if (location.pathname === "/privacy") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
