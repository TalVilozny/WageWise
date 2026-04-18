const STORAGE_KEY = "doibuy-savings-goal";

export type SavingsDeadlinePreset =
  | "end_of_month"
  | "end_of_next_month"
  | "three_months"
  | "six_months"
  | "end_of_year";

export type SavingsGoalStored = {
  enabled: boolean;
  targetAmount: number;
  deadline: SavingsDeadlinePreset;
};

const DEFAULT_GOAL: SavingsGoalStored = {
  enabled: false,
  targetAmount: 0,
  deadline: "end_of_year",
};

const VALID_DEADLINE = new Set<SavingsDeadlinePreset>([
  "end_of_month",
  "end_of_next_month",
  "three_months",
  "six_months",
  "end_of_year",
]);

function parseDeadline(v: unknown): SavingsDeadlinePreset | null {
  if (typeof v !== "string") return null;
  return VALID_DEADLINE.has(v as SavingsDeadlinePreset)
    ? (v as SavingsDeadlinePreset)
    : null;
}

export const SAVINGS_DEADLINE_OPTIONS: {
  value: SavingsDeadlinePreset;
  label: string;
}[] = [
  { value: "end_of_month", label: "Until the end of this month" },
  { value: "end_of_next_month", label: "Until the end of next month" },
  { value: "three_months", label: "Within the next 3 months" },
  { value: "six_months", label: "Within the next 6 months" },
  { value: "end_of_year", label: "Until the end of this year" },
];

/**
 * Calendar days from `now` until the chosen deadline (at least 1).
 */
export function computeDaysUntilDeadline(
  preset: SavingsDeadlinePreset,
  now: Date = new Date(),
): number {
  const msPerDay = 86400000;
  let deadline: Date;
  switch (preset) {
    case "end_of_month":
      deadline = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    case "end_of_next_month":
      deadline = new Date(
        now.getFullYear(),
        now.getMonth() + 2,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    case "three_months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 3);
      deadline = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "six_months": {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 6);
      deadline = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      );
      break;
    }
    case "end_of_year":
      deadline = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      deadline = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
  const raw = (deadline.getTime() - now.getTime()) / msPerDay;
  return Math.max(1, Math.ceil(raw));
}

/**
 * Days this purchase sets you back, assuming you spread saving `targetAmount`
 * evenly across `daysUntilDeadline` days.
 */
export function computeGoalDelayDays(
  price: number,
  targetAmount: number,
  daysUntilDeadline: number,
): number | null {
  if (price <= 0 || targetAmount <= 0 || daysUntilDeadline <= 0) return null;
  const impliedDaily = targetAmount / daysUntilDeadline;
  if (!Number.isFinite(impliedDaily) || impliedDaily <= 0) return null;
  return price / impliedDaily;
}

/** Short phrase for UI, e.g. "about 3 days", "about 2 weeks". */
export function formatGoalDelayPhrase(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "";
  if (days > 400) return "a long time";
  if (days > 60) {
    const mo = Math.round(days / 30);
    return mo <= 1 ? "about 1 month" : `about ${mo} months`;
  }
  if (days >= 14) {
    const w = Math.max(1, Math.round(days / 7));
    return w === 1 ? "about 1 week" : `about ${w} weeks`;
  }
  if (days < 1) return "less than a day";
  const d = Math.max(1, Math.round(days));
  return d === 1 ? "about 1 day" : `about ${d} days`;
}

export function loadSavingsGoal(): SavingsGoalStored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GOAL };
    const o = JSON.parse(raw) as Record<string, unknown>;

    if (typeof o.enabled === "boolean") {
      const deadline = parseDeadline(o.deadline) ?? "end_of_year";
      const targetAmount =
        typeof o.targetAmount === "number" && Number.isFinite(o.targetAmount)
          ? Math.max(0, o.targetAmount)
          : 0;
      return {
        enabled: o.enabled,
        targetAmount,
        deadline,
      };
    }

    const targetAmount =
      typeof o.targetAmount === "number" && Number.isFinite(o.targetAmount)
        ? Math.max(0, o.targetAmount)
        : 0;
    const monthlySavings =
      typeof o.monthlySavings === "number" && Number.isFinite(o.monthlySavings)
        ? Math.max(0, o.monthlySavings)
        : 0;
    return {
      enabled: targetAmount > 0 || monthlySavings > 0,
      targetAmount,
      deadline: "end_of_year",
    };
  } catch {
    return { ...DEFAULT_GOAL };
  }
}

export function persistSavingsGoal(s: SavingsGoalStored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
