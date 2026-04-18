/** Shared anchors for reframing “price → time” without extra user inputs. */
export const STANDARD_WORK_WEEK_H = 40;
export const STANDARD_WORKDAY_H = 8;
const GYM_SESSION_H = 1;
const NETFLIX_EP_H = 0.75; // ~45 min
const FEATURE_FILM_H = 2;
const SLEEP_NIGHT_H = 8;
const LUNCH_BREAK_H = 0.5;
const GAME_SESSION_H = 1.5;
const PODCAST_EP_H = 40 / 60;
const READ_BLOCK_H = 0.5;
const MEDITATION_H = 0.25;
const KID_ROUTINE_H = 20 / 60;
const MORNING_BLOCK_H = 0.5;
const ERRAND_RUN_H = 1.5;
const HOBBY_BLOCK_H = 2;
const DEEP_CLEAN_H = 4;
const RUN_BLOCK_H = 0.5;
const MONTH_WORK_H = (STANDARD_WORK_WEEK_H * 52) / 12;

export type InsightDef = {
  category: string;
  applies: (h: number) => boolean;
  text: (h: number) => string;
};

/** Large pool: only a varied subset is shown per verdict (see picker below). */
export const HOURS_INSIGHT_POOL: readonly InsightDef[] = [
  {
    category: "workday",
    applies: (h) => h / STANDARD_WORKDAY_H >= 0.65,
    text: (h) => {
      const r = h / STANDARD_WORKDAY_H;
      if (r < 1) return "This is almost a full workday.";
      if (r < 1.25) return "This is about a full workday.";
      return "This is more than a full workday.";
    },
  },
  {
    category: "week_pct",
    applies: (h) => (h / STANDARD_WORK_WEEK_H) * 100 >= 1,
    text: (h) => {
      const pct = (h / STANDARD_WORK_WEEK_H) * 100;
      if (pct >= 100) return "This is a full work week or more of your time.";
      return `This is about ${Math.max(1, Math.round(pct))}% of your weekly work time.`;
    },
  },
  {
    category: "month_pct",
    applies: (h) => (h / MONTH_WORK_H) * 100 >= 3,
    text: (h) =>
      `That's roughly ${Math.max(1, Math.round((h / MONTH_WORK_H) * 100))}% of a typical work month.`,
  },
  {
    category: "gym",
    applies: (h) => h >= 0.5,
    text: (h) => {
      const n = Math.max(1, Math.round(h / GYM_SESSION_H));
      if (n === 1) return "This equals about one gym session worth of time.";
      if (n <= 20)
        return `This equals about ${n} gym sessions worth of time.`;
      return "This equals many gym sessions worth of time — well over twenty hours at one hour each.";
    },
  },
  {
    category: "streaming",
    applies: (h) => h >= NETFLIX_EP_H,
    text: (h) => {
      const eps = Math.max(1, Math.round(h / NETFLIX_EP_H));
      return `About ${eps} episode${eps === 1 ? "" : "s"} of a show (~${Math.round(NETFLIX_EP_H * 60)} min each).`;
    },
  },
  {
    category: "movies",
    applies: (h) => h >= 1.25,
    text: (h) => {
      const m = Math.max(1, Math.round(h / FEATURE_FILM_H));
      return m === 1
        ? "Roughly one feature film — end to end, credits included."
        : `About ${m} feature films worth of sitting still.`;
    },
  },
  {
    category: "sleep",
    applies: (h) => h / SLEEP_NIGHT_H >= 0.2,
    text: (h) =>
      `About ${Math.max(5, Math.round((h / SLEEP_NIGHT_H) * 100))}% of a full night's sleep (${SLEEP_NIGHT_H} h).`,
  },
  {
    category: "lunch",
    applies: (h) => h >= LUNCH_BREAK_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / LUNCH_BREAK_H));
      return `About ${n} half-hour lunch break${n === 1 ? "" : "s"} you can't double-book.`;
    },
  },
  {
    category: "weekend",
    applies: (h) => h >= 2.5 && h < 12,
    text: (h) =>
      h < 5
        ? "Enough focused time to lose a big chunk of a weekend afternoon."
        : "More than most people get in a full weekend day for hobbies.",
  },
  {
    category: "runs",
    applies: (h) => h >= RUN_BLOCK_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / RUN_BLOCK_H));
      return `About ${n} half-hour run${n === 1 ? "" : "s"} or brisk walks — if you actually had the energy after work.`;
    },
  },
  {
    category: "chores",
    applies: (h) => h >= 2,
    text: (h) => {
      const blocks = Math.max(1, Math.round(h / DEEP_CLEAN_H));
      return blocks === 1
        ? "A serious “whole house” chore block — not a quick tidy."
        : `${blocks} big chore afternoons you could spend on life admin instead.`;
    },
  },
  {
    category: "gaming",
    applies: (h) => h >= 1,
    text: (h) => {
      const s = Math.max(1, Math.round(h / GAME_SESSION_H));
      return `About ${s} solid gaming session${s === 1 ? "" : "s"} — the kind where you lose track of time.`;
    },
  },
  {
    category: "podcast",
    applies: (h) => h >= PODCAST_EP_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / PODCAST_EP_H));
      return `Stack of ~${n} podcast episode${n === 1 ? "" : "s"} at ${Math.round(PODCAST_EP_H * 60)} minutes each.`;
    },
  },
  {
    category: "reading",
    applies: (h) => h >= READ_BLOCK_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / READ_BLOCK_H));
      return `Enough quiet time for ${n} focused reading block${n === 1 ? "" : "s"} — chapters add up fast.`;
    },
  },
  {
    category: "meditation",
    applies: (h) => h >= MEDITATION_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / MEDITATION_H));
      return `${n} short mindfulness session${n === 1 ? "" : "s"} you kept meaning to start — ${Math.round(MEDITATION_H * 60)} min each.`;
    },
  },
  {
    category: "family",
    applies: (h) => h >= KID_ROUTINE_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / KID_ROUTINE_H));
      return `About ${n} unhurried bedtime-routine night${n === 1 ? "" : "s"} with the people you care about.`;
    },
  },
  {
    category: "morning",
    applies: (h) => h >= MORNING_BLOCK_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / MORNING_BLOCK_H));
      return `${n} slow morning${n === 1 ? "" : "s"} — coffee, daylight, no rush — traded in one shot.`;
    },
  },
  {
    category: "errands",
    applies: (h) => h >= ERRAND_RUN_H * 0.75,
    text: (h) => {
      const n = Math.max(1, Math.round(h / ERRAND_RUN_H));
      return `Roughly ${n} “I'll just run out” errand loop${n === 1 ? "" : "s"} — parking, queues, detours.`;
    },
  },
  {
    category: "hobby",
    applies: (h) => h >= HOBBY_BLOCK_H,
    text: (h) => {
      const n = Math.max(1, Math.round(h / HOBBY_BLOCK_H));
      return `${n} evening${n === 1 ? "" : "s"} on a side project or hobby — the kind that never feels “spare.”`;
    },
  },
  {
    category: "commute",
    applies: (h) => h >= 3,
    text: () =>
      "Stack a few rush-hour commutes in your head — this is that kind of cumulative drain.",
  },
  {
    category: "movement",
    applies: (h) => h >= 2.5,
    text: () =>
      "Longer than the well-known “150 minutes a week to move” bar — if you traded time minute for minute.",
  },
  {
    category: "reflect_irreversible",
    applies: (h) => h >= 0.75,
    text: () =>
      "Real hours, not a coupon — once they're gone, no checkout undo.",
  },
  {
    category: "reflect_tomorrow",
    applies: (h) => h >= 1,
    text: () =>
      "Imagine earning this again tomorrow morning — does it still feel obvious?",
  },
  {
    category: "reflect_opportunity",
    applies: (h) => h >= 2,
    text: () =>
      "That's energy you won't also spend on rest, people, or something you've been putting off.",
  },
  {
    category: "reflect_small_hours",
    applies: (h) => h < 2 && h >= 0.5,
    text: () =>
      "Small hours add the same way small subscriptions do — invisible until you line them up.",
  },
  {
    category: "season_binge",
    applies: (h) => h >= 7,
    text: (h) =>
      h < 14
        ? "Enough couch time to burn through a chunky TV season — not a single episode."
        : "Enough screen time to make you wince if you wrote it in a calendar.",
  },
  {
    category: "travel_wait",
    applies: (h) => h >= 2.5,
    text: () =>
      "Like losing an afternoon to delays — except you chose this queue.",
  },
  {
    category: "skill_practice",
    applies: (h) => h >= 1.5,
    text: (h) => {
      const n = Math.round(h * 2) / 2;
      return `About ${n} hour${n === 1 ? "" : "s"} of deliberate practice on something that compounds — if you protected them.`;
    },
  },
  {
    category: "social",
    applies: (h) => h >= 1.25,
    text: (h) => {
      const dinners = Math.max(1, Math.round(h / 2));
      return dinners === 1
        ? "One unhurried dinner with someone you like — phones down — gone in one swipe."
        : `About ${dinners} long dinners where you're actually present — not half-listening.`;
    },
  },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One reframing line from the pool (one per category in the candidate set),
 * chosen deterministically from hours + price so repeats feel stable.
 */
export function getHoursContextInsight(
  hours: number,
  priceHint: number = 0,
): string | null {
  if (!Number.isFinite(hours) || hours <= 0) return null;

  const applicable = HOURS_INSIGHT_POOL.filter((d) => d.applies(hours)).map(
    (d) => ({ category: d.category, line: d.text(hours) }),
  );

  const seen = new Set<string>();
  const byCategory: { category: string; line: string }[] = [];
  for (const row of applicable) {
    if (seen.has(row.category)) continue;
    seen.add(row.category);
    byCategory.push(row);
  }

  if (byCategory.length === 0) return null;

  const seed =
    Math.floor(hours * 73856093) ^
    Math.floor((Number.isFinite(priceHint) ? priceHint : 0) * 19349663) ^
    0x9e3779b9;

  const shuffled = seededShuffle(byCategory, seed >>> 0);
  return shuffled[0]?.line ?? null;
}
