export type CurrencyCode = "USD" | "EUR" | "ILS" | "GBP" | "JPY" | "CAD";

const STORAGE_KEY = "doibuy-purchase-history";
const MAX_ENTRIES = 200;

/** Prompt “Was it worth it?” only after this delay from the decision (a few days). */
export const REGRET_PROMPT_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** Show the regret vs worth-it graph once this many purchases have a follow-up answer. */
export const REGRET_GRAPH_MIN_ANSWERS = 3;

const VALID_CURRENCY = new Set<CurrencyCode>([
  "USD",
  "EUR",
  "ILS",
  "GBP",
  "JPY",
  "CAD",
]);

export type PurchaseHistoryEntry = {
  id: string;
  decidedAt: number;
  currency: CurrencyCode;
  price: number;
  hourly: number;
  hoursCost: number;
  allowedHours: number;
  verdictYes: boolean;
  /** Follow-up: null = not answered yet */
  worthIt: boolean | null;
};

function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && VALID_CURRENCY.has(v as CurrencyCode);
}

function parseEntry(raw: unknown): PurchaseHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const decidedAt = o.decidedAt;
  const currency = o.currency;
  const price = o.price;
  const hourly = o.hourly;
  const hoursCost = o.hoursCost;
  const allowedHours = o.allowedHours;
  const verdictYes = o.verdictYes;
  const worthItRaw = o.worthIt;
  let worthIt: boolean | null = null;
  if (worthItRaw === true || worthItRaw === false) worthIt = worthItRaw;
  if (typeof id !== "string" || !id) return null;
  if (typeof decidedAt !== "number" || !Number.isFinite(decidedAt)) return null;
  if (!isCurrencyCode(currency)) return null;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  if (typeof hourly !== "number" || !Number.isFinite(hourly)) return null;
  if (typeof hoursCost !== "number" || !Number.isFinite(hoursCost)) return null;
  if (typeof allowedHours !== "number" || !Number.isFinite(allowedHours))
    return null;
  if (typeof verdictYes !== "boolean") return null;
  return {
    id,
    decidedAt,
    currency,
    price,
    hourly,
    hoursCost,
    allowedHours,
    verdictYes,
    worthIt,
  };
}

export function loadPurchaseHistory(): PurchaseHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map(parseEntry)
      .filter((e): e is PurchaseHistoryEntry => e !== null);
  } catch {
    return [];
  }
}

function persistPurchaseHistory(entries: PurchaseHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function appendPurchaseHistoryEntry(
  entry: Omit<PurchaseHistoryEntry, "id" | "decidedAt" | "worthIt"> & {
    worthIt?: boolean | null;
  },
): PurchaseHistoryEntry[] {
  const prev = loadPurchaseHistory();
  const next: PurchaseHistoryEntry[] = [
    {
      ...entry,
      worthIt: entry.worthIt ?? null,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      decidedAt: Date.now(),
    },
    ...prev,
  ].slice(0, MAX_ENTRIES);
  persistPurchaseHistory(next);
  return next;
}

export function updatePurchaseWorthIt(
  id: string,
  worthIt: boolean,
): PurchaseHistoryEntry[] {
  const prev = loadPurchaseHistory();
  const next = prev.map((e) => (e.id === id ? { ...e, worthIt } : e));
  persistPurchaseHistory(next);
  return next;
}

export function sumHoursCostThisMonth(
  entries: PurchaseHistoryEntry[],
  now: Date = new Date(),
): number {
  const y = now.getFullYear();
  const m = now.getMonth();
  return entries.reduce((sum, e) => {
    const d = new Date(e.decidedAt);
    if (d.getFullYear() === y && d.getMonth() === m) return sum + e.hoursCost;
    return sum;
  }, 0);
}
