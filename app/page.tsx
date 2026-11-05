"use client";
import dynamic from "next/dynamic";
import { StoreProvider, STAGE, useStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { Footer, Header, StepTrack } from "@/components/sections/Shell";
import { Hero } from "@/components/sections/Hero";

/* Later steps load on demand, so the first screen stays light. */
const NameSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.NameSection), { ssr: false });
const UsageSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.UsageSection), { ssr: false });
const TvSection = dynamic(() => import("@/components/sections/Steps").then((m) => m.TvSection), { ssr: false });
const ScanSection = dynamic(() => import("@/components/sections/Scan").then((m) => m.ScanSection), { ssr: false });
const ResultsSection = dynamic(() => import("@/components/sections/Results").then((m) => m.ResultsSection), { ssr: false });
const DetailsDrawer = dynamic(() => import("@/components/sections/Details").then((m) => m.DetailsDrawer), { ssr: false });
const CallbackModal = dynamic(() => import("@/components/sections/Callback").then((m) => m.CallbackModal), { ssr: false });

/** Exactly one step on screen: the one the visitor is on. */
function CurrentStep() {
  const { s } = useStore();
  if (s.stage >= STAGE.results && s.scanDone) return <ResultsSection />;
  if (s.stage >= STAGE.scan) return <ScanSection />;
  if (s.stage === STAGE.tv) return <TvSection />;
  if (s.stage === STAGE.usage) return <UsageSection />;
  if (s.stage === STAGE.address) return <NameSection />;
  return <Hero />;
}

/**
 * "Daylight": a photo-led first screen on a warm cream page, then one step at a time in a
 * centred card. The header carries the brand and the official step names (the StepTrack),
 * never step numbers.
 */
function Wizard() {
  const { s, t } = useStore();
  return (
    <ToastProvider closeLabel={t("close")}>
      <div id="wizard-top" className="flex min-h-dvh flex-col overflow-x-clip bg-canvas">
        <Header track={<StepTrack />} />
        <main className="flex-1">
          <CurrentStep key={s.stage >= STAGE.results && s.scanDone ? "results" : s.stage} />
        </main>
        <Footer />
      </div>
      {s.modal.kind === "details" && <DetailsDrawer />}
      {s.modal.kind === "callback" && <CallbackModal />}
    </ToastProvider>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <Wizard />
    </StoreProvider>
  );
}
