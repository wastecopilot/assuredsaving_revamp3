/** Unit tests for the price maths, ranking, earned labels and "Why This Plan" reasons. */
import { describe, expect, it } from "vitest";
import { PLANS } from "@/data/sample";
import { VALID_SELECTIONS } from "@/lib/selection";
import { allInAfter, allInNow, displayOrder, isPriced, labelsFor, money, planReasons, resultsFor, speedText, techLabel } from "@/lib/plans";

describe("sample data", () => {
  it("has unique plan ids", () => {
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
  });

  it("computes all-in prices from plan + fees - promo", () => {
    for (const p of PLANS.filter(isPriced)) {
      const fees = p.pricing.fees.reduce((a, f) => a + f.cents, 0);
      expect(allInNow(p)).toBe(p.pricing.planCents + fees - (p.pricing.promo?.creditCents ?? 0));
      expect(allInAfter(p)).toBe(p.pricing.planCents + fees);
      expect(allInNow(p)).toBeGreaterThan(0);
    }
  });

  it("has an official technology word for every plan", () => {
    for (const p of PLANS) for (const lang of ["en", "es"] as const) expect(techLabel(p, lang)).toBeTruthy();
  });
});

describe("results for every selection the official site allows", () => {
  it.each(VALID_SELECTIONS.map((v) => [v.join(" + "), v] as const))("%s has its own plans, sorted, no duplicates", (_, sel) => {
    const { plans, missing } = resultsFor([...sel]);
    expect(missing).toEqual([]);
    expect(plans.length).toBeGreaterThan(0);
    expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length);
    const priced = plans.filter(isPriced);
    priced.forEach((p, i) => i && expect(allInNow(priced[i - 1])).toBeLessThanOrEqual(allInNow(p)));
    const firstQuote = plans.findIndex((p) => !isPriced(p));
    if (firstQuote >= 0) expect(plans.slice(firstQuote).every((p) => !isPriced(p))).toBe(true);
  });

  it.each(VALID_SELECTIONS.map((v) => [v.join(" + "), v] as const))("%s gives each label to at most one priced plan", (_, sel) => {
    const { plans } = resultsFor([...sel]);
    const labels = labelsFor(plans);
    const counts: Record<string, number> = {};
    for (const [id, ls] of labels) {
      expect(isPriced(plans.find((p) => p.id === id)!)).toBe(true);
      for (const l of ls) counts[l] = (counts[l] ?? 0) + 1;
    }
    for (const c of Object.values(counts)) expect(c).toBe(1);
  });
});

describe("personalised order (UX review #2)", () => {
  it("keeps every labelled plan in the top group, and the top pick holds a label", () => {
    for (const sel of VALID_SELECTIONS) {
      const { plans } = resultsFor([...sel]);
      const labels = labelsFor(plans);
      const order = displayOrder(plans, labels, { usage: [], devices: 15 });
      const top = order.slice(0, 3).map((p) => p.id);
      for (const id of labels.keys()) expect(top).toContain(id);
      if (labels.size) expect(labels.has(order[0].id)).toBe(true);
    }
  });
  it("puts the fastest plan first for gaming, 4K or many devices; the cheapest otherwise", () => {
    const { plans } = resultsFor(["internet"]);
    const labels = labelsFor(plans);
    const fastestId = [...labels].find(([, l]) => l.includes("fastest"))![0];
    const cheapestId = [...labels].find(([, l]) => l.includes("mostAffordable"))![0];
    expect(displayOrder(plans, labels, { usage: ["gaming"], devices: 15 })[0].id).toBe(fastestId);
    expect(displayOrder(plans, labels, { usage: ["casual"], devices: 80 })[0].id).toBe(fastestId);
    expect(displayOrder(plans, labels, { usage: ["casual"], devices: 10 })[0].id).toBe(cheapestId);
  });
  it("keeps every plan exactly once", () => {
    const { plans } = resultsFor(["internet", "tv"]);
    const order = displayOrder(plans, labelsFor(plans), { usage: ["4k"], devices: 30 });
    expect(order.map((p) => p.id).sort()).toEqual(plans.map((p) => p.id).sort());
  });
});

describe("reasons fit the service and the address (UX review #13, #19)", () => {
  it("never says 'connectivity' or 'technology' for security, phone or mobile plans", () => {
    for (const sel of [["security"], ["phone"], ["mobile"]] as const) {
      const { plans } = resultsFor([...sel]);
      for (const p of plans) expect(planReasons(p, plans[0], "en", "residential").join(" ")).not.toMatch(/connectivity|technology/);
    }
  });
  it("never talks about households to a business", () => {
    const { plans } = resultsFor(["internet"]);
    for (const p of plans) expect(planReasons(p, plans[0], "en", "business").join(" ")).not.toMatch(/household/i);
  });
});

describe("Why This Plan", () => {
  it("only states numbers that are on the plan", () => {
    for (const sel of VALID_SELECTIONS) {
      const { plans } = resultsFor([...sel]);
      const top = plans[0];
      for (const p of plans)
        for (const lang of ["en", "es"] as const) {
          const text = planReasons(p, top, lang).join(" ");
          const sp = speedText(p, lang);
          if (p.id === top.id && sp) expect(text).toContain(sp);
          for (const amt of text.match(/\$[\d,]+\.\d{2}/g) ?? []) expect([money(allInNow(p)), money(allInAfter(p))]).toContain(amt);
        }
    }
  });

  it("says the cheaper plan is cheaper, by the right amount", () => {
    const { plans } = resultsFor(["internet"]);
    const top = plans[0];
    const pricier = plans.find((p) => isPriced(p) && allInNow(p) > allInNow(top))!;
    // A pricier plan doesn't repeat its own price (it's right next to the reasons)
    expect(planReasons(pricier, top, "en").join(" ")).not.toContain(money(allInNow(pricier)));
    const fake = { ...top, id: "x", provider: "Test", pricing: { ...top.pricing, planCents: (top.pricing.kind === "priced" ? top.pricing.planCents : 0) - 500 } } as typeof top;
    expect(planReasons(fake, top, "en").join(" ")).toContain("$5.00/mo less than");
  });
});
