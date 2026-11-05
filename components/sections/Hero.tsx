"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, Eye, MonitorPlay, ShieldCheck, Wifi, Zap } from "lucide-react";
import clsx from "clsx";
import { BUNDLE_PRESETS, SERVICE_ORDER, type SampleAddress, type ServiceId } from "@/data/catalog";
import { presetFor } from "@/lib/presets";
import { businessAllows } from "@/lib/selection";
import { STAGE, useStore } from "@/lib/store";
import { service } from "@/lib/tokens";
import { Button, SERVICE_ICON } from "../ui";
import { Photo, hasPhoto } from "../ui/Photo";
import { AddressSearch, type AddressSearchHandle } from "./AddressSearch";

/**
 * Step 1, photo-led: the official headline and a real photo beside one white card with the
 * services, "Search USA address" and "Check Availability". Selection rules: lib/selection.ts.
 */
export function Hero() {
  const { s, dispatch, t, goNext } = useStore();
  const [tried, setTried] = useState(false);
  const [panelPing, setPanelPing] = useState(0);
  const addr = useRef<AddressSearchHandle>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const servicesHead = useRef<HTMLHeadingElement>(null);
  const active = presetFor(s.services);
  const needsBusinessChoice = !!s.address && s.address.type === "business" && s.services.length > 0 && !businessAllows(s.services);
  const noService = !s.services.length;
  // The official headline is about Internet; without Internet, use the official intent headline
  const internetHeadline = noService || s.services.includes("internet");

  // The business-only choice is the next step: bring it into view as soon as it appears
  useEffect(() => {
    if (needsBusinessChoice) window.setTimeout(() => panel.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" }), 30);
  }, [needsBusinessChoice]);

  const toggle = (id: ServiceId) => dispatch({ type: "toggleService", s: id });
  const choose = (a: SampleAddress) => {
    // Usage options differ for home and business, so only reset them when the type changes
    dispatch({ type: "patch", patch: { address: a, addressType: a.type, ...(a.type !== s.addressType ? { usage: [] } : {}) } });
    // Bring "Check Availability" into view on small screens
    window.setTimeout(() => cta.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" }), 30);
  };
  const clear = () => dispatch({ type: "patch", patch: { address: null, scanDone: false } });

  const check = () => {
    if (noService) {
      setTried(true);
      servicesHead.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => document.getElementById("hero-err")?.focus(), 20);
      return;
    }
    if (!s.address) {
      // A full address typed but not picked from the list: accept the only matching suggestion
      if (addr.current?.commitTyped()) return;
      setTried(true);
      addr.current?.focus();
      return;
    }
    if (needsBusinessChoice) {
      setPanelPing((n) => n + 1);
      window.setTimeout(() => {
        panel.current?.scrollIntoView({ block: "center", behavior: "smooth" });
        panel.current?.focus();
      }, 20);
      return;
    }
    setTried(false);
    goNext(STAGE.intent);
  };
  const chooseBusiness = (services: ServiceId[]) => {
    dispatch({ type: "setServices", s: services });
    setTried(false);
    goNext(STAGE.intent, { services });
  };

  return (
    <section id="section-intent" aria-labelledby="hero-h" className="scroll-mt-20">
      {/*
        Three blocks: headline, the services + address card, the photo. Desktop: headline and
        photo on the left, the card on the right, so "Check Availability" is on the first screen.
        Phones: headline, card, then the photo.
      */}
      <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 pt-5 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8 lg:pb-16 lg:pt-7">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 id="hero-h" tabIndex={-1} className="rise text-[2rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink outline-none sm:text-[3rem] lg:text-[3.5rem]">
            {internetHeadline ? t("heroTitle") : t("intentTitle1")}{" "}
            <span className="relative inline-block whitespace-nowrap text-primary">
              {internetHeadline ? t("heroTitleHighlight") : t("intentTitle2")}
              <svg aria-hidden viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full sm:-bottom-2 sm:h-3.5">
                <path d="M3 9 C 50 3, 120 3, 197 7" fill="none" stroke="#FF5A3C" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="rise mt-3 max-w-xl text-base text-muted sm:mt-5 sm:text-lg">
            <strong className="font-bold text-ink">{t("smartMatch")}</strong> <span className="max-sm:hidden">{t("heroDescription")}</span>
          </p>
          <ul className="mt-5 hidden flex-wrap gap-2 sm:flex">
            {[
              { icon: ShieldCheck, label: t("trust"), bg: "#22C55E" },
              { icon: Eye, label: t("transparency"), bg: "#00C2E0" },
              { icon: Zap, label: t("speed"), bg: "#FFD400" },
            ].map((i) => (
              <li key={i.label} className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3.5 text-sm font-bold text-ink ring-1 ring-line">
                <span className="flex size-7 items-center justify-center rounded-full text-ink" style={{ background: i.bg }}>
                  <i.icon aria-hidden className="size-3.5" strokeWidth={2.5} />
                </span>
                {i.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Services + address */}
        <div className="rounded-lg border border-line bg-surface p-4 sm:p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <h2 id="section-intent-h" ref={servicesHead} tabIndex={-1} className="text-xl font-extrabold leading-tight text-ink outline-none sm:text-[1.375rem]">
            {t("serviceLabel")}
          </h2>
          <p className="mt-1 text-sm text-muted max-sm:hidden">{t("multiSelectHint")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {SERVICE_ORDER.map((id) => (
              <ServiceTile key={id} id={id} on={s.services.includes(id)} onToggle={() => toggle(id)} />
            ))}
          </div>
          <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {BUNDLE_PRESETS.map((b) => {
              const on = active?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => dispatch({ type: "setServices", s: b.services })}
                  className={clsx("press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3.5 text-sm font-bold", on ? "border-ink bg-ink text-white" : "border-line bg-canvas text-ink hover:border-ink")}
                >
                  <span aria-hidden className="flex -space-x-1">
                    {b.services.map((x) => (
                      <span key={x} className="size-3 rounded-full ring-2 ring-white" style={{ background: service[x].vivid }} />
                    ))}
                  </span>
                  {t(`preset_${b.id.replaceAll("-", "_")}` as "preset_quad")}
                </button>
              );
            })}
          </div>
          {tried && noService && (
            <p id="hero-err" tabIndex={-1} role="alert" className="mt-3 flex items-center gap-2 text-sm font-bold text-danger outline-none">
              <AlertCircle aria-hidden className="size-4 shrink-0" />
              {t("pickServiceHint")}
            </p>
          )}

          <div className="mt-4 border-t border-line pt-4">
            <label htmlFor="addr" className="mb-2 block text-base font-extrabold text-ink">
              {t("addrSearchLabel")}
            </label>
            <AddressSearch ref={addr} onChoose={choose} onClear={clear} onSubmit={check} invalid={tried && !s.address && !noService} />
            {needsBusinessChoice && (
              <div
                ref={panel}
                key={panelPing}
                tabIndex={-1}
                role={panelPing ? "alert" : "group"}
                aria-label={t("businessOnlyTitle")}
                className="mt-4 rounded-lg border-2 border-ink bg-warning-soft p-4 outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <p className="font-extrabold text-ink">{t("businessOnlyTitle")}</p>
                <p className="mt-1 text-sm text-ink">{t("businessOnlyBody")}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => chooseBusiness(["internet"])} iconLeft={<Wifi aria-hidden className="size-4" />}>
                    {t("businessOptionInternet")}
                  </Button>
                  <Button onClick={() => chooseBusiness(["internet", "tv"])} iconLeft={<MonitorPlay aria-hidden className="size-4" />}>
                    {t("businessOptionBundle")}
                  </Button>
                </div>
              </div>
            )}
            <Button ref={cta} size="lg" block variant={needsBusinessChoice ? "secondary" : "primary"} onClick={check} className="mt-3 text-[17px]" iconRight={<ArrowRight aria-hidden className="size-5" />}>
              {t("checkAvailability")}
            </Button>
          </div>
        </div>

        {hasPhoto("hero") && (
          <div className="relative lg:col-start-1 lg:row-start-2 lg:self-start">
            {/* Flat colour blocks peeking out behind the photo */}
            <span aria-hidden className="absolute -right-2 -top-2 hidden size-24 rounded-lg bg-[#FFD400] sm:block lg:-right-4 lg:-top-4 lg:size-28" />
            <span aria-hidden className="absolute -bottom-3 -left-3 hidden size-20 rounded-full bg-cta sm:block lg:size-24" />
            <Photo slot="hero" priority sizes="(min-width: 1024px) 560px, 100vw" className="relative aspect-[16/9] rounded-lg lg:aspect-[16/10]" position="40% 50%" />
          </div>
        )}
      </div>
    </section>
  );
}

/** A service card: an icon block in the service colour; the whole card fills with it when selected. */
function ServiceTile({ id, on, onToggle }: { id: ServiceId; on: boolean; onToggle: () => void }) {
  const { t } = useStore();
  const Icon = SERVICE_ICON[id];
  const c = service[id];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={clsx(
        "press relative flex min-h-14 items-center gap-2.5 rounded-lg border-2 px-2.5 text-left sm:px-3",
        id === "security" && "col-span-2 sm:col-span-1 lg:col-span-2",
        !on && "border-line bg-canvas hover:border-ink",
      )}
      style={on ? { background: c.vivid, borderColor: c.vivid, color: c.on } : undefined}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md" style={on ? { background: "#FFFFFF", color: "#0F172A" } : { background: c.vivid, color: c.on }}>
        <Icon aria-hidden className="size-5" strokeWidth={2.25} />
      </span>
      <span className={clsx("min-w-0 flex-1 text-base font-extrabold [overflow-wrap:normal]", !on && "text-ink")}>{t(`svc_${id}`)}</span>
      <span aria-hidden className={clsx("flex size-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface")}>
        {on && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}
