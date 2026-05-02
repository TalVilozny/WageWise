import { Link } from "react-router-dom";

function scrollFooterNavTop() {
  const instant =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, left: 0, behavior: instant ? "instant" : "smooth" });
}

export function SiteFooter() {
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
            onClick={() => scrollFooterNavTop()}
          >
            Home
          </Link>
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>
          <Link
            to="/history"
            className="site-footer-link"
            onClick={() => scrollFooterNavTop()}
          >
            Purchase history
          </Link>
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>
          <Link
            to="/personality"
            className="site-footer-link"
            onClick={() => scrollFooterNavTop()}
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
            onClick={() => scrollFooterNavTop()}
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
