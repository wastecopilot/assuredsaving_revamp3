/**
 * Lists the photos present in public/photos (hero, home, business, usage, tv) into
 * lib/photos.gen.json, so the page uses a real photo when one exists and a flat drawing
 * when it doesn't. Run by `npm run copy` (prebuild).
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname, "..", "public", "photos");
const out: Record<string, string> = {};
for (const f of readdirSync(dir)) {
  const m = /^([a-z]+)\.(jpe?g|webp|png|avif)$/i.exec(f);
  if (m) out[m[1].toLowerCase()] = `/photos/${f}`;
}
writeFileSync(join(__dirname, "..", "lib", "photos.gen.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`photos: ${Object.keys(out).join(", ") || "none yet (flat fallbacks in use)"}`);
