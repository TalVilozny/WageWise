import { useMemo } from "react";
import type { CurrencyCode, PurchaseHistoryEntry } from "./purchaseHistory";
import {
  REGRET_GRAPH_MIN_ANSWERS,
  REGRET_PROMPT_AFTER_MS,
  sumHoursCostThisMonth,
} from "./purchaseHistory";

type Props = {
  entries: PurchaseHistoryEntry[];
  formatMoney: (amount: number, currency: CurrencyCode) => string;
  formatHours: (h: number) => string;
  onRegretAnswer: (id: string, worthIt: boolean) => void;
};

function formatMonthLifeHours(h: number): string {
  if (h <= 0) return "0";
  if (h < 0.05) return h.toFixed(2);
  if (h < 10) return h.toFixed(1);
  return h.toFixed(1);
}

function formatDecidedAt(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function regretCounts(entries: PurchaseHistoryEntry[]) {
  let worthIt = 0;
  let regret = 0;
  for (const e of entries) {
    if (e.worthIt === true) worthIt += 1;
    else if (e.worthIt === false) regret += 1;
  }
  return { worthIt, regret, answered: worthIt + regret };
}

function RegretTrackerGraph({ entries }: { entries: PurchaseHistoryEntry[] }) {
  const { worthIt, regret, answered } = useMemo(
    () => regretCounts(entries),
    [entries],
  );

  if (answered < REGRET_GRAPH_MIN_ANSWERS) return null;

  const worthPct = answered ? Math.round((worthIt / answered) * 1000) / 10 : 0;
  const regretPct = answered ? Math.round((regret / answered) * 1000) / 10 : 0;

  const ariaLabel = `${worthIt} of ${answered} follow-ups worth it (${worthPct} percent), ${regret} regret (${regretPct} percent).`;

  const worthPctRounded = Math.round(worthPct);
  const regretPctRounded = Math.round(regretPct);

  return (
    <div
      className="regret-tracker glass-panel"
      aria-labelledby="regret-tracker-heading"
    >
      <h3 id="regret-tracker-heading" className="regret-tracker-title">
        Regret Tracker
      </h3>
      <p className="regret-tracker-lead">
        After a few days, you said how purchases felt. Here&apos;s the split so
        far.
      </p>

      <div className="regret-bar-track" aria-label={ariaLabel}>
        {worthIt > 0 && (
          <div
            className="regret-bar-seg regret-bar-seg--worth"
            style={{ flex: `${worthIt} 1 0%` }}
          >
            <span className="regret-bar-seg-label">
              {worthPctRounded}% Worth it
            </span>
          </div>
        )}
        {regret > 0 && (
          <div
            className="regret-bar-seg regret-bar-seg--regret"
            style={{ flex: `${regret} 1 0%` }}
          >
            <span className="regret-bar-seg-label">
              {regretPctRounded}% Regret
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PurchaseHistorySection({
  entries,
  formatMoney,
  formatHours,
  onRegretAnswer,
}: Props) {
  const monthHours = useMemo(
    () => sumHoursCostThisMonth(entries),
    [entries],
  );

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.decidedAt - a.decidedAt),
    [entries],
  );

  const now = Date.now();

  return (
    <>
      <section
        className="history-section glass-panel"
        aria-labelledby="purchase-history-heading"
      >
        <h2 id="purchase-history-heading" className="history-section-title">
          Purchase History (in Hours)
        </h2>
        <p className="history-section-lead">
          A timeline of what you&apos;ve run through the sliders.
        </p>

        {sorted.length === 0 ? (
          <p className="history-empty">
            No decisions yet — finish a verdict above to log your first one.
          </p>
        ) : (
          <>
            <ol className="history-timeline">
              {sorted.map((e) => {
                const showRegretPrompt =
                  now - e.decidedAt >= REGRET_PROMPT_AFTER_MS;
                return (
                  <li key={e.id} className="history-item">
                    <span className="history-dot" aria-hidden />
                    <div className="history-card">
                      <div className="history-card-head">
                        <time
                          className="history-date"
                          dateTime={new Date(e.decidedAt).toISOString()}
                        >
                          {formatDecidedAt(e.decidedAt)}
                        </time>
                        {showRegretPrompt && (
                          <div className="history-regret">
                            <p
                              className="history-regret-q"
                              id={`regret-q-${e.id}`}
                            >
                              Was it worth it?
                            </p>
                            {e.worthIt === null ? (
                              <div
                                className="history-regret-actions"
                                role="group"
                                aria-labelledby={`regret-q-${e.id}`}
                              >
                                <button
                                  type="button"
                                  className="btn-regret btn-regret--yes"
                                  onClick={() => onRegretAnswer(e.id, true)}
                                >
                                  Worth it
                                </button>
                                <button
                                  type="button"
                                  className="btn-regret btn-regret--no"
                                  onClick={() => onRegretAnswer(e.id, false)}
                                >
                                  Not really
                                </button>
                              </div>
                            ) : (
                              <p
                                className={`history-regret-answered history-regret-answered--${e.worthIt ? "yes" : "no"}`}
                              >
                                You said:{" "}
                                <strong>
                                  {e.worthIt ? "Worth it" : "Regret"}
                                </strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <dl className="history-facts">
                        <div className="history-fact">
                          <dt>Price</dt>
                          <dd>{formatMoney(e.price, e.currency)}</dd>
                        </div>
                        <div className="history-fact">
                          <dt>Hours cost</dt>
                          <dd>{formatHours(e.hoursCost)}</dd>
                        </div>
                        <div className="history-fact">
                          <dt>Allowed hours</dt>
                          <dd>
                            {e.allowedHours}{" "}
                            {e.allowedHours === 1 ? "hour" : "hours"}
                          </dd>
                        </div>
                        <div className="history-fact">
                          <dt>Verdict</dt>
                          <dd>
                            <span
                              className={`history-verdict history-verdict--${e.verdictYes ? "yes" : "no"}`}
                            >
                              {e.verdictYes ? "Yes" : "No"}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="history-month-total" role="status">
              You spent {formatMonthLifeHours(monthHours)} hours of your life
              this month.
            </p>
          </>
        )}
      </section>

      {sorted.length > 0 && <RegretTrackerGraph entries={entries} />}
    </>
  );
}
