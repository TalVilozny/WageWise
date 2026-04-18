import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VerdictReveal } from "./VerdictReveal";
import { PurchaseHistorySection } from "./PurchaseHistorySection";
import {
  appendPurchaseHistoryEntry,
  loadPurchaseHistory,
  updatePurchaseWorthIt,
} from "./purchaseHistory";
import "./App.css";

type CurrencyCode = "USD" | "EUR" | "ILS" | "GBP" | "JPY" | "CAD";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "doibuy-theme";
const HOURLY_STORAGE_KEY = "doibuy-hourly";
const CURRENCY_STORAGE_KEY = "doibuy-currency";
const HOURLY_CONFIGURED_KEY = "doibuy-hourly-configured";

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

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "ILS", label: "Israeli Shekel" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CAD", label: "Canadian Dollar" },
];

const PRICE_MAX: Record<CurrencyCode, number> = {
  USD: 5000,
  EUR: 4500,
  ILS: 18000,
  GBP: 4000,
  JPY: 750000,
  CAD: 6500,
};

const HOURLY_MAX: Record<CurrencyCode, number> = {
  USD: 200,
  EUR: 180,
  ILS: 800,
  GBP: 160,
  JPY: 30000,
  CAD: 250,
};

const HOURLY_MIN: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 1,
  ILS: 5,
  GBP: 1,
  JPY: 100,
  CAD: 1,
};

const HOURLY_STEP: Record<CurrencyCode, number> = {
  USD: 0.5,
  EUR: 0.5,
  ILS: 1,
  GBP: 0.5,
  JPY: 100,
  CAD: 0.5,
};

function readHourlyConfigured(): boolean {
  try {
    return localStorage.getItem(HOURLY_CONFIGURED_KEY) === "1";
  } catch {
    return false;
  }
}

function readStoredCurrencyCode(): CurrencyCode | null {
  try {
    const v = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (v && CURRENCIES.some((c) => c.code === v)) return v as CurrencyCode;
  } catch {
    /* ignore */
  }
  return null;
}

function readStoredHourlyNumber(currency: CurrencyCode): number | null {
  try {
    const v = localStorage.getItem(HOURLY_STORAGE_KEY);
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const hMin = HOURLY_MIN[currency];
    const hMax = HOURLY_MAX[currency];
    const hStep = HOURLY_STEP[currency];
    return Math.min(hMax, Math.max(hMin, Math.round(n / hStep) * hStep));
  } catch {
    return null;
  }
}

function formatMoney(amount: number, currency: CurrencyCode): string {
  const fraction = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(amount);
}

function formatHours(h: number): string {
  if (h < 0.01) return "less than a minute of work";
  if (h < 1 / 60) return `${Math.round(h * 60)} sec of work (rounded)`;
  if (h < 1) return `${Math.round(h * 60)} minutes of work`;
  if (h < 10) return `${h.toFixed(1)} hours of work`;
  return `${h.toFixed(1)} hours of work`;
}

function clampPriceAmount(
  v: number,
  currency: CurrencyCode,
  maxPrice: number,
): number {
  const step = currency === "JPY" ? 100 : 1;
  return Math.min(maxPrice, Math.max(0, Math.round(v / step) * step));
}

function clampHoursLimit(v: number): number {
  return Math.min(120, Math.max(0.25, Math.round(v * 4) / 4));
}

const STEP_LABELS = ["Your pay", "The price", "Your rule"];

const INTRO_TUTORIAL_STEPS = [
  {
    id: "pay",
    title: "First: set your hourly rate",
    body: "Pick the currency you think in, then slide to what you actually earn per hour (take-home is fine). Every price in the app gets translated into “how long would I have to work for this?” — so this number is the anchor.",
  },
  {
    id: "tag",
    title: "Next: enter the sticker price",
    body: "Type or slide the real cost of the thing you’re eyeing — tag, cart total, whatever matches the decision you’re making. No shame, just a number so we can compare it to your time.",
  },
  {
    id: "time",
    title: "Then: draw your line",
    body: "Set the most hours you’d honestly trade for this purchase. That’s your rule, not anyone else’s. If the math says it costs more work than you’re willing to give, you’ll feel it in the verdict.",
  },
  {
    id: "boom",
    title: "Last: see the verdict",
    body: "We divide price by your rate and stack it against your hour limit. If it fits your rule, you’ll get a clear yes — otherwise you’ll see why it doesn’t. Tip: under each slider you can type an exact value if dragging feels fiddly. When you’re ready, tap Start — or Skip to jump straight in.",
  },
] as const;

const EXPLAINER = [
  {
    id: "pay",
    num: "01",
    title: "Your pay",
    blurb: "Slide your real hourly rate.",
    accent: "primary",
    Icon: IconWallet,
  },
  {
    id: "tag",
    num: "02",
    title: "The price",
    blurb: "Match the sticker shock.",
    accent: "accent",
    Icon: IconTag,
  },
  {
    id: "time",
    num: "03",
    title: "Your limit",
    blurb: "How many hours feels fair?",
    accent: "deep",
    Icon: IconClock,
  },
  {
    id: "boom",
    num: "04",
    title: "The reveal",
    blurb: "We crunch it — then surprise you.",
    accent: "light",
    Icon: IconSpark,
  },
] as const;

function IconWallet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gw"
          x1="8"
          y1="12"
          x2="40"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-deep)" />
        </linearGradient>
      </defs>
      <rect
        x="6"
        y="14"
        width="36"
        height="24"
        rx="6"
        fill="url(#gw)"
        opacity="0.9"
      />
      <rect
        x="6"
        y="14"
        width="36"
        height="24"
        rx="6"
        stroke="var(--icon-stroke)"
        strokeWidth="1.5"
      />
      <circle cx="34" cy="26" r="4" fill="var(--icon-inner)" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gt"
          x1="10"
          y1="8"
          x2="38"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      <path
        d="M14 10h14l12 12v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z"
        fill="url(#gt)"
        opacity="0.95"
      />
      <path
        d="M14 10h14l12 12v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z"
        stroke="var(--icon-stroke)"
        strokeWidth="1.5"
      />
      <circle
        cx="18"
        cy="18"
        r="3"
        fill="var(--color-btn-text)"
        opacity="0.95"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gc"
          x1="12"
          y1="8"
          x2="36"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-deep)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill="url(#gc)" opacity="0.9" />
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="var(--icon-stroke)"
        strokeWidth="1.5"
      />
      <path
        d="M24 16v10l7 4"
        stroke="var(--icon-stroke)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gs"
          x1="8"
          y1="8"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <path
        d="M24 4l2.8 10.2L38 18l-10.2 3.8L24 32l-3.8-10.2L10 18l10.2-3.8L24 4z"
        fill="url(#gs)"
        opacity="0.95"
      />
      <path
        d="M24 4l2.8 10.2L38 18l-10.2 3.8L24 32l-3.8-10.2L10 18l10.2-3.8L24 4z"
        stroke="var(--icon-stroke)"
      />
    </svg>
  );
}

function VisualExplainer({
  reduceMotion,
  activeExplainerId,
  activeStep,
}: {
  reduceMotion: boolean | null;
  activeExplainerId: (typeof EXPLAINER)[number]["id"];
  activeStep: number;
}) {
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.11,
        delayChildren: reduceMotion ? 0 : 0.15,
      },
    },
  };
  const item = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 28,
      scale: reduceMotion ? 1 : 0.94,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 380, damping: 26 },
    },
  };

  return (
    <motion.div
      className="visual-explainer"
      variants={container}
      initial="hidden"
      animate="show"
      aria-label="How it works: four animated steps"
    >
      <div className="explainer-connector" aria-hidden="true">
        <span className="explainer-beam" />
      </div>
      {EXPLAINER.slice(0, activeStep + 1).map((row, i) => (
        <motion.article
          key={row.id}
          className={`explainer-card explainer-card--${row.accent} ${
            reduceMotion || row.id === activeExplainerId
              ? "explainer-card--focus"
              : "explainer-card--dim"
          }`}
          variants={item}
          style={{ zIndex: EXPLAINER.length - i }}
        >
          {!reduceMotion && (
            <span
              className="explainer-float"
              style={{ animationDelay: `${i * 0.35}s` }}
              aria-hidden="true"
            />
          )}
          <span className="explainer-num">{row.num}</span>
          <div className="explainer-icon" aria-hidden="true">
            <row.Icon className="explainer-svg" />
          </div>
          <h3 className="explainer-title">{row.title}</h3>
          <p className="explainer-blurb">{row.blurb}</p>
        </motion.article>
      ))}
    </motion.div>
  );
}

function App() {
  const reduceMotion = useReducedMotion();
  const wizardRef = useRef<HTMLElement>(null);
  const payEditorRef = useRef<HTMLDivElement>(null);
  const payRateSnapshotRef = useRef<{
    hourly: number;
    currency: CurrencyCode;
  } | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);

  const [hourlyConfigured, setHourlyConfigured] =
    useState(readHourlyConfigured);
  const [currency, setCurrency] = useState<CurrencyCode>(
    () => readStoredCurrencyCode() ?? "USD",
  );
  const [hourly, setHourly] = useState(() => {
    const cur = readStoredCurrencyCode() ?? "USD";
    return readStoredHourlyNumber(cur) ?? 25;
  });
  const [productPrice, setProductPrice] = useState(120);
  const [maxHours, setMaxHours] = useState(8);
  const [step, setStep] = useState(() => (readHourlyConfigured() ? 2 : 1));
  const [verdictShown, setVerdictShown] = useState(false);
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [startReady, setStartReady] = useState(false);
  const [introTutorialStep, setIntroTutorialStep] = useState(0);
  const [introHasReachedEnd, setIntroHasReachedEnd] = useState(false);
  const [payEditorOpen, setPayEditorOpen] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState(loadPurchaseHistory);

  const maxPrice = PRICE_MAX[currency];
  const priceStep = currency === "JPY" ? 100 : 1;
  const hMin = HOURLY_MIN[currency];
  const hMax = HOURLY_MAX[currency];
  const hStep = HOURLY_STEP[currency];

  const hoursForPrice = useMemo(() => {
    if (hourly <= 0) return null;
    return productPrice / hourly;
  }, [hourly, productPrice]);

  const canBuy =
    hourly > 0 && hoursForPrice !== null && hoursForPrice <= maxHours;

  const clampHourly = (v: number) =>
    Math.min(hMax, Math.max(hMin, Math.round(v / hStep) * hStep));

  const handleCurrencyChange = (code: CurrencyCode) => {
    const min = HOURLY_MIN[code];
    const max = HOURLY_MAX[code];
    const st = HOURLY_STEP[code];
    const nextMax = PRICE_MAX[code];
    setCurrency(code);
    setVerdictShown(false);
    setHourly((h) => Math.min(max, Math.max(min, Math.round(h / st) * st)));
    setProductPrice((p) => clampPriceAmount(p, code, nextMax));
  };

  useEffect(() => {
    try {
      localStorage.setItem(HOURLY_STORAGE_KEY, String(hourly));
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      /* ignore */
    }
  }, [hourly, currency]);

  const commitHourlyConfigured = () => {
    setHourlyConfigured(true);
    try {
      localStorage.setItem(HOURLY_CONFIGURED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const minWizardStep = hourlyConfigured ? 2 : 1;

  const openPayEditor = () => {
    payRateSnapshotRef.current = { hourly, currency };
    setPayEditorOpen(true);
  };

  const closePayEditor = () => {
    setPayEditorOpen(false);
    payRateSnapshotRef.current = null;
  };

  const cancelPayEditor = () => {
    const snap = payRateSnapshotRef.current;
    if (snap) {
      setHourly(snap.hourly);
      setCurrency(snap.currency);
    }
    closePayEditor();
  };

  const savePayEditor = () => {
    closePayEditor();
  };

  const unlockApp = () => {
    setAppUnlocked(true);
  };

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

  useEffect(() => {
    if (appUnlocked) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [appUnlocked]);

  useEffect(() => {
    if (reduceMotion) {
      setIntroTutorialStep(INTRO_TUTORIAL_STEPS.length - 1);
      setIntroHasReachedEnd(true);
      return;
    }
    if (introTutorialStep >= INTRO_TUTORIAL_STEPS.length - 1) {
      setIntroHasReachedEnd(true);
    }
  }, [reduceMotion, introTutorialStep]);

  useEffect(() => {
    setStartReady(introHasReachedEnd);
  }, [introHasReachedEnd]);

  useEffect(() => {
    if (!appUnlocked) return;
    wizardRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [appUnlocked, reduceMotion]);

  useEffect(() => {
    if (hourlyConfigured && step === 1) setStep(2);
  }, [hourlyConfigured, step]);

  useEffect(() => {
    if (!payEditorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePayEditor();
    };
    const onPointer = (e: MouseEvent) => {
      const el = payEditorRef.current;
      if (!el?.contains(e.target as Node)) closePayEditor();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [payEditorOpen]);

  const goNext = () => {
    setVerdictShown(false);
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => {
    setVerdictShown(false);
    setStep((s) => Math.max(minWizardStep, s - 1));
  };

  const handleDecide = () => {
    setVerdictShown(true);
    if (hourly > 0 && hoursForPrice !== null) {
      setPurchaseHistory(
        appendPurchaseHistoryEntry({
          currency,
          price: productPrice,
          hourly,
          hoursCost: hoursForPrice,
          allowedHours: maxHours,
          verdictYes: canBuy,
        }),
      );
    }
  };

  const startOver = () => {
    setVerdictShown(false);
    setStep(hourlyConfigured ? 2 : 1);
  };

  const slideVariants = {
    enter: (dir: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir > 0 ? 24 : -24 },
    center: { opacity: 1, x: 0 },
    exit: (dir: number) =>
      reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir < 0 ? 24 : -24 },
  };

  const [direction, setDirection] = useState(1);

  return (
    <div className="page">
      <div className="bg-mesh" aria-hidden="true" />
      <div className="bg-dots" aria-hidden="true" />
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <header className="top-nav">
        <div className="top-nav-brand">
          <span className="logo-mark">◇</span>
          <span className="logo-type">WageWise</span>
        </div>
        <div className="top-nav-end">
          {appUnlocked && hourlyConfigured && (
            <div className="top-nav-pay" ref={payEditorRef}>
              <span className="pay-rate-chip" aria-live="polite">
                {formatMoney(hourly, currency)}/hr
              </span>
              <button
                type="button"
                className="pay-rate-edit"
                onClick={() =>
                  payEditorOpen ? closePayEditor() : openPayEditor()
                }
                aria-expanded={payEditorOpen}
                aria-controls="pay-rate-editor"
                aria-label="Edit hourly pay"
              >
                Edit
              </button>
              {payEditorOpen && (
                <div
                  id="pay-rate-editor"
                  className="pay-rate-popover"
                  role="dialog"
                  aria-label="Hourly pay"
                >
                  <p className="pay-rate-popover-title">Your hourly pay</p>
                  <div
                    className="currency-chips pay-rate-currency"
                    role="group"
                    aria-label="Currency"
                  >
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className={`chip ${currency === c.code ? "selected" : ""}`}
                        onClick={() => handleCurrencyChange(c.code)}
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                  <div className="slider-block pay-rate-slider-block">
                    <div className="slider-head">
                      <label
                        className="field-label"
                        htmlFor="hourly-range-header"
                      >
                        Per hour
                      </label>
                      <span className="pill-value pill-mint">
                        {formatMoney(hourly, currency)}/hr
                      </span>
                    </div>
                    <input
                      id="hourly-range-header"
                      type="range"
                      min={hMin}
                      max={hMax}
                      step={hStep}
                      value={clampHourly(hourly)}
                      onChange={(e) => {
                        setHourly(Number(e.target.value));
                        setVerdictShown(false);
                      }}
                      className="range-input range-mint"
                    />
                    <div className="slider-exact-row">
                      <label
                        className="slider-exact-label"
                        htmlFor="hourly-exact-header"
                      >
                        Exact amount
                      </label>
                      <input
                        id="hourly-exact-header"
                        type="number"
                        className="slider-exact-input"
                        min={hMin}
                        max={hMax}
                        step={hStep}
                        value={clampHourly(hourly)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") return;
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) return;
                          setHourly(clampHourly(n));
                          setVerdictShown(false);
                        }}
                      />
                    </div>
                  </div>
                  <div className="pay-rate-popover-actions">
                    <button
                      type="button"
                      className="btn-back pay-rate-cancel"
                      onClick={cancelPayEditor}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-next pay-rate-done"
                      onClick={savePayEditor}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

      {!appUnlocked && (
        <div
          className="intro-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-heading"
        >
          <div className="intro-shell-inner">
            <section
              className="hero intro-hero intro-layout"
              aria-labelledby="intro-heading"
            >
              <div className="intro-hero-head">
                <div className="hero-copy intro-hero-copy">
                  <motion.p
                    className="hero-kicker"
                    initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    Neo-budget clarity
                  </motion.p>
                  <motion.h1
                    id="intro-heading"
                    className="hero-title intro-hero-title"
                  >
                    <motion.span
                      className="hero-title-line"
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.05 }}
                    >
                      SHOULD I
                    </motion.span>
                    <motion.span
                      className="hero-title-line hero-title-accent"
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.12 }}
                    >
                      BUY IT?
                    </motion.span>
                  </motion.h1>
                  <motion.p
                    className="hero-sub intro-hero-sub"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                  >
                    Three sliders. One verdict. Zero spoilers until the end.
                  </motion.p>
                </div>
              </div>

              <div
                className="intro-story-rail story-rail story-rail--intro"
                role="tablist"
                aria-label="Tutorial steps"
              >
                {["01", "02", "03", "04"].map((n, i) => (
                  <div key={n} className="story-node-wrap">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={i === introTutorialStep}
                      aria-controls="intro-tutorial-panel"
                      id={`intro-tab-${i}`}
                      disabled={i > introTutorialStep}
                      className={`story-node ${i === introTutorialStep ? "active" : ""} ${i < introTutorialStep ? "done" : ""}`}
                      onClick={() => {
                        if (i <= introTutorialStep) {
                          setIntroTutorialStep(i);
                        }
                      }}
                    >
                      <span className="story-num">{n}</span>
                    </button>
                    {i < 3 && (
                      <span className="story-line" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>

              <div className="intro-visual-band">
                <VisualExplainer
                  reduceMotion={reduceMotion}
                  activeExplainerId={INTRO_TUTORIAL_STEPS[introTutorialStep].id}
                  activeStep={introTutorialStep}
                />
              </div>

              <div
                className="intro-tutorial-wrap intro-tutorial-centered"
                id="intro-tutorial-panel"
                role="tabpanel"
                aria-labelledby={`intro-tab-${introTutorialStep}`}
              >
                <p className="intro-tutorial-kicker">
                  Step {introTutorialStep + 1} of {INTRO_TUTORIAL_STEPS.length}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={INTRO_TUTORIAL_STEPS[introTutorialStep].id}
                    className="intro-tutorial-card"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: reduceMotion ? 1 : 0,
                      y: reduceMotion ? 0 : -8,
                    }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  >
                    <h3 className="intro-tutorial-title">
                      {INTRO_TUTORIAL_STEPS[introTutorialStep].title}
                    </h3>
                    <p className="intro-tutorial-body">
                      {INTRO_TUTORIAL_STEPS[introTutorialStep].body}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="step-nav intro-tutorial-nav">
                  <button
                    type="button"
                    className="btn-back"
                    disabled={introTutorialStep === 0}
                    onClick={() =>
                      setIntroTutorialStep((s) => Math.max(0, s - 1))
                    }
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn-next"
                    disabled={
                      introTutorialStep >= INTRO_TUTORIAL_STEPS.length - 1
                    }
                    onClick={() =>
                      setIntroTutorialStep((s) =>
                        Math.min(INTRO_TUTORIAL_STEPS.length - 1, s + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>

              <div
                className={`intro-actions ${introHasReachedEnd ? "intro-actions--no-skip" : ""}`}
              >
                {!introHasReachedEnd && (
                  <button
                    type="button"
                    className="btn-skip"
                    onClick={unlockApp}
                  >
                    Skip
                  </button>
                )}
                <motion.button
                  type="button"
                  className="btn-start"
                  onClick={unlockApp}
                  disabled={!startReady}
                  title={
                    startReady
                      ? undefined
                      : introHasReachedEnd
                        ? "Tap Start to open the tool"
                        : "Use Next until the last step, or tap Skip"
                  }
                  whileHover={
                    reduceMotion || !startReady ? undefined : { scale: 1.04 }
                  }
                  whileTap={
                    reduceMotion || !startReady ? undefined : { scale: 0.97 }
                  }
                >
                  <span className="btn-start-glow" aria-hidden="true" />
                  Start
                </motion.button>
              </div>
            </section>
          </div>
        </div>
      )}

      {appUnlocked && (
        <>
          <section id="wizard" className="wizard-section" ref={wizardRef}>
            <h2 className="wizard-heading">Your turn</h2>
            <div className="wizard-layout">
              <aside className="wizard-rail-vertical" aria-label="Progress">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={`w-step ${step >= n ? "done" : ""} ${step === n ? "current" : ""}`}
                  >
                    <span className="w-step-num">
                      {String(n).padStart(2, "0")}
                    </span>
                    <span className="w-step-cap">{STEP_LABELS[n - 1]}</span>
                    {n < 3 && <span className="w-step-connector" />}
                  </div>
                ))}
              </aside>

              <motion.main
                className="main-card glass-panel"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {!verdictShown && (
                  <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 && !hourlyConfigured && (
                      <motion.div
                        key="s1"
                        role="group"
                        aria-label="Step 1: Your hourly pay"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          duration: reduceMotion ? 0 : 0.26,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="step-panel"
                      >
                        <p className="step-kicker">Step 1 of 3</p>
                        <h2 className="step-title">What do you make?</h2>
                        <p className="step-blurb">
                          Pick a currency, then slide to your rough hourly pay.
                        </p>
                        <div
                          className="currency-chips"
                          role="group"
                          aria-label="Currency"
                        >
                          {CURRENCIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              className={`chip ${currency === c.code ? "selected" : ""}`}
                              onClick={() => handleCurrencyChange(c.code)}
                            >
                              {c.code}
                            </button>
                          ))}
                        </div>
                        <div className="slider-block">
                          <div className="slider-head">
                            <label
                              className="field-label"
                              htmlFor="hourly-range"
                            >
                              Per hour
                            </label>
                            <motion.span
                              className="pill-value pill-mint"
                              key={`${hourly}-${currency}`}
                              initial={reduceMotion ? false : { scale: 0.94 }}
                              animate={{ scale: 1 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 22,
                                    }
                              }
                            >
                              {formatMoney(hourly, currency)}/hr
                            </motion.span>
                          </div>
                          <input
                            id="hourly-range"
                            type="range"
                            min={hMin}
                            max={hMax}
                            step={hStep}
                            value={clampHourly(hourly)}
                            onChange={(e) => {
                              setHourly(Number(e.target.value));
                              setVerdictShown(false);
                            }}
                            className="range-input range-mint"
                          />
                          <div className="slider-exact-row">
                            <label
                              className="slider-exact-label"
                              htmlFor="hourly-exact"
                            >
                              Exact amount
                            </label>
                            <input
                              id="hourly-exact"
                              type="number"
                              className="slider-exact-input"
                              min={hMin}
                              max={hMax}
                              step={hStep}
                              value={clampHourly(hourly)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") return;
                                const n = Number(e.target.value);
                                if (!Number.isFinite(n)) return;
                                setHourly(clampHourly(n));
                                setVerdictShown(false);
                              }}
                            />
                          </div>
                        </div>
                        <div className="step-nav">
                          <span />
                          <button
                            type="button"
                            className="btn-next"
                            onClick={() => {
                              setDirection(1);
                              commitHourlyConfigured();
                              goNext();
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="s2"
                        role="group"
                        aria-label="Step 2: Item price"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          duration: reduceMotion ? 0 : 0.26,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="step-panel"
                      >
                        <p className="step-kicker">Step 2 of 3</p>
                        <h2 className="step-title">How much does it cost?</h2>
                        <p className="step-blurb">
                          Slide until it matches the price tag.
                        </p>
                        <div className="slider-block">
                          <div className="slider-head">
                            <label className="field-label" htmlFor="price">
                              This item costs
                            </label>
                            <motion.span
                              className="pill-value pill-coral"
                              key={productPrice + currency}
                              initial={reduceMotion ? false : { scale: 0.94 }}
                              animate={{ scale: 1 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 22,
                                    }
                              }
                            >
                              {formatMoney(productPrice, currency)}
                            </motion.span>
                          </div>
                          <input
                            id="price"
                            type="range"
                            min={0}
                            max={maxPrice}
                            step={currency === "JPY" ? 100 : 1}
                            value={Math.min(productPrice, maxPrice)}
                            onChange={(e) => {
                              setProductPrice(Number(e.target.value));
                              setVerdictShown(false);
                            }}
                            className="range-input range-coral"
                          />
                          <div className="slider-exact-row">
                            <label
                              className="slider-exact-label"
                              htmlFor="price-exact"
                            >
                              Exact amount
                            </label>
                            <input
                              id="price-exact"
                              type="number"
                              className="slider-exact-input"
                              min={0}
                              max={maxPrice}
                              step={priceStep}
                              value={Math.min(productPrice, maxPrice)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") return;
                                const n = Number(e.target.value);
                                if (!Number.isFinite(n)) return;
                                setProductPrice(
                                  clampPriceAmount(n, currency, maxPrice),
                                );
                                setVerdictShown(false);
                              }}
                            />
                          </div>
                        </div>
                        <div className="step-nav">
                          {!hourlyConfigured ? (
                            <button
                              type="button"
                              className="btn-back"
                              onClick={() => {
                                setDirection(-1);
                                goBack();
                              }}
                            >
                              Back
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            type="button"
                            className="btn-next"
                            onClick={() => {
                              setDirection(1);
                              goNext();
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="s3"
                        role="group"
                        aria-label="Step 3: Hours rule"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          duration: reduceMotion ? 0 : 0.26,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="step-panel"
                      >
                        <p className="step-kicker">Step 3 of 3</p>
                        <h2 className="step-title">Draw your line</h2>
                        <p className="step-blurb">
                          How many hours of work feels &ldquo;worth it&rdquo;
                          for this thing?
                        </p>
                        <div className="slider-block">
                          <div className="slider-head">
                            <label className="field-label" htmlFor="hours">
                              I&apos;ll only buy if it&apos;s under
                            </label>
                            <motion.span
                              className="pill-value pill-sun"
                              key={maxHours}
                              initial={reduceMotion ? false : { scale: 0.94 }}
                              animate={{ scale: 1 }}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : {
                                      type: "spring",
                                      stiffness: 400,
                                      damping: 22,
                                    }
                              }
                            >
                              {maxHours} {maxHours === 1 ? "hour" : "hours"} of
                              work
                            </motion.span>
                          </div>
                          <input
                            id="hours"
                            type="range"
                            min={0.25}
                            max={120}
                            step={0.25}
                            value={maxHours}
                            onChange={(e) => {
                              setMaxHours(Number(e.target.value));
                              setVerdictShown(false);
                            }}
                            className="range-input range-sun"
                          />
                          <div className="slider-exact-row">
                            <label
                              className="slider-exact-label"
                              htmlFor="hours-exact"
                            >
                              Exact hours
                            </label>
                            <input
                              id="hours-exact"
                              type="number"
                              className="slider-exact-input"
                              min={0.25}
                              max={120}
                              step={0.25}
                              value={maxHours}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") return;
                                const n = Number(e.target.value);
                                if (!Number.isFinite(n)) return;
                                setMaxHours(clampHoursLimit(n));
                                setVerdictShown(false);
                              }}
                            />
                          </div>
                        </div>
                        <p className="tease">
                          Ready? The big reveal is one tap away.
                        </p>
                        <div className="step-nav step-nav-final">
                          <button
                            type="button"
                            className="btn-back"
                            onClick={() => {
                              setDirection(-1);
                              goBack();
                            }}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            className="cta"
                            onClick={handleDecide}
                          >
                            Do I buy it?
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                <AnimatePresence mode="wait">
                  {verdictShown && hourly > 0 && hoursForPrice !== null && (
                    <VerdictReveal
                      key="verdict"
                      canBuy={canBuy}
                      reduceMotion={reduceMotion}
                      productPrice={productPrice}
                      currency={currency}
                      hoursForPrice={hoursForPrice}
                      hourly={hourly}
                      maxHours={maxHours}
                      formatMoney={formatMoney}
                      formatHours={formatHours}
                      onStartOver={startOver}
                    />
                  )}
                </AnimatePresence>

                {verdictShown && hourly <= 0 && (
                  <motion.div
                    className="verdict verdict-no"
                    role="alert"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Slide your hourly rate above zero, then try again.
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setVerdictShown(false);
                        if (hourlyConfigured) {
                          openPayEditor();
                        } else {
                          setStep(1);
                        }
                      }}
                    >
                      {hourlyConfigured ? "Edit hourly pay" : "Back to step 1"}
                    </button>
                  </motion.div>
                )}
              </motion.main>
            </div>

            <PurchaseHistorySection
              entries={purchaseHistory}
              formatMoney={formatMoney}
              formatHours={formatHours}
              onRegretAnswer={(id, worthIt) =>
                setPurchaseHistory(updatePurchaseWorthIt(id, worthIt))
              }
            />
          </section>

          <footer className="site-footer">
            <p>For fun reflection — not financial advice.</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
