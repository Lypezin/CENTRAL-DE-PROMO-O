'use client'

import { useEffect } from 'react'

export default function VisitorTracker() {
  useEffect(() => {
    // Gera um ID de sessão único se não existir no sessionStorage
    let sessionId = sessionStorage.getItem('visitor_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('visitor_session_id', sessionId)
    }

    const ping = async () => {
      try {
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        })
      } catch (e) {
        console.error('Erro ao registrar batimento de visita:', e)
      }
    }

    // Dispara o ping imediatamente na montagem
    ping()

    // Agenda pings periódicos a cada 30 segundos
    const interval = setInterval(ping, 30000)
    return () => clearInterval(interval)
  }, [])

  return null
}
