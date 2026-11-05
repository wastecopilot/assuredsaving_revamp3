import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { cssVariables } from "@/lib/tokens";
import { translate } from "@/lib/i18n";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });

/* Same page title as https://www.assuredsaving.com/ */
const title = "Assured Saving | Agentic AI Assistant";
const description = translate("en", "heroDescription");

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Assured Saving", locale: "en_US" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = { themeColor: "#FFF8EE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
