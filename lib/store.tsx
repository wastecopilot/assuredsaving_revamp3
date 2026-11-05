"use client";
/**
 * One-page flow state. Like the original one-pager, the page never navigates:
 * sections unlock in order and the page scrolls to each new one.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { DEVICES, type AddressType, type SampleAddress, type ServiceId } from "@/data/catalog";
import { translate, type Key, type Lang } from "./i18n";
import { isValidSelection, toggleService } from "./selection";

export const STAGE = { intent: 0, address: 1, usage: 2, tv: 3, scan: 4, results: 5 } as const;
export type StageName = keyof typeof STAGE;
export const STAGE_NAMES: StageName[] = ["intent", "address", "usage", "tv", "scan", "results"];
export const sectionId = (s: StageName) => `section-${s}`;

export interface State {
  lang: Lang;
  stage: number;
  services: ServiceId[];
  name: string;
  address: SampleAddress | null;
  addressType: AddressType;
  usage: string[];
  devices: number;
  genres: string[];
  intl: string[];
  tvs: number;
  smartTvs: number;
  hasInternet: boolean | null;
  scanDone: boolean;
  carrier: string;
  billCents: number | null;
  modal: { kind: "details" | "callback" | null; planId: string | null };
  /** Filled by the results section for the "Your quote" summary. */
  resultsSummary: { count: number; fromCents: number | null } | null;
  /** Callback details kept for the visit, so closing the form doesn't lose them. */
  contact: { email: string; phone: string; verifiedFor: string | null };
}

export const initial: State = {
  lang: "en",
  stage: STAGE.intent,
  services: [],
  name: "",
  address: null,
  addressType: "residential",
  usage: [],
  devices: DEVICES.default,
  genres: [],
  intl: [],
  tvs: 1,
  smartTvs: 1,
  hasInternet: null,
  scanDone: false,
  carrier: "ALL",
  billCents: null,
  modal: { kind: null, planId: null },
  resultsSummary: null,
  contact: { email: "", phone: "", verifiedFor: null },
};

export type Action =
  | { type: "patch"; patch: Partial<State> }
  | { type: "toggleService"; s: ServiceId }
  | { type: "setServices"; s: ServiceId[] }
  | { type: "advance"; to: number }
  | { type: "back" }
  | { type: "goto"; to: number }
  | { type: "reset" };

/** Usage applies only when internet is part of the request; TV setup only with TV. */
export const usageApplies = (s: State) => s.services.includes("internet");
export const tvApplies = (s: State) => s.services.includes("tv");
const applies = (s: State, stage: number) => (stage === STAGE.usage ? usageApplies(s) : stage === STAGE.tv ? tvApplies(s) : true);

/** The next stage after `from` that applies to this person. */
export function nextStage(s: State, from: number) {
  let n = from + 1;
  while (n < STAGE.results && !applies(s, n)) n++;
  return n;
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "patch":
      return { ...s, ...a.patch };
    case "toggleService": {
      // Official rules: see lib/selection.ts
      return { ...s, services: toggleService(s.services, a.s), carrier: "ALL" };
    }
    case "setServices":
      return { ...s, services: a.s, carrier: "ALL" };
    case "advance":
      return { ...s, stage: Math.max(s.stage, a.to) };
    case "back": {
      if (s.modal.kind) return { ...s, modal: { ...s.modal, kind: null } };
      if (s.stage <= 0) return s;
      let t = s.stage - 1;
      // The scan runs by itself, so Back never lands on it (it would loop straight back to results).
      while (t > 0 && (!applies(s, t) || t === STAGE.scan)) t--;
      // Leaving results or scan re-runs the scan next time.
      return { ...s, stage: t, scanDone: t >= STAGE.results ? s.scanDone : false };
    }
    case "goto": {
      // Browser Back: return to an earlier step (never forward), skipping steps that don't apply.
      if (s.modal.kind) return { ...s, modal: { ...s.modal, kind: null } };
      let t = Math.max(0, Math.min(a.to, s.stage));
      while (t > 0 && (!applies(s, t) || (t === STAGE.scan && t < s.stage))) t--;
      return t === s.stage ? s : { ...s, stage: t, scanDone: t >= STAGE.results ? s.scanDone : false };
    }
    case "reset":
      return { ...initial, lang: s.lang };
  }
}

interface Ctx {
  s: State;
  dispatch: (a: Action) => void;
  t: (k: Key, vars?: Record<string, string | number>) => string;
  /** Unlock the next applicable section and scroll to it. */
  goNext: (from: number, changes?: Partial<State>) => void;
  scrollTo: (stage: StageName) => void;
}
const C = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(C);
  if (!c) throw new Error("useStore outside provider");
  return c;
};

const SAVE_KEY = "as-onepager-v1";
const SAVED_FIELDS = ["lang", "stage", "services", "name", "address", "addressType", "usage", "devices", "genres", "intl", "tvs", "smartTvs", "hasInternet", "scanDone", "carrier", "contact"] as const;
/** What survives a reload in this tab (sessionStorage only; cleared when the tab closes). */
function pickSaved(s: Partial<State>): Partial<State> {
  const out: Record<string, unknown> = {};
  for (const k of SAVED_FIELDS) if (s[k] !== undefined) out[k] = s[k];
  return out as Partial<State>;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initial);
  const ref = useRef(s);
  ref.current = s;
  const pending = useRef<StageName | null>(null);

  const scrollTo = useCallback((stage: StageName) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sections load on demand, so wait (up to ~3s) for the section to appear.
    let tries = 0;
    const attempt = () => {
      const el = document.getElementById(sectionId(stage));
      if (!el) {
        if (++tries < 60) window.setTimeout(attempt, 50);
        return;
      }
      // A wizard screen starts at the top of the page (the step panel on phones).
      (document.getElementById("wizard-top") ?? el).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      // Move keyboard focus to the new section's heading, unless the visitor is
      // already typing in a field (never steal focus mid-word).
      window.setTimeout(() => {
        const a = document.activeElement;
        if (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement || a instanceof HTMLSelectElement) return;
        el.querySelector<HTMLElement>("h2[tabindex='-1'], h1[tabindex='-1']")?.focus({ preventScroll: true });
      }, reduce ? 0 : 450);
    };
    attempt();
  }, []);

  const goNext = useCallback((from: number, changes?: Partial<State>) => {
    // `changes` = state dispatched in the same handler that this render hasn't seen yet
    // (e.g. the business chooser setting services), so the next step is computed from it.
    const to = nextStage({ ...ref.current, ...changes }, from);
    dispatch({ type: "advance", to });
    pending.current = STAGE_NAMES[to];
  }, []);

  // Scroll after the newly unlocked section has mounted.
  useEffect(() => {
    if (!pending.current) return;
    const target = pending.current;
    pending.current = null;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(target)));
    return () => cancelAnimationFrame(id);
  }, [s.stage, scrollTo]);

  // Back button scrolls up to the section you return to.
  const prev = useRef(s.stage);
  useEffect(() => {
    if (s.stage < prev.current) requestAnimationFrame(() => scrollTo(STAGE_NAMES[s.stage]));
    prev.current = s.stage;
  }, [s.stage, scrollTo]);

  useEffect(() => {
    document.documentElement.lang = s.lang;
  }, [s.lang]);

  /*
   * Browser Back / phone back gesture: each step forward (and an open dialog) adds a
   * history entry, so Back returns to the previous step instead of leaving the site.
   */
  const lastStage = useRef(s.stage);
  useEffect(() => {
    // Results replace the scan's entry, so browser Back from results skips the scan.
    if (s.stage > lastStage.current) {
      if (lastStage.current === STAGE.scan) window.history.replaceState({ asStage: s.stage }, "");
      else window.history.pushState({ asStage: s.stage }, "");
    }
    lastStage.current = s.stage;
  }, [s.stage]);
  const modalOpen = !!s.modal.kind;
  const wasOpen = useRef(false);
  useEffect(() => {
    if (modalOpen) window.history.pushState({ asStage: ref.current.stage, asModal: true }, "");
    // Closed from the page (X, Escape): drop the dialog's entry so the next Back moves a step
    else if (wasOpen.current && window.history.state?.asModal) window.history.back();
    wasOpen.current = modalOpen;
  }, [modalOpen]);
  useEffect(() => {
    // Each step is its own screen: never let the browser restore an old scroll position
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const onPop = (e: PopStateEvent) => {
      const cur = ref.current;
      if (cur.modal.kind) return dispatch({ type: "patch", patch: { modal: { ...cur.modal, kind: null } } });
      const to = typeof e.state?.asStage === "number" ? e.state.asStage : 0;
      if (to < cur.stage) {
        lastStage.current = Math.min(lastStage.current, to);
        dispatch({ type: "goto", to });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Keep progress for this browser tab, so a reload doesn't lose it. Never the callback code. */
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = window.sessionStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<State>;
      if (saved && typeof saved === "object" && Array.isArray(saved.services) && isValidSelection(saved.services)) {
        dispatch({ type: "patch", patch: { ...pickSaved(saved), modal: { kind: null, planId: null } } });
        if ((saved.stage ?? 0) > 0) pending.current = STAGE_NAMES[Math.min(saved.stage ?? 0, STAGE.results)];
      }
    } catch {
      /* storage unavailable or corrupt: start fresh */
    }
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try {
      window.sessionStorage.setItem(SAVE_KEY, JSON.stringify(pickSaved(s)));
    } catch {
      /* storage unavailable: nothing to do */
    }
  }, [s]);

  const t = useCallback((k: Key, vars?: Record<string, string | number>) => translate(s.lang, k, vars), [s.lang]);
  const value = useMemo(() => ({ s, dispatch, t, goNext, scrollTo }), [s, t, goNext, scrollTo]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
