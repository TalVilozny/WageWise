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
