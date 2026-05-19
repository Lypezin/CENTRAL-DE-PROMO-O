import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "🏆 Ranking de Entregadores | Central de Promoções",
  description: "Ranking semanal de entregadores por turno. Acompanhe sua posição e ganhe prêmios incríveis!",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
      <body className={inter.className} style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw', position: 'relative' }}>
        {children}
      </body>
    </html>
  );
}
