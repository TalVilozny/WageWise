import type { PurchaseHistoryEntry } from "./purchaseHistory";
import { sumHoursCostThisMonth } from "./purchaseHistory";

/** Minimum logged verdicts before we show Spending Personality. */
export const SPENDING_PERSONALITY_MIN_ENTRIES = 5;

/** Numbers for the visual “snapshot” (charts / meters in the UI). */
export type SpendingPersonalityVisual = {
  decisionCount: number;
  yesCount: number;
  noCount: number;
  /** 0–100 */
  yesPct: number;
  /** 0–100 or null if no yes verdicts with headroom */
  headroomPct: number | null;
  /** Split of follow-up answers; null if none yet */
  followUp: { worthIt: number; regret: number } | null;
};

export type SpendingPersonality = {
  headline: string;
  insights: string[];
  visual: SpendingPersonalityVisual;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Derives a short profile from purchase history: verdict mix, hour margins,
 * follow-up regret, and how far “no” decisions sit past the user’s line.
 */
export function computeSpendingPersonality(
  entries: PurchaseHistoryEntry[],
): SpendingPersonality | null {
  const n = entries.length;
  if (n < SPENDING_PERSONALITY_MIN_ENTRIES) return null;

  const yesEntries = entries.filter((e) => e.verdictYes);
  const noEntries = entries.filter((e) => !e.verdictYes);
  const yesCount = yesEntries.length;
  const yesRate = yesCount / n;

  let headline: string;
  if (yesRate <= 0.34) {
    headline =
      "You usually say no — you’re picky about what’s worth your time.";
  } else if (yesRate >= 0.66) {
    headline =
      "You usually say yes when the price fits the hours you’re OK with.";
  } else {
    headline = "So far you’ve said yes and no about as often as each other.";
  }

  const utilOnYes = yesEntries
    .filter((e) => e.allowedHours > 0)
    .map((e) => e.hoursCost / e.allowedHours);

  const slackOnYes = yesEntries
    .filter((e) => e.allowedHours > 0)
    .map((e) => (e.allowedHours - e.hoursCost) / e.allowedHours);

  const generosityOnYes = yesEntries
    .filter((e) => e.hoursCost > 0)
    .map((e) => e.allowedHours / e.hoursCost);

  const overshootOnNo = noEntries
    .filter((e) => e.allowedHours > 0)
    .map((e) => e.hoursCost / e.allowedHours);

  const meanUtil = utilOnYes.length ? mean(utilOnYes) : null;
  const meanSlack = slackOnYes.length ? mean(slackOnYes) : null;
  const meanGenerosity = generosityOnYes.length ? mean(generosityOnYes) : null;
  const meanOvershoot = overshootOnNo.length ? mean(overshootOnNo) : null;

  const yesWithFollowUp = yesEntries.filter((e) => e.worthIt !== null);
  const regretCount = yesWithFollowUp.filter((e) => e.worthIt === false).length;
  const worthCount = yesWithFollowUp.filter((e) => e.worthIt === true).length;
  const followUpAnswered = regretCount + worthCount;
  const regretRate =
    followUpAnswered > 0 ? regretCount / followUpAnswered : null;

  const monthHours = sumHoursCostThisMonth(entries);
  const insights: string[] = [];

  if (
    followUpAnswered >= 3 &&
    regretRate !== null &&
    regretRate >= 0.38
  ) {
    insights.push(
      "When you checked back later, several buys felt like a mistake — quick fixes don’t always feel good later.",
    );
  } else if (
    followUpAnswered >= 3 &&
    regretRate !== null &&
    regretRate <= 0.18
  ) {
    insights.push(
      "When you checked back later, most “yes” buys still felt worth it.",
    );
  }

  if (yesEntries.length >= 2 && meanUtil !== null && meanUtil >= 0.86) {
    insights.push(
      "When you buy, the hours it costs are often almost as high as the max you allowed.",
    );
  } else if (yesEntries.length >= 2 && meanSlack !== null && meanSlack >= 0.48) {
    insights.push(
      "When you buy, there’s usually a big gap between the hours it costs and the max you set.",
    );
  }

  if (yesEntries.length >= 2 && meanGenerosity !== null && meanGenerosity >= 2.35) {
    insights.push(
      "You often allow way more hours than the price really needs — you’re not squeezing yourself.",
    );
  }

  if (noEntries.length >= 2 && meanOvershoot !== null && meanOvershoot >= 1.22) {
    insights.push(
      "When you say no, the cost is usually far above your limit — a clear “no.”",
    );
  } else if (
    noEntries.length >= 2 &&
    meanOvershoot !== null &&
    meanOvershoot <= 1.07
  ) {
    insights.push(
      "When you say no, you’re often just a little over your limit — a small change could flip it.",
    );
  }

  if (monthHours >= 10 && n >= SPENDING_PERSONALITY_MIN_ENTRIES) {
    insights.push(
      "This month, the hours you logged for purchases add up to a lot of work time.",
    );
  }

  const deduped: string[] = [];
  for (const line of insights) {
    if (!deduped.includes(line)) deduped.push(line);
  }

  const fillers = [
    "You’re OK saying no when the hours don’t feel fair.",
    "You’re OK saying yes when the cost stays inside what you allowed.",
    "Writing it in hours makes it easier to compare than a vague “should I?”",
  ];
  for (const f of fillers) {
    if (deduped.length >= 2) break;
    if (!deduped.includes(f)) deduped.push(f);
  }

  const insightsFinal = deduped.slice(0, 5);

  const yesPctRounded = Math.round(yesRate * 100);
  const headroomPct =
    meanSlack !== null && yesEntries.length > 0
      ? Math.round(meanSlack * 100)
      : null;

  const visual: SpendingPersonalityVisual = {
    decisionCount: n,
    yesCount,
    noCount: n - yesCount,
    yesPct: yesPctRounded,
    headroomPct,
    followUp:
      followUpAnswered > 0
        ? { worthIt: worthCount, regret: regretCount }
        : null,
  };

  return { headline, insights: insightsFinal, visual };
}
