'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function VisitorTracker() {
  useEffect(() => {
    // 1. Gera um ID de sessão único se não existir no sessionStorage
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('visitor_session_id', sessionId)
    }

    const logHistoricVisit = async () => {
      try {
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        })
      } catch (e) {
        console.error('Erro ao registrar batimento de visita histórico:', e)
      }
    }
    logHistoricVisit()

    // 2. Conecta ao canal de presença em tempo real via Supabase WebSockets
    const channel = supabase.channel('online_presence_hub', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const count = Object.keys(state).length
        const finalCount = count > 0 ? count : 1
        ;(window as any).__onlineCount = finalCount
        window.dispatchEvent(new CustomEvent('online_presence_update', { detail: finalCount }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    // Desconecta e limpa o rastreador ao desmontar (fechar aba ou sair)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return null
}
