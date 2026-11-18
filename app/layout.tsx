import type { Metadata } from "next";
import "./globals.css";
import { siteIconPath, siteOrigin, websiteCover } from "@/lib/seo";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import WelcomePopup from "./components/layout/WelcomePopup";
import ActionConfirmation from "./components/layout/ActionFeedback";
import CookieConsent from "./components/layout/CookieConsent";
import CopyAttribution from "./components/layout/CopyAttribution";

const siteTitle = "ResponKu. — Kabar Hari Ini, Ditulis dengan Jelas";
const siteDescription =
  "ResponKu. menyajikan berita ekonomi, teknologi, politik, olahraga, dan budaya secara ringkas dan berimbang.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  icons: { icon: { url: siteIconPath, type: "image/png", sizes: "144x144" } },
  openGraph: {
    type: "website",
    url: siteOrigin,
    siteName: "ResponKu",
    locale: "id_ID",
    title: siteTitle,
    description: siteDescription,
    images: [websiteCover],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [websiteCover],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
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
