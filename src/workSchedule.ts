/** Used when converting days/week into monthly hours (typical full-time day). */
export const DEFAULT_HOURS_PER_WORKDAY = 8;

const HOURS_PER_WORKDAY_MIN = 0.5;
const HOURS_PER_WORKDAY_MAX = 16;

export function clampHoursPerWorkday(v: number): number {
  if (!Number.isFinite(v)) return DEFAULT_HOURS_PER_WORKDAY;
  return Math.min(
    HOURS_PER_WORKDAY_MAX,
    Math.max(HOURS_PER_WORKDAY_MIN, Math.round(v * 4) / 4),
  );
}

export function clampDaysPerWeek(v: number): number {
  if (!Number.isFinite(v)) return 5;
  return Math.min(7, Math.max(1, Math.round(v)));
}

/**
 * Approximate paid work hours in the current calendar month, assuming
 * `daysPerWeek` workdays spread across the month and `hoursPerWorkday` per workday.
 */
export function computeExpectedWorkHoursThisMonth(
  daysPerWeek: number,
  now: Date = new Date(),
  hoursPerWorkday: number = DEFAULT_HOURS_PER_WORKDAY,
): number {
  const d = clampDaysPerWeek(daysPerWeek);
  if (hoursPerWorkday <= 0) return 0;
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const approxWorkDays = (daysInMonth * d) / 7;
  return Math.round(approxWorkDays * hoursPerWorkday);
}

/** Gross pay implied by hourly × schedule (same basis as monthly hours in the app). */
export function computeEarningsBreakdown(
  hourly: number,
  daysPerWeek: number,
  hoursPerWorkday: number,
  now: Date = new Date(),
): {
  dailyPay: number;
  weeklyPay: number;
  monthlyPay: number;
  yearlyPay: number;
} | null {
  if (!Number.isFinite(hourly) || hourly <= 0) return null;
  if (!Number.isFinite(hoursPerWorkday) || hoursPerWorkday <= 0) return null;
  const d = clampDaysPerWeek(daysPerWeek);
  const weeklyHours = d * hoursPerWorkday;
  const monthlyHours = computeExpectedWorkHoursThisMonth(
    daysPerWeek,
    now,
    hoursPerWorkday,
  );
  return {
    dailyPay: hourly * hoursPerWorkday,
    weeklyPay: hourly * weeklyHours,
    monthlyPay: hourly * monthlyHours,
    yearlyPay: hourly * weeklyHours * 52,
  };
}
