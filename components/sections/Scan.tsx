"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import { resultsFor } from "@/lib/plans";
import { STAGE, useStore } from "@/lib/store";
import { Section } from "./Section";

const TOTAL = 4500;
const STATUS = ["status0", "status1", "status2", "status3", "status4"] as const;

/** The official "Assured Saving Agent — Live" step. About 4.5 s; a fallback timer always finishes it. */
export function ScanSection() {
  const { s, dispatch, t, goNext } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    const start = performance.now();
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      dispatch({ type: "patch", patch: { scanDone: true } });
      goNext(STAGE.scan);
    };
    const id = window.setInterval(() => {
      const e = performance.now() - start;
      setElapsed(e);
      if (e >= TOTAL) finish();
    }, 100);
    const fallback = window.setTimeout(finish, TOTAL + 1500);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fallback);
    };
  }, [dispatch, goNext]);

  const pct = Math.min(100, Math.round((elapsed / TOTAL) * 100));
  const idx = Math.min(STATUS.length - 1, Math.floor((elapsed / TOTAL) * STATUS.length));
  const providers = [...new Set(resultsFor(s.services).plans.map((p) => p.provider))];
  const providerDone = (i: number) => elapsed / TOTAL > 0.2 + i * 0.12;

  return (
    <Section stage="scan" tone="warm">
      <div>
        <h2 id="section-scan-h" tabIndex={-1} className="flex items-center gap-2.5 text-[1.75rem] font-bold leading-tight text-ink outline-none sm:text-[2rem]">
          <span aria-hidden className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          {t("agentLive")}
        </h2>
        {s.address && (
          <p className="mt-2 text-muted">
            {s.address.line1}, {s.address.city}, {s.address.state} {s.address.zip}
          </p>
        )}
      </div>
      <div>
        <div aria-hidden className="h-1.5 overflow-hidden bg-line">
          <div className="h-full rounded-full bg-cta transition-[width] duration-150 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-6 space-y-3">
          {STATUS.map((k, i) => {
            const state = i < idx || pct >= 100 ? "done" : i === idx ? "now" : "wait";
            return (
              <li key={k} className={clsx("flex items-center gap-3", state === "wait" ? "text-muted" : "text-ink")}>
                <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full", state === "done" ? "bg-primary text-white" : state === "now" ? "border-2 border-primary" : "border border-line-strong")}>
                  {state === "done" ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : state === "now" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
                </span>
                <span className={clsx(state === "now" && "font-semibold")}>{t(k)}</span>
              </li>
            );
          })}
        </ol>
        <p className="sr-only" role="status" aria-live="polite">
          {t(STATUS[idx])}
        </p>

        {providers.length > 0 && (
          <div className="mt-8 rounded-md border border-line-strong bg-surface p-5">
            <p className="font-semibold text-ink">{t("availableNow")}</p>
            <p className="mt-1 text-sm text-muted">{t("scanSubtitle")}</p>
            <ul className="mt-3 divide-y divide-line">
              {providers.map((p, i) => (
                <li key={p} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-semibold text-ink">{p}</span>
                  {providerDone(i) ? (
                    <Check aria-hidden className="size-4 text-success" strokeWidth={3} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <Loader2 aria-hidden className="size-3.5 animate-spin" />
                      {t("confirming")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted">{t("priceFooter")}</p>
          </div>
        )}
      </div>
    </Section>
  );
}
