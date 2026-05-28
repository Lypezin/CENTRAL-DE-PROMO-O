import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import VisitorTracker from "@/components/ui/VisitorTracker";
import LightningBackground from "@/components/ui/LightningBackground";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Central de Promoções | EntreGÔ Itaim",
  description: "Acompanhe seus rankings operacionais e consulte metas semanais por turnos em tempo real.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          {/* Ambient WebGL organic lightning background */}
          <LightningBackground />

          {/* Modern grid line pattern overlay (Pure CSS, 60fps native performance) */}
          <div className="tech-grid"></div>
          
          <Navbar />
          <VisitorTracker />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
