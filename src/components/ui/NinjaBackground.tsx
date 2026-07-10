'use client'

import { useEffect, useMemo, useState } from 'react'

type AshParticle = {
  size: number
  dur: number
  delay: number
  left: number
  endLeft: number
}

export default function NinjaBackground() {
  const [mounted, setMounted] = useState(false)
  const [isEcoMode, setIsEcoMode] = useState(false)

  // Stable particle layout — generated once after mount (not on every render)
  const ashParticles = useMemo<AshParticle[]>(() => {
    if (!mounted) return []
    return Array.from({ length: 15 }, () => {
      const left = Math.random() * 100
      return {
        size: Math.random() * 4 + 2,
        dur: Math.random() * 15 + 10,
        delay: Math.random() * -20,
        left,
        endLeft: left + (Math.random() * 20 - 10),
      }
    })
  }, [mounted])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('performance_mode')
    if (stored === 'eco') {
      setIsEcoMode(true)
    }

    const handlePerfChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isEco: boolean }>
      setIsEcoMode(customEvent.detail.isEco)
    }

    window.addEventListener('performance_mode_change', handlePerfChange)
    return () => {
      window.removeEventListener('performance_mode_change', handlePerfChange)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030303]">
      {/* Grade de fundo escurecida prateada/chumbo */}
      <div className="absolute inset-0 opacity-[0.25]" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(113, 113, 122, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(113, 113, 122, 0.15) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Sombras radiais profundas */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-zinc-600/5 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-zinc-800/20 blur-[150px] rounded-full mix-blend-screen" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-zinc-400/5 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-1000" />

      {/* Névoa Platinada Dinâmica Inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-zinc-900/40 to-transparent"></div>

      {/* Partículas flutuantes estilo Faíscas/Cinzas Prateadas */}
      {!isEcoMode && (
        <div className="absolute inset-0 perspective-[1000px]">
          {ashParticles.map((p, i) => (
            <div
              key={i}
              className="absolute bottom-[-20px] rounded-full bg-zinc-300 shadow-[0_0_8px_rgba(228,228,231,0.6)] opacity-0 animate-float-ash"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
                '--end-left': `${p.endLeft}%`
              } as React.CSSProperties}
            ></div>
          ))}
        </div>
      )}
      
      {/* Silhueta Katana Diagonal (efeito de lâmina) - Prata */}
      <div className="absolute top-[-10%] right-[-10%] w-[150%] h-[2px] bg-gradient-to-r from-transparent via-zinc-400/10 to-transparent transform -rotate-45 blur-[1px]"></div>
      <div className="absolute top-[15%] right-[-10%] w-[150%] h-[1px] bg-gradient-to-r from-transparent via-zinc-500/20 to-transparent transform -rotate-45 blur-[2px]"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-ash {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50vh) translateX(calc(var(--end-left) - 50%)) scale(0.8);
            opacity: 0.4;
          }
          90% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(-110vh) translateX(calc(var(--end-left) - 50%)) scale(0.5);
            opacity: 0;
          }
        }
        .animate-float-ash {
          animation: float-ash linear infinite;
        }
      `}} />
    </div>
  )
}
