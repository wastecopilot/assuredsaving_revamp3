import Image from "next/image";
import clsx from "clsx";
import photos from "@/lib/photos.gen.json";

/** The photo slots. Files go in public/photos/<slot>.jpg (see docs/image-prompts.md). */
export type PhotoSlot = "hero" | "home" | "business" | "usage" | "tv";

const SRC = photos as Partial<Record<PhotoSlot, string>>;
/** True when public/photos has a real photo for this slot. */
export const hasPhoto = (slot: PhotoSlot) => !!SRC[slot];

/**
 * A real photo, or nothing at all: until a photo exists for a slot, the layout simply
 * closes up around it (no placeholder drawing as a fallback, no broken image). Photos are
 * decorative (alt=""): every fact they hint at is also in text.
 */
export function Photo({ slot, className, priority, sizes = "(min-width: 1024px) 50vw, 100vw", position = "center" }: { slot: PhotoSlot; className?: string; priority?: boolean; sizes?: string; position?: string }) {
  const src = SRC[slot];
  if (!src) return null;
  return (
    <div className={clsx("relative overflow-hidden", className)} data-photo={slot}>
      <Image src={src} alt="" fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}
