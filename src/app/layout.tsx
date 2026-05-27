import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "🏆 Ranking de Entregadores | Central de Promoções",
  description: "Ranking semanal de entregadores por turno. Acompanhe sua posição e ganhe prêmios incríveis!",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        <main className="pt-20 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
