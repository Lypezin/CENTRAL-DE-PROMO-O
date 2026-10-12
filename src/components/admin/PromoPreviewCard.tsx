'use client'

import { PromoCardPreview } from '@/components/ui/PromoCard'
import type { Promocao } from '@/lib/supabase'

export default function PromoPreviewCard({ promo }: { promo: Promocao }) {
  return (
    <section className="space-y-3 rounded-xl border border-white/[0.05] bg-[#08080a] p-3">
      <h3 className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden="true" />
        Prévia do card público
      </h3>
      <PromoCardPreview promo={promo} />
    </section>
  )
}
