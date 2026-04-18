import { Link } from "react-router-dom";

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
        <p className="site-footer-meta">
          © 2026 Tal Vilozny. All rights reserved.{" "}
          <span className="site-footer-dot" aria-hidden="true">
            •
          </span>{" "}
          <Link to="/privacy" className="site-footer-link">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
