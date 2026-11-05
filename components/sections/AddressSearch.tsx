"use client";
/**
 * "Search USA address" with suggestions (mocked engine, lib/address.ts).
 * Keyboard: arrows move (ArrowDown also reopens), Enter picks, Escape closes, and
 * Enter on a verified address runs the main action. Picking verifies the address
 * and detects home or business. Editing a verified address clears it.
 */
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type KeyboardEvent } from "react";
import { Building2, Check, CircleCheck, Home, MapPin, Search } from "lucide-react";
import { Photo, hasPhoto } from "../ui/Photo";
import clsx from "clsx";
import type { SampleAddress } from "@/data/catalog";
import { formatAddress as fmt, getAddressSuggestions } from "@/lib/address";
import { useStore } from "@/lib/store";
import { fieldClass } from "../ui";

export interface AddressSearchHandle {
  focus: () => void;
  /** Typed but not picked: accept the only (or exact) suggestion. Returns true when it picked one. */
  commitTyped: () => boolean;
}

export const AddressSearch = forwardRef<AddressSearchHandle, { onChoose: (a: SampleAddress) => void; onClear: () => void; onSubmit?: () => void; action?: React.ReactNode; invalid?: boolean }>(function AddressSearch(
  { onChoose, onClear, onSubmit, action, invalid },
  handle,
) {
  const { s, t } = useStore();
  const [q, setQ] = useState(s.address ? fmt(s.address) : "");
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const commitRef = useRef<() => boolean>(() => false);
  useImperativeHandle(handle, () => ({ focus: () => input.current?.focus(), commitTyped: () => commitRef.current() }), []);

  const lastChosen = useRef(s.address ? fmt(s.address) : "");
  // A restored session or "Start a new search" changes the store: keep the field in step
  useEffect(() => {
    if (s.address && !q) {
      const v = fmt(s.address);
      lastChosen.current = v;
      setQ(v);
    } else if (!s.address && q && q === lastChosen.current) setQ("");
  }, [s.address, q]);

  const verified = !!s.address && fmt(s.address) === q;
  const matches = verified ? [] : getAddressSuggestions(q);
  const open = q.trim().length > 0 && !dismissed && matches.length > 0;
  const noMatch = q.trim().length > 0 && !verified && matches.length === 0;
  // The official error for the actual problem: no street number vs. not a US address
  const noMatchMsg = /^\s*\d/.test(q) ? t("usError") : t("manualError");
  const describedBy = noMatch || invalid ? "addr-msg" : "addr-hint";

  useEffect(() => {
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setDismissed(true);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const choose = (a: SampleAddress) => {
    const v = fmt(a);
    lastChosen.current = v;
    setQ(v);
    setDismissed(true);
    setActive(-1);
    onChoose(a);
  };
  commitRef.current = () => {
    if (verified || !matches.length) return false;
    const typed = q.trim().toLowerCase().replace(/\s+/g, " ");
    const exact = matches.find((a) => fmt(a).toLowerCase() === typed);
    if (!exact && matches.length !== 1) return false;
    choose(exact ?? matches[0]);
    return true;
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && verified && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" && matches.length) {
        e.preventDefault();
        setDismissed(false);
        setActive(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[Math.max(active, 0)]);
    } else if (e.key === "Escape") setDismissed(true);
  };
  const tryAgain = () => {
    setQ("");
    lastChosen.current = "";
    setDismissed(false);
    onClear();
    window.setTimeout(() => input.current?.focus(), 20);
  };

  return (
    <div ref={wrap} className="relative">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
          <input
            ref={input}
            id="addr"
            role="combobox"
            aria-label={t("addrSearchLabel")}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={noMatch || invalid || undefined}
            aria-describedby={verified ? "addr-found" : describedBy}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={120}
            placeholder={t("addrPlaceholder")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setDismissed(false);
              setActive(-1);
              if (s.address) onClear();
            }}
            onFocus={() => setDismissed(false)}
            onKeyDown={onKey}
            className={clsx(fieldClass, "min-h-14 rounded-full pl-12 text-[17px]", noMatch || invalid ? "border-danger" : "border-ink")}
          />
        </div>
        {action}
      </div>

      <ul id={listId} role="listbox" aria-label={t("addrSearchLabel")} hidden={!open} className="absolute inset-x-0 top-[3.75rem] z-30 max-h-80 overflow-auto rounded-lg border-2 border-ink bg-surface py-1.5">
        {matches.map((a, i) => {
          const Icon = a.type === "business" ? Building2 : Home;
          return (
            <li
              key={a.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => active !== i && setActive(i)}
              onClick={() => choose(a)}
              className={clsx("flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2", i === active && "bg-primary-soft")}
            >
              <Icon aria-hidden className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-[15px]">
                <span className="font-semibold text-ink">{a.line1}</span>
                <span className="text-muted">
                  , {a.city}, {a.state} {a.zip}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {!verified &&
        (noMatch || invalid ? (
          <p id="addr-msg" className="mt-2 text-sm font-medium text-danger">
            {noMatch ? noMatchMsg : t("manualHint")}
          </p>
        ) : (
          <p id="addr-hint" className="mt-2 text-sm text-muted">
            {t("manualHint")}
          </p>
        ))}

      {/* Always present, so screen readers announce "Address Found" and the type when they appear */}
      <div aria-live="polite" id="addr-found">
        {s.address && verified && (
          <div className="mt-4">
            {/* Like the official "Address Found" card: a picture of the place, the type, then the address */}
            <div className="overflow-hidden rounded-lg border-2 border-ink bg-surface">
              <div className="relative">
                <Photo slot={s.address.type === "business" ? "business" : "home"} sizes="(min-width: 768px) 720px, 100vw" className="h-40 sm:h-48" position={s.address.type === "business" ? "50% 60%" : "62% 55%"} />
                <span
                  className={clsx(
                    "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-ink",
                    s.address.type === "business" ? "bg-[#FFD400]" : "bg-[#B6E94A]",
                  )}
                >
                  {s.address.type === "business" ? <Building2 aria-hidden className="size-3.5" /> : <Home aria-hidden className="size-3.5" />}
                  {t(s.address.type === "business" ? "typeBusiness" : "typeHome")}
                </span>
                {/* A solid band (not a gradient) keeps the text readable on any photo */}
                <div className={clsx("flex items-center gap-3 px-4 py-3", hasPhoto(s.address.type === "business" ? "business" : "home") ? "absolute inset-x-0 bottom-0 bg-ink/80" : "bg-ink pr-32")}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cta text-ink">
                    <Check aria-hidden className="size-5" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFD400]">{t("addressFound")}</p>
                    <p className="flex items-center gap-1.5 text-lg font-extrabold text-white">
                      {s.address.type === "business" ? <Building2 aria-hidden className="size-5" /> : <Home aria-hidden className="size-5" />}
                      {t(s.address.type === "business" ? "businessAddress" : "homeAddress")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <MapPin aria-hidden className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">{t("yourAddress")}</p>
                  <p className="font-bold text-ink">{fmt(s.address)}</p>
                </div>
                <CircleCheck aria-hidden className="size-6 shrink-0 text-success" />
              </div>
            </div>
            <button type="button" onClick={tryAgain} className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-link underline underline-offset-4">
              <span aria-hidden>←&nbsp;</span>
              {t("tryDifferentAddress")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
