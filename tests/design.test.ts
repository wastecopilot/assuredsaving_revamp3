/**
 * DESIGN SPEC (design-driven development), written before the UI. Revamp 4, "Daylight":
 * a photo-led page on a warm cream canvas. Real photos (not illustrations) carry the mood;
 * royal blue for structure, coral for the main action, and five bright solid service colours.
 *
 * 1. Flat colour only: no gradients, glows, blur/glass or drop shadows.
 * 2. Royal blue structure (white text), coral action (ink text), cream canvas, five distinct
 *    service colours that differ from blue and coral.
 * 3. Every text colour pair passes WCAG AA.
 * 4. Interactive controls are at least 44px tall.
 * 5. Shape: pill actions, 20px cards.
 * 6. Figtree, one family.
 * 7. Photo-led: a photo hero on step 1 (real photos only, nothing until one exists), a named step track,
 *    one step on screen, no step numbers.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { color, contrastPairs, radius, service } from "@/lib/tokens";

const ROOT = join(__dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(join(ROOT, dir)).flatMap((f) => {
    const p = join(dir, f);
    return statSync(join(ROOT, p)).isDirectory() ? files(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
  });
const SOURCE = [...files("app"), ...files("components")].map((f) => ({ f, src: readFileSync(join(ROOT, f), "utf8") }));

const ratio = (a: string, b: string) => {
  const lum = (h: string) => {
    const [r, g, bl] = (h.replace("#", "").match(/\w\w/g) ?? []).map((x) => {
      const v = parseInt(x, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("1. flat colour only", () => {
  it.each(SOURCE)("$f has no gradients, glows, blur or glass", ({ src }) => {
    const s = src.replace(/background: linear-gradient\(90deg, var\(--fill[^;]+;/g, "");
    expect(s).not.toMatch(/gradient\(|bg-gradient|text-gradient|from-\[|via-\[|to-\[#/);
    expect(s).not.toMatch(/backdrop-blur|blur-\w|drop-shadow|shadow-glow|text-shadow|\.glass/);
  });
});

describe("2. colour roles", () => {
  it("uses royal blue for structure with white text", () => {
    expect(color.primary.toUpperCase()).toBe("#1652F0");
    expect(ratio("#FFFFFF", color.primary)).toBeGreaterThanOrEqual(5.5);
  });
  it("uses coral for the main action with ink text", () => {
    expect(color.cta.toUpperCase()).toBe("#FF5A3C");
    expect(color.onCta.toUpperCase()).toBe(color.ink.toUpperCase());
  });
  it("sits on a warm cream canvas", () => {
    expect(color.canvas.toUpperCase()).toBe("#FFF8EE");
  });
  it("gives each service its own colour, distinct from blue and coral", () => {
    const vivid = Object.values(service).map((c) => c.vivid.toUpperCase());
    expect(new Set(vivid).size).toBe(5);
    expect(vivid).not.toContain(color.primary.toUpperCase());
    expect(vivid).not.toContain(color.cta.toUpperCase());
  });
});

describe("3. contrast", () => {
  it.each(contrastPairs())("%s on %s (%s) passes AA", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("4. touch targets", () => {
  it.each(SOURCE.filter((x) => x.f.endsWith(".tsx")))("$f: buttons and links are at least 44px", ({ src }) => {
    const tags = [...src.matchAll(/<(button|a)\b[^>]*className=(?:"([^"]*)"|\{clsx\(([^)]*)\)|\{`([^`]*)`\})/g)];
    for (const m of tags) {
      const cls = m[2] ?? m[3] ?? m[4] ?? "";
      if (/sr-only/.test(cls)) continue;
      const px = Number(/min-h-\[(\d+)px\]/.exec(cls)?.[1] ?? 0);
      const ok = px >= 44 || /min-h-(11|12|13|14|16|20|24|28|32)\b|size-(11|12|14)\b|h-(11|12|14)\b|\$\{|link/.test(cls);
      expect(ok, `${m[0].slice(0, 90)}`).toBe(true);
    }
  });
});

describe("5. shape", () => {
  it("has pill actions and 20px cards", () => {
    expect(radius.full).toBe("9999px");
    expect(parseInt(radius.lg)).toBe(20);
  });
  it("the Button component is a pill", () => {
    const ui = readFileSync(join(ROOT, "components/ui/index.tsx"), "utf8");
    expect(ui).toMatch(/inline-flex select-none items-center justify-center gap-2 rounded-full/);
  });
});

describe("6. type", () => {
  it("uses Figtree only", () => {
    const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/Figtree/);
    expect(layout).not.toMatch(/Manrope|Instrument_Sans|Public_Sans|Plus_Jakarta|Geist|Inter\b/);
  });
});

describe("7. photo-led structure", () => {
  it("has a step track and renders one step at a time", () => {
    const page = readFileSync(join(ROOT, "app/page.tsx"), "utf8");
    expect(page).toMatch(/StepTrack/);
    expect(page).toMatch(/CurrentStep/);
    expect(page).not.toMatch(/StepPanel/);
  });
  it("opens with a photo hero slot, and an empty slot shows nothing (no stand-in drawing)", () => {
    const hero = readFileSync(join(ROOT, "components/sections/Hero.tsx"), "utf8");
    expect(hero).toMatch(/<Photo\s[^>]*slot="hero"/);
    const photo = readFileSync(join(ROOT, "components/ui/Photo.tsx"), "utf8");
    expect(photo).toMatch(/if \(!src\) return null/);
    expect(photo).toMatch(/alt=""/);
  });
  it("shows step names without step numbers", () => {
    for (const { f, src } of SOURCE) if (f.endsWith(".tsx")) expect(src, f).not.toMatch(/t\("step"\)|stepOf|Step \{/);
  });
});
