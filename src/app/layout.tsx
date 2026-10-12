import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { unstable_cache } from 'next/cache'
import { connection } from 'next/server'
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

const readActiveTheme = unstable_cache(
  async (): Promise<'raios' | 'copa' | 'ninja'> => {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'tema_hub')
      .maybeSingle()

    if (error) throw new Error('Theme configuration unavailable.')
    const value = data?.valor?.tema_ativo
    return value === 'copa' || value === 'ninja' ? value : 'raios'
  },
  ['central-promocoes-active-theme'],
  { revalidate: 300, tags: ['hub-theme'] },
)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Keep secrets and database reads out of the build while caching the theme across requests.
  await connection()

  // Fetch active theme from Supabase (server-side)
  let temaAtivo: 'raios' | 'copa' | 'ninja' = 'raios'
  try {
    temaAtivo = await readActiveTheme()
  } catch {
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
