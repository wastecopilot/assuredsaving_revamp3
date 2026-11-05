"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { sectionId, useStore, type StageName } from "@/lib/store";
import { Photo, type PhotoSlot } from "../ui/Photo";
import { Summary } from "./Shell";

/**
 * One step on screen: Back and the visitor's answers above a white card. The card opens
 * with a photo banner for the step (the address, how they use the internet, TV), then the
 * question. `wide` (results) drops the card and uses the full width.
 */
export function Section({ stage, children, className, wide, photo }: { stage: StageName; children: ReactNode; className?: string; wide?: boolean; tone?: "plain" | "warm"; photo?: "place" | "usage" | "tv" }) {
  const reduce = useReducedMotion();
  const { s } = useStore();
  const placeSlot: PhotoSlot = s.address?.type === "business" ? "business" : "home";
  return (
    <motion.section
      id={sectionId(stage)}
      aria-labelledby={`${sectionId(stage)}-h`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.28, ease: [0.2, 0, 0, 1] }}
      className={clsx("scroll-mt-20", className)}
    >
      <div className={clsx("mx-auto px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8", wide ? "max-w-6xl" : "max-w-3xl")}>
        <BackLink />
        <Summary />
        {wide ? (
          children
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {photo && (
              <Photo
                slot={photo === "place" ? placeSlot : photo}
                sizes="(min-width: 768px) 768px, 100vw"
                className="h-28 sm:h-44 [@media(max-height:500px)]:hidden"
              />
            )}
            <div className="p-5 sm:p-8">{children}</div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function BackLink() {
  const { s, dispatch, t } = useStore();
  if (s.stage === 0) return null;
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "back" })}
      className="press -ml-3 mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink hover:bg-surface2"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {t("back")}
    </button>
  );
}

/** Question heading: optional eyebrow, a title with one phrase in royal blue, a subtitle. */
export function Heading({ id, eyebrow, a, b, after, sub }: { id: string; eyebrow?: string; a: string; b?: string; after?: string; sub?: string; dark?: boolean }) {
  return (
    <div className="mb-7">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-link">{eyebrow}</p>}
      <h2 id={id} tabIndex={-1} className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink outline-none sm:text-[2.25rem]">
        {a} {b && <span className="text-primary">{b}</span>}
        {after}
      </h2>
      {sub && <p className="mt-2 text-base text-muted sm:text-lg">{sub}</p>}
    </div>
  );
}

/** The step's main action. On phones it sticks to the bottom of the screen. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-5 mt-8 border-t border-line bg-surface px-5 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 [@media(max-height:500px)]:static">
      {children}
    </div>
  );
}
