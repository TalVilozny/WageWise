import { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "./LogoMark";
import { SiteFooter } from "./SiteFooter";
import wageWiseTextLogo from "./Icons/WageWiseText.png";
import "./App.css";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "doibuy-theme";

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function PrivacyPolicy() {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);

  useLayoutEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="page privacy-page">
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-dots" aria-hidden="true" />
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <header className="top-nav privacy-top-nav">
        <Link to="/" className="top-nav-brand privacy-nav-brand">
          <LogoMark />
          <img
            src={wageWiseTextLogo}
            alt="WageWise"
            className="logo-wordmark"
            loading="eager"
            decoding="async"
          />
        </Link>
        <div className="top-nav-end">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? (
              <IconSun className="theme-toggle-icon" />
            ) : (
              <IconMoon className="theme-toggle-icon" />
            )}
          </button>
        </div>
      </header>

      <main className="privacy-main glass-panel">
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Last updated: April 17, 2026</p>

        <div className="privacy-body">
          <p>
            This policy describes how WageWise (&ldquo;the app&rdquo;) handles
            information when you use this website. The app is designed to work
            primarily in your browser without sending your purchase reflections
            to our servers.
          </p>

          <h2>Information stored on your device</h2>
          <p>
            The app may save settings and data in your browser using{" "}
            <strong>local storage</strong>, for example: theme preference,
            currency, hourly rate, days and hours per typical workweek, and a
            local history of
            verdicts
            you have run. This data stays on your device unless you clear site
            data in your browser.
          </p>

          <h2>What we do not collect on a server</h2>
          <p>
            We do not operate a login or account system in this app version and
            do not intentionally collect names, email addresses, or your
            verdict history on our servers through the tool itself. If you
            contact the developer by email, your message and address will be
            handled like any normal email correspondence.
          </p>

          <h2>Cookies</h2>
          <p>
            The app does not rely on tracking cookies for advertising. Any
            storage used is for app functionality (preferences and local
            history) as described above.
          </p>

          <h2>Third parties</h2>
          <p>
            Hosting or network providers that serve the static files may
            receive standard technical data (such as IP address) as part of
            normal web delivery. This app does not embed third-party analytics
            by default.
          </p>

          <h2>Children</h2>
          <p>
            The app is a general audience reflection tool and is not directed at
            children under 13.
          </p>

          <h2>Changes</h2>
          <p>
            This policy may be updated from time to time. The &ldquo;Last
            updated&rdquo; date at the top will change when it is revised.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy:{" "}
            <a href="mailto:TalVilozny@gmail.com">TalVilozny@gmail.com</a>
          </p>
        </div>

        <p className="privacy-back-wrap">
          <Link to="/" className="privacy-back">
            ← Back to WageWise
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
