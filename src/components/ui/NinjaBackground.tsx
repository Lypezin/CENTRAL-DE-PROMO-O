'use client'

import { useEffect, useState } from 'react'

export default function NinjaBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-black">
      {/* Grade de fundo escurecida avermelhada */}
      <div className="absolute inset-0 opacity-[0.15]" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(153, 27, 27, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(153, 27, 27, 0.3) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Sombras radiais profundas */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-950/20 blur-[150px] rounded-full mix-blend-screen" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-red-800/5 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-1000" />

      {/* Névoa Carmesim Dinâmica Inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-red-950/30 to-transparent"></div>

      {/* Partículas flutuantes estilo Faíscas/Cinzas Vermelhas */}
      <div className="absolute inset-0 perspective-[1000px]">
        {/* Usaremos um efeito de CSS simples para simular faíscas flutuando na tela */}
        {Array.from({ length: 15 }).map((_, i) => {
          const size = Math.random() * 4 + 2; // de 2px a 6px
          const dur = Math.random() * 15 + 10; // de 10s a 25s
          const delay = Math.random() * -20;
          const left = Math.random() * 100;
          const endLeft = left + (Math.random() * 20 - 10);
          
          return (
            <div
              key={i}
              className="absolute bottom-[-20px] rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] opacity-0 animate-float-ash"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                '--end-left': `${endLeft}%`
              } as React.CSSProperties}
            ></div>
          )
        })}
      </div>
      
      {/* Silhueta Katana Diagonal (efeito de lâmina) */}
      <div className="absolute top-[-10%] right-[-10%] w-[150%] h-[2px] bg-gradient-to-r from-transparent via-red-500/10 to-transparent transform -rotate-45 blur-[1px]"></div>
      <div className="absolute top-[15%] right-[-10%] w-[150%] h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent transform -rotate-45 blur-[2px]"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-ash {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(-50vh) translateX(calc(var(--end-left) - 50%)) scale(0.8);
            opacity: 0.6;
          }
          90% {
            opacity: 0.2;
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
