
import type { Metadata } from "next";
import "./globals.css";
import {
  homepageDescription,
  homepageTitle,
  publicPageMetadata,
} from "@/lib/seo";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import WelcomePopup from "./components/layout/WelcomePopup";
import ActionConfirmation from "./components/layout/ActionFeedback";
import CookieConsent from "./components/layout/CookieConsent";
import CopyAttribution from "./components/layout/CopyAttribution";
import { getWebsiteStatus } from "@/lib/website-status";
// as
export const metadata: Metadata = {
  ...publicPageMetadata("/", homepageTitle, homepageDescription),

  // Canonical URLs are declared by each indexable page.
  alternates: undefined,

  // Favicon
  icons: {
    icon: {
      url: "/favicon.ico?v=2",
      type: "image/x-icon",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteStatus = await getWebsiteStatus();
  const popupsEnabled = websiteStatus.status === "online";
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon"/>
        <link
          rel="stylesheet"
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
        />
      </head>

      <body className="flex min-h-screen flex-col">
        <CopyAttribution />

        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />

        {popupsEnabled && <WelcomePopup />}
        {popupsEnabled && <ActionConfirmation />}
        {popupsEnabled && <CookieConsent />}
      </body>
    </html>
  );
}
