'use client'

import { useEffect } from 'react'

export default function CopaThemeForcer() {
  useEffect(() => {
    // Dispara o evento para forçar o tema Copa do Mundo do lado do cliente
    const forceCopaEvent = new CustomEvent('force_theme_change', { detail: 'copa' })
    window.dispatchEvent(forceCopaEvent)

    return () => {
      // Dispara o evento limpando o tema forçado e retornando ao tema global do Hub
      const restoreThemeEvent = new CustomEvent('force_theme_change', { detail: null })
      window.dispatchEvent(restoreThemeEvent)
    }
  }, [])

  return null
}
