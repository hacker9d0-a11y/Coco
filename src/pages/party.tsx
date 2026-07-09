import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

const CATS = ['🐱', '😺', '😸', '😻', '🙀', '😹'];

function FlyingCats() {
  const cats = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        emoji: CATS[i % CATS.length],
        top: Math.random() * 90,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 6,
        size: 28 + Math.random() * 28,
        reverse: Math.random() > 0.5,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cats.map(cat => (
        <span
          key={cat.id}
          className={cat.reverse ? 'absolute animate-cat-fly-reverse' : 'absolute animate-cat-fly'}
          style={{
            top: `${cat.top}%`,
            fontSize: `${cat.size}px`,
            animationDuration: `${cat.duration}s`,
            animationDelay: `${cat.delay}s`,
          }}
        >
          {cat.emoji}
        </span>
      ))}
    </div>
  );
}

export function PartyScreen() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden flex flex-col items-center justify-center p-4 animate-rainbow-bg">
      <FlyingCats />

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] mb-4 animate-bounce-in">
          🌈 ¡Fiesta de gatos! 🐱
        </h1>
        <p className="text-white/90 text-lg mb-8 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
          Nada que ver aquí, solo gatos volando.
        </p>
        <button
          onClick={() => navigate('/sign-off')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-black font-semibold transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    </div>
  );
}
