import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getHoursContextInsight } from "./hoursInsights";

type CurrencyCode = "USD" | "EUR" | "ILS" | "GBP" | "JPY" | "CAD";

type VerdictRevealProps = {
  canBuy: boolean;
  reduceMotion: boolean | null;
  productPrice: number;
  currency: CurrencyCode;
  hoursForPrice: number;
  hourly: number;
  maxHours: number;
  formatMoney: (amount: number, currency: CurrencyCode) => string;
  formatHours: (h: number) => string;
  onStartOver: () => void;
};

/** Full reveal ~4.2–4.6s; reduced motion ~0.55s */
function useRevealDelays(reduceMotion: boolean | null) {
  return useMemo(() => {
    if (reduceMotion) {
      return {
        scene: 0.15,
        anticipation: 0,
        lidDelay: 0,
        lidDuration: 0,
        markFadeDelay: 0,
        markFadeDuration: 0.1,
        spotlightFade: 0.2,
        fxDelay: 100,
        confettiDuration: 0,
        headlineDelay: 0.12,
        headlineDuration: 0.2,
        detailsDelay: 0.28,
        detailsDuration: 0.18,
        buttonDelay: 0.42,
        buttonDuration: 0.15,
        lidInitialOpen: true,
        /** When to start hiding gift + FX (after full intro has played) */
        stageDismissAfterSec: 0.55,
      };
    }
    return {
      scene: 0.75,
      anticipation: 0.45,
      lidDelay: 0.52,
      lidDuration: 1.38,
      markFadeDelay: 0.75,
      markFadeDuration: 1.15,
      spotlightFade: 2.1,
      fxDelay: 1.92,
      confettiDuration: 1.5,
      headlineDelay: 2.62,
      headlineDuration: 0.72,
      detailsDelay: 3.42,
      detailsDuration: 0.5,
      buttonDelay: 4.08,
      buttonDuration: 0.42,
      lidInitialOpen: false,
      /** After longest FX (≈4.5s); brief buffer so fades finish */
      stageDismissAfterSec: 4.75,
    };
  }, [reduceMotion]);
}

function ConfettiBurst({
  reduceMotion,
  fxDelay,
  duration,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
  duration: number;
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 280,
        y: -Math.random() * 220 - 60,
        rot: Math.random() * 800 - 400,
        delay: Math.random() * 0.28,
        w: 5 + Math.random() * 6,
        h: 7 + Math.random() * 9,
        hue: Math.random() * 22,
        round: Math.random() > 0.5,
      })),
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-fx verdict-fx--confetti" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="verdict-confetti-piece"
          style={{
            width: p.w,
            height: p.h,
            background: `hsl(${p.hue} 90% 58%)`,
            borderRadius: p.round ? "50%" : "2px",
          }}
          initial={{ opacity: 0, x: 0, y: 8, rotate: 0, scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x,
            y: p.y,
            rotate: p.rot,
            scale: [0.4, 1, 0.85, 0.5],
          }}
          transition={{
            duration,
            delay: fxDelay + p.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.12, 0.55, 1],
          }}
        />
      ))}
    </div>
  );
}

function ShockwaveRings({
  reduceMotion,
  fxDelay,
  variant,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
  variant: "yes" | "no";
}) {
  if (reduceMotion || fxDelay > 50) return null;
  const yes = variant === "yes";
  return (
    <div className="verdict-shockwave-wrap" aria-hidden>
      <motion.div
        className={`verdict-shockwave ${yes ? "verdict-shockwave--yes" : "verdict-shockwave--no"}`}
        initial={{ scale: 0.32, opacity: yes ? 0.72 : 0.5 }}
        animate={{ scale: 2.35, opacity: 0 }}
        transition={{
          duration: 0.88,
          delay: fxDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      <motion.div
        className={`verdict-shockwave verdict-shockwave--echo ${yes ? "verdict-shockwave--yes" : "verdict-shockwave--no"}`}
        initial={{ scale: 0.38, opacity: yes ? 0.45 : 0.32 }}
        animate={{ scale: 2.05, opacity: 0 }}
        transition={{
          duration: 1.02,
          delay: fxDelay + 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
  );
}

function SunburstRays({
  reduceMotion,
  fxDelay,
  gradId,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
  gradId: string;
}) {
  const rays = useMemo(() => {
    const n = 16;
    return Array.from({ length: n }, (_, i) => ({
      rot: (360 / n) * i + (i % 2) * 2.5,
      len: 68 + (i % 4) * 14,
      stagger: (i % 5) * 0.018,
    }));
  }, []);

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <svg className="verdict-sunburst" viewBox="-130 -130 260 260" aria-hidden>
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="16"
          x2="0"
          y2="-120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#a54a4d" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#8e2528" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#672325" stopOpacity="0" />
        </linearGradient>
      </defs>
      {rays.map((r, i) => (
        <motion.g
          key={i}
          transform={`rotate(${r.rot})`}
          style={{ transformOrigin: "0px 0px" }}
        >
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2={-r.len}
            stroke={`url(#${gradId})`}
            strokeWidth="4.5"
            strokeLinecap="round"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: 1,
              opacity: [0, 1, 0.88, 0],
            }}
            transition={{
              scaleY: {
                duration: 0.52,
                delay: fxDelay + 0.04 + r.stagger,
                ease: [0.34, 1.25, 0.64, 1],
              },
              opacity: {
                duration: 1.35,
                delay: fxDelay + 0.04 + r.stagger,
                times: [0, 0.12, 0.55, 1],
                ease: "easeOut",
              },
            }}
            style={{ transformOrigin: "0px 0px" }}
          />
        </motion.g>
      ))}
    </svg>
  );
}

function RisingGlowOrbs({
  reduceMotion,
  fxDelay,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
}) {
  const orbs = useMemo(
    () => [
      {
        x: -76,
        drift: -1.1,
        c1: "rgba(255, 255, 255, 0.85)",
        c2: "rgba(165, 74, 77, 0.2)",
        size: 28,
      },
      {
        x: -28,
        drift: 0.4,
        c1: "rgba(165, 74, 77, 0.9)",
        c2: "rgba(142, 37, 40, 0.15)",
        size: 36,
      },
      {
        x: 22,
        drift: -0.6,
        c1: "rgba(142, 37, 40, 0.88)",
        c2: "rgba(103, 35, 37, 0.12)",
        size: 32,
      },
      {
        x: 68,
        drift: 0.9,
        c1: "rgba(165, 74, 77, 0.82)",
        c2: "rgba(103, 35, 37, 0.1)",
        size: 30,
      },
      {
        x: 0,
        drift: 0.15,
        c1: "rgba(255, 255, 255, 0.55)",
        c2: "rgba(142, 37, 40, 0.12)",
        size: 40,
      },
      {
        x: -52,
        drift: 0.7,
        c1: "rgba(255, 255, 255, 0.72)",
        c2: "rgba(165, 74, 77, 0.1)",
        size: 24,
      },
      {
        x: 48,
        drift: -0.85,
        c1: "rgba(165, 74, 77, 0.78)",
        c2: "rgba(103, 35, 37, 0.1)",
        size: 26,
      },
    ],
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-orbs" aria-hidden>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="verdict-orb"
          style={{
            left: `calc(50% + ${o.x}px)`,
            width: o.size,
            height: o.size,
            marginLeft: -o.size / 2,
            background: `radial-gradient(circle at 35% 35%, ${o.c1}, ${o.c2} 55%, transparent 72%)`,
          }}
          initial={{ y: 8, opacity: 0, scale: 0.25, filter: "blur(0px)" }}
          animate={{
            y: [-8, -52, -110, -168],
            opacity: [0, 0.95, 0.65, 0],
            scale: [0.25, 1.05, 1.15, 0.85],
            x: [0, o.drift * 18, o.drift * 32, o.drift * 42],
          }}
          transition={{
            duration: 1.85,
            delay: fxDelay + 0.12 + i * 0.055,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.25, 0.62, 1],
          }}
        />
      ))}
    </div>
  );
}

function SparkShards({
  reduceMotion,
  fxDelay,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
}) {
  const shards = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.2;
        const dist = 52 + Math.random() * 48;
        return {
          id: i,
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist - 20,
          rot: (Math.random() - 0.5) * 140,
          delay: Math.random() * 0.12,
        };
      }),
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-fx verdict-fx--shards" aria-hidden>
      {shards.map((s) => (
        <motion.div
          key={s.id}
          className="verdict-spark-shard"
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.2 }}
          animate={{
            opacity: [0, 1, 0.9, 0],
            x: s.x,
            y: s.y,
            rotate: s.rot,
            scale: [0.2, 1, 0.85, 0.4],
          }}
          transition={{
            duration: 1.15,
            delay: fxDelay + 0.08 + s.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.15, 0.55, 1],
          }}
        />
      ))}
    </div>
  );
}

function SmokeWisps({
  reduceMotion,
  fxDelay,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
}) {
  const wisps = useMemo(
    () => [
      { x: -18, scale: 1.1, dur: 1.75 },
      { x: 2, scale: 1.35, dur: 1.9 },
      { x: 22, scale: 1.05, dur: 1.65 },
      { x: -8, scale: 1.5, dur: 2.0 },
    ],
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-smoke-layer" aria-hidden>
      {wisps.map((w, i) => (
        <motion.div
          key={i}
          className="verdict-smoke-wisp"
          style={{ left: `calc(50% + ${w.x}px)` }}
          initial={{ scale: 0.25, opacity: 0, y: 6 }}
          animate={{
            scale: [0.25, w.scale * 0.85, w.scale * 1.35],
            opacity: [0, 0.5, 0.35, 0],
            y: [6, -18, -38, -52],
            x: [0, (i % 2 === 0 ? 1 : -1) * 12, (i % 2 === 0 ? 1 : -1) * 22],
          }}
          transition={{
            duration: w.dur,
            delay: fxDelay + i * 0.1,
            ease: [0.33, 0.53, 0.28, 0.92],
            times: [0, 0.2, 0.55, 1],
          }}
        />
      ))}
    </div>
  );
}

function FallingAsh({
  reduceMotion,
  fxDelay,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
}) {
  const specs = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.45,
        startX: (Math.random() - 0.5) * 36,
        drift: (Math.random() - 0.5) * 72,
        fall: 72 + Math.random() * 56,
        dur: 1.35 + Math.random() * 0.75,
        w: 2 + Math.random() * 2.5,
        h: 3 + Math.random() * 4,
        rotEnd: (Math.random() - 0.5) * 50,
      })),
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-fx verdict-fx--ash" aria-hidden>
      {specs.map((s) => (
        <motion.div
          key={s.id}
          className="verdict-ash-spec"
          style={{ width: s.w, height: s.h }}
          initial={{ opacity: 0, x: s.startX, y: -4, rotate: 0 }}
          animate={{
            opacity: [0, 0.75, 0.55, 0],
            x: s.startX + s.drift,
            y: s.fall,
            rotate: [0, s.rotEnd],
          }}
          transition={{
            duration: s.dur,
            delay: fxDelay + s.delay,
            ease: [0.45, 0, 0.75, 1],
            times: [0, 0.12, 0.5, 1],
          }}
        />
      ))}
    </div>
  );
}

function TurbulentDust({
  reduceMotion,
  fxDelay,
}: {
  reduceMotion: boolean | null;
  fxDelay: number;
}) {
  const motes = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.38,
        path: [
          [0, 0],
          [(Math.random() - 0.5) * 50, -18 + Math.random() * -25],
          [(Math.random() - 0.5) * 110, 12 + Math.random() * 45],
          [(Math.random() - 0.5) * 180, 28 + Math.random() * 55],
        ] as const,
        s: 0.4 + Math.random() * 0.65,
      })),
    [],
  );

  if (reduceMotion || fxDelay > 50) return null;

  return (
    <div className="verdict-fx verdict-fx--dust" aria-hidden>
      {motes.map((p) => (
        <motion.span
          key={p.id}
          className="verdict-dust-mote"
          style={{ width: p.s * 9, height: p.s * 9 }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.85, 0.6, 0],
            x: [p.path[0][0], p.path[1][0], p.path[2][0], p.path[3][0]],
            y: [p.path[0][1], p.path[1][1], p.path[2][1], p.path[3][1]],
            scale: [0.4, 1, 0.85, 0.2],
          }}
          transition={{
            duration: 1.72,
            delay: fxDelay + p.delay,
            ease: [0.33, 0.65, 0.28, 0.95],
            times: [0, 0.22, 0.58, 1],
          }}
        />
      ))}
    </div>
  );
}

export function VerdictReveal({
  canBuy,
  reduceMotion,
  productPrice,
  currency,
  hoursForPrice,
  hourly,
  maxHours,
  formatMoney,
  formatHours,
  onStartOver,
}: VerdictRevealProps) {
  const d = useRevealDelays(reduceMotion);
  const sunburstGradId = `vr-sun-${useId().replace(/:/g, "")}`;
  const hoursContextInsight = useMemo(
    () => getHoursContextInsight(hoursForPrice, productPrice),
    [hoursForPrice, productPrice],
  );
  /** Gift box + FX + vignette; headline, details, and Start over remain. */
  const [showRevealVisuals, setShowRevealVisuals] = useState(true);

  useEffect(() => {
    setShowRevealVisuals(true);
    const ms = Math.round(d.stageDismissAfterSec * 1000);
    const id = window.setTimeout(() => setShowRevealVisuals(false), ms);
    return () => window.clearTimeout(id);
  }, [d.stageDismissAfterSec, canBuy, reduceMotion]);

  const lidTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: d.lidDuration,
        delay: d.lidDelay,
        ease: [0.19, 0.69, 0.2, 1] as const,
      };

  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.div
      className={`verdict-reveal-root ${canBuy ? "verdict-reveal-root--yes" : "verdict-reveal-root--no"}${showRevealVisuals ? "" : " verdict-reveal-root--post-visuals"}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <AnimatePresence>
        {showRevealVisuals && (
          <motion.div
            key="reveal-visuals"
            className="verdict-reveal-visuals"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.38, ease: easeOut }}
          >
            {!reduceMotion && (
              <motion.div
                className="verdict-reveal-vignette"
                aria-hidden
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0.12 }}
                transition={{ duration: 1.9, delay: 0.15, ease: easeOut }}
              />
            )}

            <div className="verdict-reveal-stage">
              {canBuy ? (
                <>
                  <ShockwaveRings
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                    variant="yes"
                  />
                  <SunburstRays
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                    gradId={sunburstGradId}
                  />
                  <SparkShards
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                  />
                  <RisingGlowOrbs
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                  />
                  <ConfettiBurst
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                    duration={d.confettiDuration}
                  />
                </>
              ) : (
                <>
                  <ShockwaveRings
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                    variant="no"
                  />
                  <SmokeWisps reduceMotion={reduceMotion} fxDelay={d.fxDelay} />
                  <TurbulentDust
                    reduceMotion={reduceMotion}
                    fxDelay={d.fxDelay}
                  />
                  <FallingAsh reduceMotion={reduceMotion} fxDelay={d.fxDelay} />
                </>
              )}

              <motion.div
                className="verdict-reveal-spotlight"
                aria-hidden
                initial={{ opacity: 0.55, scale: 0.65 }}
                animate={{ opacity: 0, scale: 1.35 }}
                transition={{
                  duration: reduceMotion ? 0 : 2.2,
                  delay: reduceMotion ? 0 : 0.2,
                  ease: easeOut,
                }}
              />

              <motion.div
                className="verdict-gift-scene"
                initial={
                  reduceMotion
                    ? { opacity: 1, scale: 1, y: 0, rotateZ: 0 }
                    : {
                        opacity: 0,
                        scale: 0.72,
                        y: 28,
                        rotateZ: -4,
                        filter: "blur(10px)",
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotateZ: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: d.scene,
                  ease: easeOut,
                }}
              >
                {!reduceMotion && (
                  <motion.div
                    className="verdict-gift-anticipation"
                    aria-hidden
                    animate={{ y: [0, -5, 0, -3, 0] }}
                    transition={{
                      duration: d.anticipation,
                      delay: 0.2,
                      ease: "easeInOut",
                      times: [0, 0.25, 0.5, 0.75, 1],
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{ position: "relative", width: 132, height: 118 }}
                    >
                      <div className="verdict-gift-lid-outer">
                        <motion.div
                          className="verdict-gift-lid"
                          initial={{ rotateX: d.lidInitialOpen ? -102 : 0 }}
                          animate={{ rotateX: -102 }}
                          transition={lidTransition}
                          style={{
                            transformOrigin: "50% 100%",
                            transformPerspective: 560,
                          }}
                        />
                      </div>
                      <motion.div
                        className="verdict-gift-body"
                        initial={{
                          boxShadow:
                            "0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                        }}
                        animate={
                          canBuy
                            ? {
                                boxShadow: [
                                  "0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                                  "0 8px 40px rgba(165,74,77,0.45), 0 0 48px rgba(142,37,40,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                                  "0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                                ],
                              }
                            : {
                                boxShadow: [
                                  "0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                                  "0 8px 36px rgba(120,113,108,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
                                  "0 12px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                                ],
                              }
                        }
                        transition={{
                          duration: reduceMotion ? 0 : 1.6,
                          delay: reduceMotion ? 0 : 0.5,
                          ease: easeOut,
                          times: [0, 0.45, 1],
                        }}
                      >
                        <motion.span
                          className="verdict-gift-mark"
                          aria-hidden
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{ opacity: 0, scale: 0.6 }}
                          transition={{
                            duration: d.markFadeDuration,
                            delay: d.markFadeDelay,
                            ease: easeOut,
                          }}
                        >
                          ?
                        </motion.span>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {reduceMotion && (
                  <div className="verdict-gift-inner-static">
                    <div className="verdict-gift-lid-outer">
                      <motion.div
                        className="verdict-gift-lid"
                        initial={{ rotateX: -102 }}
                        animate={{ rotateX: -102 }}
                        transition={{ duration: 0 }}
                        style={{
                          transformOrigin: "50% 100%",
                          transformPerspective: 560,
                        }}
                      />
                    </div>
                    <div className="verdict-gift-body">
                      <span
                        className="verdict-gift-mark verdict-gift-mark--muted"
                        aria-hidden
                      >
                        ?
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h3
        className="verdict-reveal-headline"
        initial={{ opacity: 0, y: 28, scale: 0.92, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{
          delay: d.headlineDelay,
          duration: d.headlineDuration,
          ease: easeOut,
        }}
      >
        {canBuy
          ? "You can buy it!"
          : "It's too expensive - you sadly cannot buy it."}
      </motion.h3>

      <motion.div
        className={`verdict verdict-reveal-details ${canBuy ? "verdict-yes" : "verdict-no"}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: d.detailsDelay,
          duration: d.detailsDuration,
          ease: easeOut,
        }}
      >
        <motion.p
          className="verdict-price"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: d.detailsDelay + (reduceMotion ? 0 : 0.08),
            duration: reduceMotion ? d.detailsDuration : 0.42,
            ease: easeOut,
          }}
        >
          This item is <strong>{formatMoney(productPrice, currency)}</strong>
        </motion.p>
        <motion.p
          className="verdict-hours"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: d.detailsDelay + (reduceMotion ? 0.04 : 0.2),
            duration: reduceMotion ? d.detailsDuration : 0.42,
            ease: easeOut,
          }}
        >
          That&apos;s about <strong>{formatHours(hoursForPrice)}</strong> at{" "}
          <strong>{formatMoney(hourly, currency)}/hr</strong>.
        </motion.p>
        {hoursContextInsight != null && (
          <motion.p
            className="verdict-insight"
            role="note"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: d.detailsDelay + (reduceMotion ? 0 : 0.14),
              duration: reduceMotion ? d.detailsDuration : 0.38,
              ease: easeOut,
            }}
          >
            {hoursContextInsight}
          </motion.p>
        )}
        {canBuy ? (
          <motion.p
            className="verdict-line yes"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: d.detailsDelay + (reduceMotion ? 0.08 : 0.34),
              duration: reduceMotion ? d.detailsDuration : 0.42,
              ease: easeOut,
            }}
          >
            You said you&apos;d buy if it stayed under{" "}
            <strong>
              {maxHours} {maxHours === 1 ? "hour" : "hours"}
            </strong>{" "}
            of work — so go ahead, enjoy it (responsibly).
          </motion.p>
        ) : (
          <motion.p
            className="verdict-line no"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: d.detailsDelay + (reduceMotion ? 0.08 : 0.34),
              duration: reduceMotion ? d.detailsDuration : 0.42,
              ease: easeOut,
            }}
          >
            You drew the line at{" "}
            <strong>
              {maxHours} {maxHours === 1 ? "hour" : "hours"}
            </strong>{" "}
            of work - this one asks for more. Worth another look?
          </motion.p>
        )}
      </motion.div>

      <motion.div
        className="verdict-reveal-actions"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: d.buttonDelay,
          duration: d.buttonDuration,
          ease: easeOut,
        }}
      >
        <button type="button" className="btn-ghost" onClick={onStartOver}>
          Start over
        </button>
      </motion.div>
    </motion.div>
  );
}
