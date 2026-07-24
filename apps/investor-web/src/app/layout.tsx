import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../components/AppProviders";

export const metadata: Metadata = {
  title: "Diaspora Trust — Suivi ferme & chantier",
  description:
    "Suivez vos investissements agricoles et vos chantiers à Kinshasa et Cotonou, en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Mapbox GL CSS is imported via FarmViewer component */}
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
