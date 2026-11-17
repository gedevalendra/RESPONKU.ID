import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import WelcomePopup from "./components/layout/WelcomePopup";

export const metadata: Metadata = {
  title: "ResponKu. — Kabar Hari Ini, Ditulis dengan Jelas",
  description:
    "ResponKu. menyajikan berita ekonomi, teknologi, politik, olahraga, dan budaya secara ringkas dan berimbang.",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WelcomePopup />
      </body>
    </html>
  );
}
