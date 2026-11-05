/**
 * MODEL-LEVEL USER SIMULATION: 20,000 random visitor journeys through the app's real
 * state logic (store reducer, official selection rules, business rule, step order,
 * Back, Start over, results). Each journey checks the invariants a visitor relies on.
 * The browser-level simulation (scripts/simulate.cjs) covers rendering and layout.
 */
import { describe, expect, it } from "vitest";
import { ADDRESSES, SERVICE_ORDER, type SampleAddress, type ServiceId } from "@/data/catalog";
import { getAddressSuggestions } from "@/lib/address";
import { resultsFor } from "@/lib/plans";
import { businessAllows, isValidSelection } from "@/lib/selection";
import { STAGE, initial, nextStage, reducer, type Action, type State } from "@/lib/store";
import { BUNDLE_PRESETS } from "@/data/catalog";

const JOURNEYS = 20000;
let seed = 20261105;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const QUERIES = ["658", "6585", "6581", "12 Main Street Suite 400", "9 Elm Ave Apt 4", "Crescent", "Fannin", "zzzz", "1", "77 Tech Park Dr", ""];

interface Tally {
  journeys: number;
  reachedName: number;
  reachedUsage: number;
  reachedTv: number;
  reachedResults: number;
  businessChoices: number;
  noAddressMatches: number;
  backs: number;
  restarts: number;
  violations: string[];
}

/** One visitor. Mirrors what the UI does on each interaction. */
function journey(t: Tally) {
  let s: State = initial;
  const go = (a: Action) => (s = reducer(s, a));
  const advance = (from: number, changes?: Partial<State>) => go({ type: "advance", to: nextStage({ ...s, ...changes }, from) });
  const fail = (m: string) => t.violations.length < 20 && t.violations.push(m);

  // Step 1: random clicks on services and bundle shortcuts
  for (let i = 0, n = 1 + Math.floor(rnd() * 7); i < n; i++) {
    if (rnd() < 0.2) go({ type: "setServices", s: pick(BUNDLE_PRESETS).services });
    else go({ type: "toggleService", s: pick(SERVICE_ORDER) });
    if (!isValidSelection(s.services)) fail(`invalid selection ${s.services.join("+")}`);
    if (!s.services.length) fail("selection became empty");
  }
  // Address search
  const q = pick(QUERIES);
  const matches = getAddressSuggestions(q);
  let address: SampleAddress | null = matches.length ? pick(matches) : null;
  if (!address) {
    t.noAddressMatches++;
    address = pick(ADDRESSES); // the visitor tries again with a real address
  }
  go({ type: "patch", patch: { address, addressType: address.type, usage: [] } });

  // Check Availability (with the business rule)
  if (address.type === "business" && !businessAllows(s.services)) {
    t.businessChoices++;
    const services: ServiceId[] = rnd() < 0.5 ? ["internet"] : ["internet", "tv"];
    go({ type: "setServices", s: services });
    advance(STAGE.intent, { services });
  } else advance(STAGE.intent);
  if (s.stage !== STAGE.address) fail(`after Check Availability stage=${s.stage}, expected the name step`);
  if (address.type === "business" && !businessAllows(s.services)) fail(`business address continued with ${s.services.join("+")}`);
  t.reachedName++;

  // Name, then the remaining steps in order; sometimes Back, sometimes Start over
  go({ type: "patch", patch: { name: pick(["Jordan Rivera", "Li", "María José"]) } });
  advance(STAGE.address);
  for (let guard = 0; guard < 12 && s.stage < STAGE.results; guard++) {
    const at = s.stage;
    if (at === STAGE.usage) {
      if (!s.services.includes("internet")) fail("usage step without Internet");
      t.reachedUsage++;
      go({ type: "patch", patch: { usage: [pick(["casual", "remote", "4k", "gaming", "office", "data"])] } });
    }
    if (at === STAGE.tv) {
      if (!s.services.includes("tv")) fail("TV step without TV");
      t.reachedTv++;
      go({ type: "patch", patch: { hasInternet: rnd() < 0.5 } });
    }
    if (at === STAGE.scan) go({ type: "patch", patch: { scanDone: true } });
    if (rnd() < 0.05 && at > STAGE.intent) {
      t.backs++;
      go({ type: "back" });
      if (s.stage >= at) fail(`Back did not move back from ${at}`);
      if (s.stage === STAGE.usage && !s.services.includes("internet")) fail("Back landed on usage without Internet");
      if (s.stage === STAGE.tv && !s.services.includes("tv")) fail("Back landed on TV without TV");
      continue;
    }
    if (rnd() < 0.01) {
      t.restarts++;
      go({ type: "reset" });
      if (s.services.length || s.address || s.stage !== STAGE.intent) fail("Start over did not clear the journey");
      return;
    }
    // Skipped steps must be ones that don't apply
    const next = nextStage(s, at);
    for (let k = at + 1; k < next; k++) {
      if (k === STAGE.usage && s.services.includes("internet")) fail("skipped usage with Internet selected");
      if (k === STAGE.tv && s.services.includes("tv")) fail("skipped TV with TV selected");
    }
    advance(at);
  }
  if (s.stage !== STAGE.results) return fail(`never reached results (stage ${s.stage})`);
  t.reachedResults++;
  const { plans, missing } = resultsFor(s.services);
  if (!plans.length) fail(`no plans for ${s.services.join("+")}`);
  if (missing.length) fail(`results fell back for ${s.services.join("+")}`);
  if (s.address?.type === "business" && !businessAllows(s.services)) fail("business results for a non-business selection");
}

describe(`model-level simulation: ${JOURNEYS.toLocaleString("en-US")} visitors`, () => {
  it("never breaks an invariant", () => {
    const t: Tally = { journeys: 0, reachedName: 0, reachedUsage: 0, reachedTv: 0, reachedResults: 0, businessChoices: 0, noAddressMatches: 0, backs: 0, restarts: 0, violations: [] };
    for (let i = 0; i < JOURNEYS; i++) {
      t.journeys++;
      journey(t);
    }
    // Keep the tally visible in the test output
    console.info(JSON.stringify({ ...t, violations: t.violations.length }));
    expect(t.violations).toEqual([]);
    expect(t.reachedResults + t.restarts).toBe(t.journeys);
  });
});
