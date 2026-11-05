"use client";
import { Building2, Check, Home, MapPin, PhoneCall, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FOOTER_LINKS, SERVICE_ORDER, siteUrl } from "@/data/catalog";
import type { Key } from "@/lib/i18n";
import { STAGE_NAMES, useStore, type StageName } from "@/lib/store";
import { service } from "@/lib/tokens";
import { SERVICE_ICON } from "../ui";

/** Brand mark: a royal-blue tile with a white shield and a coral check. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#1652F0" />
      <path d="M16 6.5 8.5 9.4v5.4c0 4.8 3.2 8.1 7.5 9.4 4.3-1.3 7.5-4.6 7.5-9.4V9.4L16 6.5Z" fill="#FFFFFF" />
      <path d="m12.4 15.6 2.6 2.6 4.8-5" fill="none" stroke="#FF5A3C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The stages that apply to this visitor (usage only with internet, TV setup only with TV). */
export function useVisibleStages(): StageName[] {
  const { s } = useStore();
  return STAGE_NAMES.filter((n) => (n === "usage" ? s.services.includes("internet") : n === "tv" ? s.services.includes("tv") : true));
}

/**
 * The official step names (no step numbers): Intent, then Name & Address (also covers
 * usage), then Details for TV, scan and results — the official site's own grouping.
 */
export const STAGE_LABEL: Record<StageName, Key> = {
  intent: "stage_intent",
  address: "stage_address",
  usage: "stage_address",
  tv: "stage_details",
  scan: "stage_details",
  results: "stage_details",
};
// Only the step names the official site shows on screen ("Intent" exists in its text bundle but is not shown)
const TRACK: Key[] = ["stage_address", "stage_details"];

function LangSwitch() {
  const { s, dispatch } = useStore();
  return (
    <div className="flex shrink-0 items-center rounded-full border border-line-strong bg-surface p-0.5 text-sm font-bold">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={s.lang === l}
          onClick={() => dispatch({ type: "patch", patch: { lang: l } })}
          className={clsx("min-h-11 min-w-11 rounded-full px-2.5 transition-colors", s.lang === l ? "bg-ink text-white" : "text-muted hover:text-ink")}
        >
          {l === "en" ? "ENG" : "ESP"}
        </button>
      ))}
    </div>
  );
}

/** The step track: the official step names joined by a line; done steps get a check. Hidden on step 1. */
export function StepTrack() {
  const { s, t } = useStore();
  if (s.stage === 0) return null;
  const now = TRACK.indexOf(STAGE_LABEL[STAGE_NAMES[s.stage]]);
  return (
    <ol className="flex min-w-0 items-center gap-2 text-sm font-bold">
      {TRACK.map((k, i) => (
        <li key={k} className="flex min-w-0 items-center gap-2" aria-current={i === now ? "step" : undefined}>
          {i > 0 && <span aria-hidden className={clsx("h-0.5 w-6 shrink-0 rounded-full sm:w-10", i <= now ? "bg-primary" : "bg-line-strong")} />}
          <span
            aria-hidden
            className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full", i < now ? "bg-primary text-white" : i === now ? "bg-cta text-ink" : "border-2 border-line-strong")}
          >
            {i < now && <Check className="size-3.5" strokeWidth={3} />}
            {i === now && <span className="size-2 rounded-full bg-ink" />}
          </span>
          <span className={clsx("truncate [overflow-wrap:normal]", i === now ? "text-ink" : "text-muted max-sm:sr-only")}>{t(k)}</span>
        </li>
      ))}
    </ol>
  );
}

export function Header({ track }: { track: React.ReactNode }) {
  const { s, t } = useStore();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface [@media(max-height:500px)]:static">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
        <a href="#wizard-top" className="flex min-h-11 items-center gap-2.5 rounded-full">
          <Logo />
          <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-ink max-[359px]:sr-only">{t("brand")}</span>
        </a>
        <div className="order-3 w-full min-w-0 md:order-none md:w-auto md:flex-1 md:px-4">
          {track}
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          {s.stage > 0 && <StartOver />}
          <LangSwitch />
          <span className="hidden rounded-full bg-surface2 px-3 py-1.5 text-sm font-bold text-ink lg:inline-block">{t("usOnly")}</span>
        </div>
      </div>
    </header>
  );
}

/** What the visitor has told us so far, as a strip above each later step. */
export function Summary() {
  const { s, t, dispatch } = useStore();
  const chosen = SERVICE_ORDER.filter((x) => s.services.includes(x));
  if (s.stage < 1 || !chosen.length) return null;
  return (
    // relative: screen-reader-only labels are absolutely positioned and must be clipped here too
    <div className="relative mb-5 flex flex-wrap items-center gap-2 text-sm [@media(max-height:500px)]:hidden">
      <span className="inline-flex items-center gap-2 rounded-full bg-surface px-2 py-1 ring-1 ring-line">
        <span aria-hidden className="flex -space-x-1">
          {chosen.map((x) => {
            const Icon = SERVICE_ICON[x];
            return (
              <span key={x} className="flex size-6 items-center justify-center rounded-full ring-2 ring-white" style={{ background: service[x].vivid, color: service[x].on }}>
                <Icon className="size-3" strokeWidth={2.5} />
              </span>
            );
          })}
        </span>
        <span className="pr-1 font-bold text-ink max-sm:sr-only">{chosen.map((x) => t(`svc_${x}`)).join(" + ")}</span>
      </span>
      {s.address && (
        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-full bg-surface px-3 py-1.5 ring-1 ring-line">
          <MapPin aria-hidden className="size-4 shrink-0 text-cta" />
          <span className="min-w-0 truncate font-semibold text-ink [overflow-wrap:normal]">{s.address.line1}</span>
          {s.address.type === "business" ? <Building2 aria-hidden className="size-3.5 shrink-0 text-muted" /> : <Home aria-hidden className="size-3.5 shrink-0 text-muted" />}
          <span className="sr-only">{t(s.address.type === "business" ? "businessAddress" : "homeAddress")}</span>
        </span>
      )}
      <button
        type="button"
        onClick={() => dispatch({ type: "patch", patch: { modal: { kind: "callback", planId: null } } })}
        className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-link ring-1 ring-line hover:bg-primary-soft sm:ring-0"
      >
        <PhoneCall aria-hidden className="size-4" />
        <span className="max-sm:sr-only">{t("scheduleCallback")}</span>
      </button>
    </div>
  );
}

/** "Start Over" asks first (official "Start Over" / "Cancel"), so a stray tap can't wipe the visit. */
function StartOver() {
  const { t, dispatch } = useStore();
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (asking) confirmRef.current?.focus();
  }, [asking]);
  if (asking)
    return (
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={t("startOver")}>
        <button
          ref={confirmRef}
          type="button"
          onClick={() => {
            setAsking(false);
            dispatch({ type: "reset" });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex min-h-11 items-center rounded-full bg-cta px-3 text-sm font-bold text-ink"
        >
          {t("startOverConfirm")}
        </button>
        <button type="button" onClick={() => setAsking(false)} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-ink hover:bg-surface2">
          {t("startOverCancel")}
        </button>
      </div>
    );
  return (
    <button
      type="button"
      onClick={() => setAsking(true)}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-muted hover:bg-surface2 hover:text-ink"
    >
      <RotateCcw aria-hidden className="size-4" />
      <span className="max-sm:sr-only">{t("startOver")}</span>
    </button>
  );
}

export function Footer() {
  const { s, t } = useStore();
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-extrabold tracking-tight">{t("brand")}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-dark-muted">{t("disclaimer")}</p>
          </div>
          <nav aria-label={t("footerNav")} className="grid gap-8 sm:grid-cols-3">
            {FOOTER_LINKS.map((g) => (
              <div key={g.group}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFD400]">{t(g.group)}</h2>
                <ul className="mt-2">
                  {g.links.map((l) => (
                    <li key={l.slug}>
                      <a href={siteUrl(l.slug, s.lang)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-white hover:underline">
                        {t(l.key)}
                        <span className="sr-only"> {t("newTab")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-white/15 pt-6 text-sm text-on-dark-muted">© {new Date().getFullYear()} Assured Saving</p>
      </div>
    </footer>
  );
}
