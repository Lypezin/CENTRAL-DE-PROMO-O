'use client'

import { useEffect } from 'react'

export default function NinjaThemeForcer() {
  useEffect(() => {
    // Dispara o evento para forçar o tema Ninja Faixa Preta do lado do cliente
    const forceNinjaEvent = new CustomEvent('force_theme_change', { detail: 'ninja' })
    window.dispatchEvent(forceNinjaEvent)

    return () => {
      // Restaura o tema ao sair da página
      const restoreThemeEvent = new CustomEvent('force_theme_change', { detail: null })
      window.dispatchEvent(restoreThemeEvent)
    }
  }, [])

  return null
}
