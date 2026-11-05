/**
 * Address autocomplete, ported from the original one-pager
 * (github.com/wastecopilot/assuredsaving, app/lib/data.ts · getAddressSuggestions).
 *
 * MOCKED, no real lookup:
 * - Fixed suggestions match first (inclusive, any part of the address).
 * - When fewer than 3 match and the query starts with a street number, sample US
 *   addresses are built from what was typed. Without a street number nothing is
 *   built (the official site asks for one), so the official error shows instead.
 * - Every suggestion carries its own address type (residential or business),
 *   so the visitor never chooses it. Typed text with business words such as
 *   "Suite" or "Office" is always treated as business.
 */
import { ADDRESS_TEMPLATES, ADDRESSES, type AddressType, type SampleAddress } from "@/data/catalog";

/** Words that mark a commercial address. Apartment markers (Apt, Unit, #) stay residential. */
const BUSINESS_HINTS =
  /\b(suite|ste\.?|floor|office|offices|plaza|center|centre|commerce|commercial|business|industrial|corporate|tower|mall|warehouse|depot|tech park|office park|business park)\b/i;

export const hasBusinessHint = (text: string) => BUSINESS_HINTS.test(text);
export const formatAddress = (a: SampleAddress) => `${a.line1}, ${a.city}, ${a.state} ${a.zip}`.trim();

/** US states by time zone (mock lookup for typed addresses; the majority zone per state). */
const ZONES: Record<string, string[]> = {
  "America/New_York": ["CT", "DC", "DE", "FL", "GA", "IN", "KY", "MA", "MD", "ME", "MI", "NC", "NH", "NJ", "NY", "OH", "PA", "RI", "SC", "VA", "VT", "WV"],
  "America/Chicago": ["AL", "AR", "IA", "IL", "KS", "LA", "MN", "MO", "MS", "ND", "NE", "OK", "SD", "TN", "TX", "WI"],
  "America/Denver": ["CO", "ID", "MT", "NM", "UT", "WY"],
  "America/Phoenix": ["AZ"],
  "America/Los_Angeles": ["CA", "NV", "OR", "WA"],
  "America/Anchorage": ["AK"],
  "Pacific/Honolulu": ["HI"],
};
const ZONE_OF = new Map(Object.entries(ZONES).flatMap(([z, states]) => states.map((s) => [s, z] as const)));

/** "123 Main St, Dallas, TX 75201" -> the typed city, state and ZIP (null if no valid US state). */
function typedLocality(cleaned: string): { city: string; state: string; zip: string } | null {
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const tail = parts.slice(1).join(" ");
  const m = /^(.*?)[\s,]+([A-Za-z]{2})(?:\s+(\d{5}))?$/.exec(tail);
  if (!m) return null;
  const state = m[2].toUpperCase();
  if (!ZONE_OF.has(state) || !m[1].trim()) return null;
  return { city: titleCase(m[1].trim().toLowerCase()).slice(0, 40), state, zip: m[3] ?? "" };
}
const titleCase = (s: string) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());

export function getAddressSuggestions(query: string): SampleAddress[] {
  const cleaned = query.normalize("NFC").replace(/[\p{Cc}\p{Cf}]/gu, "").trim();
  if (!cleaned) return [];
  const needle = cleaned.toLowerCase();

  const base = ADDRESSES.filter((a) => formatAddress(a).toLowerCase().includes(needle));
  if (base.length >= 3) return base.slice(0, 5);
  // The official site asks for a street number; without one, only fixed matches.
  if (!/^\d/.test(cleaned)) return base.slice(0, 5);

  // Street part only (ignore any city typed after a comma). Capped to a sane length.
  const typed = titleCase(cleaned.split(",")[0].replace(/\s+/g, " ").trim()).slice(0, 80);
  // Just a house number? Put it in front of the template street, like the original.
  const onlyNumber = /^\d+[A-Za-z]?$/.test(typed);

  // A full address with city and state: suggest exactly what was typed.
  const loc = onlyNumber ? null : typedLocality(cleaned);
  if (loc) {
    return [
      {
        id: `typed-${typed.toLowerCase()}-${loc.city.toLowerCase()}-${loc.state}`,
        line1: typed,
        ...loc,
        timeZone: ZONE_OF.get(loc.state)!,
        type: hasBusinessHint(typed) ? "business" : "residential",
      },
    ];
  }

  const taken = new Set(base.map((a) => formatAddress(a).toLowerCase()));
  const built = ADDRESS_TEMPLATES.map((tpl, i): SampleAddress => {
    const line1 = onlyNumber ? `${typed} ${tpl.street}` : typed;
    return {
      id: `typed-${i}-${line1.toLowerCase()}`,
      line1,
      city: tpl.city,
      state: tpl.state,
      zip: tpl.zip,
      timeZone: tpl.timeZone,
      type: hasBusinessHint(line1) ? "business" : tpl.type,
    };
  })
    .filter((a) => !taken.has(formatAddress(a).toLowerCase()))
    // Home addresses first for a plain street, so a quick tap doesn't land on a business address
    .sort((a, b) => Number(a.type === "business") - Number(b.type === "business"));

  return [...base, ...built].slice(0, 5);
}

export type { AddressType };
