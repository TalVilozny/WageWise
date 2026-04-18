import { useMemo } from "react";
import type { PurchaseHistoryEntry } from "./purchaseHistory";
import {
  computeSpendingPersonality,
  SPENDING_PERSONALITY_MIN_ENTRIES,
} from "./spendingPersonality";

type Props = {
  entries: PurchaseHistoryEntry[];
};

export function SpendingPersonalitySection({ entries }: Props) {
  const profile = useMemo(
    () => computeSpendingPersonality(entries),
    [entries],
  );

  if (!profile || entries.length < SPENDING_PERSONALITY_MIN_ENTRIES) {
    return null;
  }

  const v = profile.visual;
  const yesFlex = v.yesCount + v.noCount > 0 ? v.yesCount : 1;
  const noFlex = v.yesCount + v.noCount > 0 ? v.noCount : 1;
  const mostlyYes = v.yesPct >= 50;

  return (
    <section
      className="spending-personality glass-panel"
      aria-labelledby="spending-personality-heading"
    >
      <h3
        id="spending-personality-heading"
        className="spending-personality-title"
      >
        Spending Personality
      </h3>
      <p className="spending-personality-lead">
        Based on your last {entries.length} times you used this (not money
        advice — just patterns in your own numbers).
      </p>
      <p className="spending-personality-headline">{profile.headline}</p>
      <ul className="spending-personality-insights">
        {profile.insights.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="sp-personality-board" aria-label="Decision snapshot">
        <div className="sp-personality-snapshot">
          <span className="sp-personality-mix-title">Summary</span>
          <div className="sp-personality-snapshot-row">
            <div className="sp-personality-snapshot-cell">
              <span className="sp-personality-snapshot-value sp-personality-snapshot-value--count">
                {v.decisionCount}
              </span>
              <span className="sp-personality-snapshot-label">Times logged</span>
            </div>
            <div
              className="sp-personality-snapshot-divider"
              aria-hidden="true"
            />
            <div className="sp-personality-snapshot-cell">
              <p className="sp-personality-snapshot-yes-line">
                <span className="sp-personality-snapshot-pct-phrase">
                  <span
                    className={`sp-personality-snapshot-value sp-personality-snapshot-value--pct${mostlyYes ? " sp-personality-snapshot-value--mostly-yes" : " sp-personality-snapshot-value--mostly-no"}`}
                  >
                    {v.yesPct}%
                  </span>
                  <span className="sp-personality-snapshot-inline-rest">
                    {" "}
                    of your choices were Yes
                  </span>
                </span>
              </p>
              <div
                className="sp-personality-snapshot-mini-track"
                role="progressbar"
                aria-valuenow={v.yesPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Share of choices that were yes: ${v.yesPct} percent`}
              >
                <div
                  className={`sp-personality-snapshot-mini-fill${mostlyYes ? " sp-personality-snapshot-mini-fill--yes" : " sp-personality-snapshot-mini-fill--no"}`}
                  style={{ width: `${v.yesPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sp-personality-mix">
          <span className="sp-personality-mix-title">The split</span>
          <div
            className="sp-personality-mix-bar"
            role="img"
            aria-label={`${v.yesCount} yes and ${v.noCount} no`}
          >
            {v.yesCount > 0 && (
              <div
                className="sp-personality-mix-seg sp-personality-mix-seg--yes"
                style={{ flex: yesFlex }}
              >
                <span className="sp-personality-mix-seg-label">
                  <span className="sp-personality-mix-seg-num">{v.yesCount}</span>
                  <span className="sp-personality-mix-seg-word">yes</span>
                </span>
              </div>
            )}
            {v.noCount > 0 && (
              <div
                className="sp-personality-mix-seg sp-personality-mix-seg--no"
                style={{ flex: noFlex }}
              >
                <span className="sp-personality-mix-seg-label">
                  <span className="sp-personality-mix-seg-num">{v.noCount}</span>
                  <span className="sp-personality-mix-seg-word">no</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {v.headroomPct !== null && (
          <div className="sp-personality-headroom">
            <div className="sp-personality-headroom-top">
              <span className="sp-personality-headroom-title">
                Avg. room left
              </span>
              <span className="sp-personality-headroom-value">
                {v.headroomPct}%
              </span>
            </div>
            <div
              className="sp-personality-headroom-track"
              role="progressbar"
              aria-valuenow={v.headroomPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`On average, ${v.headroomPct} percent of your hour limit was still unused when you said yes`}
            >
              <div
                className="sp-personality-headroom-fill"
                style={{ width: `${v.headroomPct}%` }}
              />
            </div>
            <p className="sp-personality-headroom-hint">
              When you said yes, how much of your max hours you didn&apos;t use
              (on average).
            </p>
          </div>
        )}

        {v.followUp !== null &&
          (v.followUp.worthIt > 0 || v.followUp.regret > 0) && (
            <div className="sp-personality-follow">
              <span className="sp-personality-follow-title">
                After the purchase
              </span>
              <div
                className="sp-personality-follow-bar"
                role="img"
                aria-label={`${v.followUp.worthIt} worth it, ${v.followUp.regret} regret follow-ups`}
              >
                {v.followUp.worthIt > 0 && (
                  <div
                    className="sp-personality-follow-seg sp-personality-follow-seg--worth"
                    style={{ flex: v.followUp.worthIt }}
                  >
                    <span className="sp-personality-follow-seg-inner">
                      {v.followUp.worthIt} worth it
                    </span>
                  </div>
                )}
                {v.followUp.regret > 0 && (
                  <div
                    className="sp-personality-follow-seg sp-personality-follow-seg--regret"
                    style={{ flex: v.followUp.regret }}
                  >
                    <span className="sp-personality-follow-seg-inner">
                      {v.followUp.regret} regret
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
