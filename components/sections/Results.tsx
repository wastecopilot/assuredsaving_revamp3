"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, RotateCcw, ShieldCheck, Tv } from "lucide-react";
import clsx from "clsx";
import { DIRECTV_TIERS } from "@/data/sample";
import type { ServiceId } from "@/data/catalog";
import type { Key } from "@/lib/i18n";
import { allInNow, displayOrder, isPriced, labelsFor, money, resultsFor } from "@/lib/plans";
import { useStore } from "@/lib/store";
import { Button, Chip, EmptyState } from "../ui";
import { PlanCard } from "./PlanCard";
import { Section } from "./Section";

/** Official result headings for each selection. */
export function verticalKey(services: ServiceId[]): Key {
  const has = (x: ServiceId) => services.includes(x);
  if (has("internet") && has("tv") && has("phone") && has("mobile")) return "vertical_quad";
  if (has("internet") && has("tv") && has("mobile")) return "vertical_triple";
  if (has("internet") && has("tv") && has("phone")) return "vertical_classicTriple";
  if (has("internet") && has("tv")) return "vertical_bundle";
  return `vertical_${services[0] ?? "internet"}` as Key;
}

export function ResultsSection() {
  const { s, dispatch, t } = useStore();
  const found = useMemo(() => resultsFor(s.services), [s.services]);
  const missing = found.missing;
  const labels = useMemo(() => labelsFor(found.plans), [found.plans]);
  // The visitor's answers decide the top pick; labelled plans are never hidden (lib/plans.ts displayOrder)
  const plans = useMemo(() => displayOrder(found.plans, labels, { usage: s.usage, devices: s.devices }), [found.plans, labels, s.usage, s.devices]);
  const listTop = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const providers = [...new Set(plans.map((p) => p.provider))];
  const filtered = s.carrier === "ALL" ? null : plans.filter((p) => p.provider === s.carrier);
  const pricedCount = plans.filter(isPriced).length;
  const top = plans.slice(0, Math.min(3, Math.max(1, pricedCount, labels.size)));
  const rest = plans.slice(top.length);
  const rankOf = (id: string) => plans.findIndex((p) => p.id === id) + 1;
  const first = plans[0];
  const biz = s.addressType === "business";
  const empty = plans.length === 0 || missing.length > 0;
  const label = t(verticalKey(s.services));

  useEffect(() => {
    dispatch({ type: "patch", patch: { resultsSummary: { count: plans.length, fromCents: first && isPriced(first) ? allInNow(first) : null } } });
  }, [dispatch, plans.length, first]);

  const startOver = () => {
    dispatch({ type: "reset" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const list = (l: typeof plans) => (
    <ol className="space-y-3">
      {l.map((p) => (
        <li key={p.id}>
          <PlanCard plan={p} rank={rankOf(p.id)} labels={labels.get(p.id) ?? []} top={first} />
        </li>
      ))}
    </ol>
  );

  return (
    <Section stage="results" wide>
      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">{label}</span>
          {biz && <span className="rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">{t("businessPlansBadge")}</span>}
        </p>
        <h2 id="section-results-h" tabIndex={-1} className="mt-3 text-[2rem] font-bold leading-tight text-ink outline-none sm:text-[2.5rem]" aria-live="polite">
          {(filtered ?? plans).length} {t((filtered ?? plans).length === 1 ? "planAvailable" : "plansAvailable")}
        </h2>
        {s.address && (
          <p className="text-muted">
            {s.address.line1}, {s.address.city}, {s.address.state} {s.address.zip}
          </p>
        )}
      </div>

      {empty ? (
        <div className="mt-8">
          <EmptyState
            title={t("emptyHeadline", { label })}
            action={
              <Button onClick={startOver} iconLeft={<RotateCcw aria-hidden className="size-4" />}>
                {t("emptyStartOver")}
              </Button>
            }
          />
        </div>
      ) : (
        <div ref={listTop} className="scroll-mt-36">
          {providers.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-labelledby="filter-h">
              <span id="filter-h" className="mr-1 text-sm font-semibold text-ink">
                {t("filter")}
              </span>
              {["ALL", ...providers].map((p) => (
                <Chip
                  key={p}
                  selected={s.carrier === p}
                  onClick={() => {
                    dispatch({ type: "patch", patch: { carrier: p } });
                    window.setTimeout(() => listTop.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 30);
                  }}
                >
                  {p === "ALL" ? t("all") : p}
                </Chip>
              ))}
            </div>
          )}
          {!filtered && (
            <ol className="mt-6 space-y-3">
              {top.map((p, i) => (
                <li key={p.id}>
                  <PlanCard plan={p} rank={rankOf(p.id)} labels={labels.get(p.id) ?? []} top={first} featured={i === 0} />
                </li>
              ))}
            </ol>
          )}

          {(rest.length > 0 || providers.length > 1) && (
            <div className="mt-8">
              {!filtered && rest.length > 0 && (
                <button
                  type="button"
                  aria-expanded={showAll}
                  aria-controls="all-plans"
                  onClick={() => setShowAll((v) => !v)}
                  className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-ink bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface2"
                >
                  {showAll ? t("showLess") : t("allPlansNudge", { n: plans.length })}
                  <ChevronDown aria-hidden className={clsx("size-4 transition-transform", showAll && "rotate-180")} />
                </button>
              )}
              <div id="all-plans" hidden={!showAll && !filtered} className="mt-6">
                <h3 className="mb-3 text-lg font-bold text-ink">{t(biz ? "businessPlansHeading" : filtered ? "quickComparison" : "otherPlans")}</h3>
                {list(filtered ?? rest)}
              </div>
            </div>
          )}
        </div>
      )}

      {s.services.includes("tv") && !empty && <DirectvTiers />}

      <div className="mt-8">
        <section aria-labelledby="adv-h" className="flex gap-3 rounded-md bg-surface2 p-5">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary-strong" />
          <div>
            <h3 id="adv-h" className="font-bold text-ink">
              {t("advantage")}
            </h3>
            <p className="mt-1 text-sm text-muted">{t("advantageDesc")}</p>
          </div>
        </section>
      </div>
    </Section>
  );
}

function DirectvTiers() {
  const { t } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="dtv-h" className="mt-8 rounded-md border border-line-strong">
      <button type="button" aria-expanded={open} aria-controls="dtv-panel" onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center gap-4 p-5 text-left">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-md bg-tv text-ink">
          <Tv className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="dtv-h" className="block font-bold text-ink">
            {t("directvTitle")}
          </span>
          <span className="block text-sm text-muted">{t("directvSubtitle")}</span>
        </span>
        <ChevronDown aria-hidden className={clsx("size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      <div id="dtv-panel" hidden={!open} className="border-t border-line p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t("directvTiers")}</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIRECTV_TIERS.map((tier) => (
            <li key={tier.id} className="rounded-md border border-line p-4">
              <p className="font-bold text-ink">{tier.name}</p>
              <p className="text-sm text-muted">
                {tier.channels}+ {t("channelsSuffix")}
              </p>
              <p className="mt-3 text-2xl font-extrabold text-ink tabular">
                {money(tier.introCents).replace(".00", "")}
                <span className="text-sm font-semibold text-muted">{t("perMo")}</span>
              </p>
              <p className="text-sm text-muted tabular">
                {t("reg")} {money(tier.regularCents).replace(".00", "")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
