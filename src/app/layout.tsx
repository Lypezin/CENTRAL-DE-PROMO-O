import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import VisitorTracker from "@/components/ui/VisitorTracker";
import DynamicBackground from "@/components/ui/DynamicBackground";
import { supabaseAdmin } from "@/lib/supabaseServer";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch active theme from Supabase (server-side)
  let temaAtivo: 'raios' | 'copa' | 'ninja' = 'raios'
  try {
    const { data } = await supabaseAdmin
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'tema_hub')
      .single()
    if (data?.valor?.tema_ativo) {
      temaAtivo = data.valor.tema_ativo
    }
  } catch (e) {
    console.error('Failed to fetch theme:', e);
    // Default to 'raios' if table doesn't exist yet
  }

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} tema-${temaAtivo}`}>
        <ToastProvider>
          {/* Dynamic theme background (raios or copa) */}
          <DynamicBackground temaAtivo={temaAtivo} />

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
