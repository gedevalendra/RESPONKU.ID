import type { Metadata } from "next";
import "./globals.css";
import { homepageDescription, homepageTitle, publicPageMetadata, siteIconPath } from "@/lib/seo";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import WelcomePopup from "./components/layout/WelcomePopup";
import ActionConfirmation from "./components/layout/ActionFeedback";
import CookieConsent from "./components/layout/CookieConsent";
import CopyAttribution from "./components/layout/CopyAttribution";

export const metadata: Metadata = {
  ...publicPageMetadata("/", homepageTitle, homepageDescription),
  // Canonical URLs are declared by each indexable page.
  alternates: undefined,
  icons: { icon: { url: siteIconPath, type: "image/png", sizes: "144x144" } },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="144x144" />
        <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      </head>
      <body className="flex min-h-screen flex-col">
        <CopyAttribution />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WelcomePopup />
        <ActionConfirmation />
        <CookieConsent />
      </body>
    </html>
  );
}
