/**
 * UI/UX INTEGRATION TESTS: the whole page, driven the way a visitor would.
 * Step 1 follows the official home page: services + address + "Check Availability".
 * Also: every visible text node is official copy or sample data, and axe-core finds
 * no accessibility violations at each step.
 */
import React, { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import official from "@/data/official-copy.json";
import { ADDRESSES, DIRECTV_TIERS, PLANS } from "@/data/sample";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<React.ComponentType<Record<string, unknown>>>) => {
    const Lazy = React.lazy(async () => ({ default: await loader() }));
    const Dyn = (p: Record<string, unknown>) => (
      <Suspense fallback={null}>
        <Lazy {...p} />
      </Suspense>
    );
    return Dyn;
  },
}));

import Page from "@/app/page";

type User = ReturnType<typeof userEvent.setup>;
const hero = () => document.getElementById("section-intent") as HTMLElement;
const svc = (name: string) => within(hero()).getByRole("button", { name: new RegExp(`^${name}$`) });
const pressed = () => ["Internet", "TV", "Landline", "Mobile", "Home Security"].filter((n) => svc(n).getAttribute("aria-pressed") === "true");
const check = () => within(hero()).getByRole("button", { name: "Check Availability" });

async function start() {
  const user = userEvent.setup();
  render(<Page />);
  return user;
}

/** Services + address on step 1, then Check Availability. */
async function step1(user: User, services: string[], query: string, pick: RegExp) {
  for (const s of services) await user.click(svc(s));
  await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), query);
  await user.click(await screen.findByRole("option", { name: pick }));
  await user.click(check());
}

async function toUsage(user: User, services: string[], query = "6585", pick = /Crescent Drive/) {
  await step1(user, services, query, pick);
  const name = await screen.findByLabelText("Your full name", undefined, { timeout: 10000 });
  await user.type(name, "Jordan Rivera");
  await user.click(within(document.getElementById("section-address")!).getByRole("button", { name: "Continue" }));
}

async function noAxeViolations() {
  const r = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
}

describe("step 1: services and address", () => {
  it("follows the official selection rules", async () => {
    const user = await start();
    await user.click(svc("Internet"));
    await user.click(svc("TV"));
    expect(pressed()).toEqual(["Internet", "TV"]);
    await user.click(svc("Landline"));
    expect(pressed()).toEqual(["Internet", "TV", "Landline"]);
    await user.click(svc("Home Security"));
    expect(pressed()).toEqual(["Home Security"]);
    await user.click(svc("Mobile"));
    expect(pressed()).toEqual(["Mobile"]);
    await user.click(svc("Internet"));
    expect(pressed()).toEqual(["Internet"]);
  });

  it("asks for a service and an address before checking availability", async () => {
    const user = await start();
    await user.click(check());
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a service above, then pick your address");
    await user.click(svc("Internet"));
    await user.click(check());
    // With a service chosen, the field points at what's missing: the address
    expect(within(hero()).getByRole("combobox", { name: "Search USA address" })).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById("section-address")).toBeNull();
  });

  it("bundle shortcuts select the official combinations", async () => {
    const user = await start();
    await user.click(within(hero()).getByRole("button", { name: /Quad Play/ }));
    expect(pressed()).toEqual(["Internet", "TV", "Landline", "Mobile"]);
  });

  it("shows the official error when nothing matches", async () => {
    const user = await start();
    await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), "zzzz");
    expect(await screen.findByText("Include State (e.g. NY, CA) and a street number")).toBeInTheDocument();
  });

  it("step 1 has no accessibility violations", async () => {
    await start();
    await noAxeViolations();
  });
});

describe("UX review fixes on step 1", () => {
  it("shows the official example hint before the first try (UX #7)", async () => {
    await start();
    expect(screen.getByText("Type your full US address, e.g. 123 Main St, Dallas, TX 75201")).toBeInTheDocument();
  });

  it("asks for a street number when one is missing, not 'US addresses only' (UX #7)", async () => {
    const user = await start();
    await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), "Main Street Dallas");
    expect(await screen.findByText("Include State (e.g. NY, CA) and a street number")).toBeInTheDocument();
    expect(screen.queryByText("US addresses only — please pick from the list")).toBeNull();
  });

  it("only blames services when no service is chosen; otherwise points at the address (UX #7)", async () => {
    const user = await start();
    await user.click(svc("Internet"));
    await user.click(check());
    expect(screen.queryByText("Choose a service above, then pick your address")).toBeNull();
    expect(within(hero()).getByRole("combobox", { name: "Search USA address" })).toHaveFocus();
  });

  it("moves focus to the business panel and announces it (UX #8)", async () => {
    const user = await start();
    await user.click(svc("Mobile"));
    await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), "658");
    await user.click(await screen.findByRole("option", { name: /658 FL-60/ }));
    await user.click(check());
    const panel = screen.getByRole("alert");
    expect(panel).toHaveTextContent("Business address detected");
    await waitFor(() => expect(panel).toHaveFocus());
  });

  it("swaps to the official 'Let's Get the Right Deal' headline when Internet isn't chosen (UX #22)", async () => {
    const user = await start();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find the Best Internet");
    await user.click(svc("Home Security"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Let's Get the Right Deal");
  });
});

describe("business addresses", () => {
  it("offers only Internet or Internet + TV Bundle, then continues to the name step", async () => {
    const user = await start();
    await step1(user, ["Internet", "TV", "Mobile"], "658", /658 FL-60/);
    expect(within(hero()).getByText("Business Address")).toBeInTheDocument();
    const chooser = await screen.findByLabelText("Business address detected");
    expect(document.getElementById("section-address")).toBeNull();
    await user.click(within(chooser).getByRole("button", { name: "Internet + TV Bundle" }));
    expect(await screen.findByLabelText("Your full name", undefined, { timeout: 10000 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(pressed()).toEqual(["Internet", "TV"]);
  });

  it("from a non-internet service, goes through name and usage, never straight to the scan", async () => {
    const user = await start();
    await step1(user, ["Mobile"], "6580", /Fannin Street/);
    await user.click(within(await screen.findByLabelText("Business address detected")).getByRole("button", { name: "Internet" }));
    const name = await screen.findByLabelText("Your full name", undefined, { timeout: 10000 });
    await user.type(name, "Jordan Rivera");
    await user.click(within(document.getElementById("section-address")!).getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: /use the internet/ })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 1500));
    expect(screen.queryByText("Assured Saving Agent — Live")).toBeNull();
  });
});

describe("name, usage and going back", () => {
  it("only continues from the name step with a real name", async () => {
    const user = await start();
    await step1(user, ["Internet"], "6585", /Crescent Drive/);
    const name = await screen.findByLabelText("Your full name", undefined, { timeout: 10000 });
    const cont = within(document.getElementById("section-address")!).getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    await user.type(name, "J");
    expect(cont).toBeDisabled();
    await user.type(name, "ordan");
    expect(cont).toBeEnabled();
    expect(screen.getByText("Welcome, Jordan!")).toBeInTheDocument();
  });

  it("lets you continue again after going Back (no dead end)", async () => {
    const user = await start();
    await toUsage(user, ["Internet"]);
    await screen.findByRole("heading", { name: /use the internet/ });
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(screen.queryByRole("heading", { name: /use the internet/ })).toBeNull();
    await user.click(within(document.getElementById("section-address")!).getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: /use the internet/ })).toBeInTheDocument();
  });

  it("the browser's Back button returns to the previous step instead of leaving (UX #1)", async () => {
    const user = await start();
    await toUsage(user, ["Internet"]);
    await screen.findByRole("heading", { name: /use the internet/ });
    window.history.back();
    await waitFor(() => expect(screen.queryByRole("heading", { name: /use the internet/ })).toBeNull());
    expect(document.getElementById("section-address")).not.toBeNull();
  });

  it("a reload keeps the visitor's progress in this tab (UX #1)", async () => {
    const user = await start();
    await toUsage(user, ["Internet"]);
    await screen.findByRole("heading", { name: /use the internet/ });
    cleanup();
    render(<Page />);
    expect(await screen.findByRole("heading", { name: /use the internet/ }, { timeout: 10000 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(await screen.findByDisplayValue("Jordan Rivera")).toBeInTheDocument();
  });

  it("shows exactly one step at a time, so finished steps have no live buttons (UX #3)", async () => {
    const user = await start();
    await toUsage(user, ["Internet", "TV"]);
    await user.click(await screen.findByRole("button", { name: /Remote Work/ }));
    await user.click(screen.getByRole("button", { name: "Find TV Plans" }));
    await screen.findByRole("heading", { name: /perfect bundle/ });
    expect(document.querySelectorAll("main section[id^='section-']:not([aria-labelledby^='g-'])")).toHaveLength(1);
    for (const id of ["intent", "address", "usage"]) expect(document.getElementById(`section-${id}`)).toBeNull();
    expect(screen.queryByRole("button", { name: /Find TV Plans|Continue/ })).toBeNull();
  });

  it("keeps usage answers when services change, and asks before starting over (UX #4)", async () => {
    const user = await start();
    await toUsage(user, ["Internet"]);
    await user.click(await screen.findByRole("button", { name: /Remote Work/ }));
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    await user.click(await screen.findByRole("button", { name: "Back", exact: true } as never));
    await user.click(svc("TV"));
    await user.click(check());
    await user.click(within(await screen.findByRole("region", { name: /full name/i }, { timeout: 10000 })).getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("button", { name: /Remote Work/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getAllByRole("button", { name: /Start a new search/ })[0]); // phone and desktop copies; CSS shows one
    expect(screen.getAllByRole("button", { name: "Cancel" }).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    expect(screen.getByRole("button", { name: /Remote Work/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getAllByRole("button", { name: /Start a new search/ })[0]); // phone and desktop copies; CSS shows one
    await user.click(screen.getByRole("button", { name: "Start Over" }));
    expect(pressed()).toEqual([]);
  });

  it("Back from usage returns through the name step to step 1, with answers kept", async () => {
    const user = await start();
    await toUsage(user, ["Internet"]);
    await screen.findByRole("heading", { name: /use the internet/ });
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(await screen.findByDisplayValue("Jordan Rivera")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(pressed()).toEqual(["Internet"]);
    expect(within(hero()).getByText("Address Found")).toBeInTheDocument();
    expect(document.getElementById("section-address")).toBeNull();
  });
});

describe("full flow to results", () => {
  it("Internet + TV at a home address", { timeout: 60000 }, async () => {
    const user = await start();
    await toUsage(user, ["Internet", "TV"]);
    const usageCta = await screen.findByRole("button", { name: "Pick how you use the internet" });
    expect(usageCta).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Remote Work/ }));
    await noAxeViolations();
    await user.click(screen.getByRole("button", { name: "Find TV Plans" }));

    const tvCta = await screen.findByRole("button", { name: 'Answer "do you have internet" above to continue' });
    expect(tvCta).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Find my bundle" }));

    expect(await screen.findByText("Assured Saving Agent — Live")).toBeInTheDocument();
    await screen.findByRole("heading", { name: /plans available/ }, { timeout: 10000 });
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
    expect(screen.getByText("Our Top Pick")).toBeInTheDocument();

    auditText();
    await noAxeViolations();

    // The step panel names the step (no numbers), and Back from results skips the automatic scan
    expect(within(screen.getByRole("banner")).getByText("Details")).toBeInTheDocument();
    expect(screen.getByRole("banner").textContent).not.toMatch(/Step \d/);
    await user.click(screen.getByRole("button", { name: "Back", exact: true } as never));
    expect(await screen.findByRole("heading", { name: /perfect bundle/ })).toBeInTheDocument();
    expect(screen.queryByText("Assured Saving Agent — Live")).toBeNull();
  });
});

describe("photos", () => {
  it("shows the real photos: the hero, then the business photo on the Address Found card", async () => {
    const user = await start();
    const heroPhoto = document.querySelector("[data-photo='hero'] img")!;
    expect(heroPhoto).toHaveAttribute("alt", "");
    await user.click(svc("Internet"));
    await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), "658");
    await user.click(await screen.findByRole("option", { name: /658 FL-60/ }));
    expect(document.querySelector("[data-photo='business'] img")).not.toBeNull();
    expect(screen.getByText("Business Address")).toBeInTheDocument();
    expect(screen.getByText("Your Address")).toBeInTheDocument();
  });

  it("names only the steps the official site shows (no 'Intent')", async () => {
    const user = await start();
    await step1(user, ["Internet"], "6585", /Crescent Drive/);
    await screen.findByLabelText("Your full name", undefined, { timeout: 10000 });
    expect(screen.getByRole("banner")).not.toHaveTextContent("Intent");
    expect(document.querySelector("[data-photo='home'] img")).not.toBeNull();
  });
});

describe("wizard", () => {
  it("accepts a full address typed but not picked from the list (pen test r3 #4)", async () => {
    const user = await start();
    await user.click(svc("Internet"));
    await user.type(within(hero()).getByRole("combobox", { name: "Search USA address" }), "6585 Crescent Drive, Norcross, GA 30071");
    await user.click(check());
    expect(within(hero()).getByText("Address Found")).toBeInTheDocument();
    await user.click(check());
    expect(await screen.findByLabelText("Your full name", undefined, { timeout: 10000 })).toBeInTheDocument();
  });

  it("names each step in the header track and keeps the visitor's answers above the card", async () => {
    const user = await start();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find the Best Internet");
    await step1(user, ["Internet"], "6585", /Crescent Drive/);
    await screen.findByLabelText("Your full name", undefined, { timeout: 10000 });
    const panel = screen.getByRole("banner");
    expect(within(panel).getByText("Name & Address")).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText(/Crescent Drive/)).toBeInTheDocument();
    expect(panel.querySelector("[aria-current='step']")).toHaveTextContent("Name & Address");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    await noAxeViolations();
  });
});

/** Every text node must be official copy, a filled-in official template, or sample data. */
function auditText() {
  type Tree = { [k: string]: string | Tree };
  const flat = (o: Tree, out: string[] = []): string[] => {
    for (const v of Object.values(o)) {
      if (typeof v === "string") out.push(v);
      else flat(v, out);
    }
    return out;
  };
  const officialText = [
    ...flat(official.dict.en as unknown as Tree),
    ...Object.keys(official.inline),
    official.consent.call.en,
    official.consent.sms.en,
    ...Object.values(official.nav as Record<string, { en: { title: string } }>).map((n) => n.en.title),
  ].map((s) => s.replace(/^(📞\s|←\s)/, "").trim());
  const exact = new Set(officialText);
  const templates = officialText
    .filter((s) => /\{\w+\}/.test(s))
    .map((s) => new RegExp("^" + s.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\\\$\{\w+\}|\{\w+\}/g, ".+") + "$"));
  const data = new Set<string>([
    ...PLANS.flatMap((p) => [p.provider, p.name, ...(p.includes?.map((i) => i.en) ?? [])]),
    ...ADDRESSES.flatMap((a) => [a.line1, a.city, a.state, a.zip]),
    ...DIRECTV_TIERS.map((t) => t.name),
    "Jordan", "Jordan Rivera", "J", "ENG", "ESP", "?",
  ]);
  const numeric = /^[\s$#.,:·•|/+\-–()%0-9a-zA-Z]{0,3}[\d$][\d\s$.,:·•/+\-–()%]*(Mbps|Gbps|GB|mo|\/mo|\+)?[\s.,)]*$/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const bad: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent ?? "").trim();
    if (!t) continue;
    const el = n.parentElement;
    if (el?.closest("[aria-hidden='true'], script, style, .sr-only")) continue;
    const ok = /^[\p{P}\p{S}]+$/u.test(t) || exact.has(t) || data.has(t) || numeric.test(t) || templates.some((r) => r.test(t)) || [...data].some((d) => t.includes(d) && t.replace(d, "").replace(/[,\s\d]/g, "") === "");
    if (!ok) bad.push(t);
  }
  expect([...new Set(bad)]).toEqual([]);
}
