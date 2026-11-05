/**
 * DESIGN TOKENS (single source of truth; checked by tests/design.test.ts).
 *
 * Revamp 4, "Daylight": a warm cream page led by real photos. Royal blue for structure,
 * coral for the one main action (ink text), and a bright solid colour per service.
 * Flat only: no gradients, glows or glass.
 */
import type { ServiceId } from "@/data/catalog";

export const color = {
  ink: "#0F172A",
  muted: "#4A5468",
  line: "#EADFCB",
  lineStrong: "#CDBFA6",
  canvas: "#FFF8EE", // warm cream
  surface: "#FFFFFF",
  surface2: "#FFF1DC", // deeper cream band
  primary: "#1652F0", // royal blue: structure, selected states, links
  primaryStrong: "#0E3FC4",
  primarySoft: "#E6EDFF",
  onPrimary: "#FFFFFF",
  cta: "#FF5A3C", // coral: the main action
  ctaStrong: "#F04423",
  onCta: "#0F172A",
  link: "#1446D6",
  focus: "#0F172A",
  danger: "#B42318",
  dangerSoft: "#FEF3F2",
  success: "#067647",
  successSoft: "#E7F8EE",
  warning: "#8A4B00",
  warningSoft: "#FFF4D6",
  navy: "#0F172A",
  navy2: "#1E293B",
  navyLine: "#334155",
  onDark: "#FFFFFF",
  onDarkMuted: "#E2E8F0",
  accent: "#FF5A3C",
} as const;

/** One solid colour per service: vivid = fill · on = text on fill · text = AA text on white/cream · soft = tint. */
export const service: Record<ServiceId, { vivid: string; on: string; text: string; soft: string }> = {
  internet: { vivid: "#00C2E0", on: "#0F172A", text: "#03708A", soft: "#DFF7FB" },
  tv: { vivid: "#FF4F9A", on: "#0F172A", text: "#B5175E", soft: "#FFE6F1" },
  phone: { vivid: "#B6E94A", on: "#0F172A", text: "#4D7008", soft: "#F1FADC" },
  mobile: { vivid: "#FFD400", on: "#0F172A", text: "#7A5A00", soft: "#FFF6CC" },
  security: { vivid: "#22C55E", on: "#0F172A", text: "#08733A", soft: "#E3F8EB" },
};

export const type = {
  xs: ["0.75rem", "1rem"],
  sm: ["0.875rem", "1.375rem"],
  base: ["1rem", "1.5rem"],
  lg: ["1.125rem", "1.75rem"],
  xl: ["1.25rem", "1.75rem"],
  "2xl": ["1.5rem", "2rem"],
  "3xl": ["2rem", "2.375rem"],
  "4xl": ["2.75rem", "1.05"],
  "5xl": ["3.75rem", "1"],
} as const;

export const space = { unit: 4 };
export const radius = { sm: "10px", md: "14px", lg: "20px", full: "9999px" };
export const shadow = {
  sm: "0 1px 2px rgb(20 20 20 / 0.05)",
  md: "0 1px 2px rgb(20 20 20 / 0.06)",
  lg: "0 8px 24px -12px rgb(20 20 20 / 0.18)",
  overlay: "0 24px 48px -16px rgb(20 20 20 / 0.28)",
};
export const motion = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 500, damping: 40 },
  soft: { type: "spring" as const, stiffness: 320, damping: 36 },
};

export function contrastPairs(): [string, string, string][] {
  const p: [string, string, string][] = [
    [color.ink, color.canvas, "ink/canvas"],
    [color.ink, color.surface2, "ink/surface2"],
    [color.muted, color.canvas, "muted/canvas"],
    [color.muted, color.surface2, "muted/surface2"],
    [color.onPrimary, color.primary, "white on blue"],
    [color.onPrimary, color.primaryStrong, "white on blue hover"],
    [color.onCta, color.cta, "ink on coral"],
    [color.onCta, color.ctaStrong, "ink on coral hover"],
    [color.onDarkMuted, color.ink, "soft white on ink"],
    [color.ink, color.primarySoft, "ink/primarySoft"],
    [color.primary, color.primarySoft, "blue/primarySoft"],
    [color.link, color.canvas, "link/canvas"],
    [color.link, color.surface2, "link/surface2"],
    [color.link, color.primarySoft, "link/primarySoft"],
    [color.danger, color.canvas, "danger/canvas"],
    [color.danger, color.dangerSoft, "danger/dangerSoft"],
    [color.success, color.canvas, "success/canvas"],
    [color.success, color.successSoft, "success/successSoft"],
    [color.warning, color.warningSoft, "warning/warningSoft"],
    [color.onDark, color.ink, "white/ink"],
  ];
  for (const [k, c] of Object.entries(service)) {
    p.push([c.on, c.vivid, `${k} on/vivid`], [c.text, color.canvas, `${k} text/canvas`], [c.text, c.soft, `${k} text/soft`]);
  }
  return p;
}

export function cssVariables(): string {
  const v: string[] = [];
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/(\D)(\d)/, "$1-$2");
  for (const [k, c] of Object.entries(color)) v.push(`--${kebab(k)}:${c}`);
  for (const [k, c] of Object.entries(service)) v.push(`--${k}:${c.vivid}`, `--${k}-on:${c.on}`, `--${k}-text:${c.text}`, `--${k}-soft:${c.soft}`);
  for (const [k, s] of Object.entries(shadow)) v.push(`--sh-${k}:${s}`);
  return `:root{${v.join(";")}}`;
}
