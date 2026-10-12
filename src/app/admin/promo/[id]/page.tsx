'use client'

import { useParams } from 'next/navigation'
import PromotionManagementWorkspace from '@/components/admin/PromotionManagementWorkspace'

export default function EditPromoPage() {
  const { id } = useParams<{ id: string }>()

  return <PromotionManagementWorkspace promoId={id} />
}
