import { useMemo } from 'react';

const LINES_A = [
  '> session terminated',
  '> flushing buffers...',
  '> closing socket [ok]',
  '> revoking token',
  '> clearing cache',
  '> deallocating memory',
  '> gc.collect()',
  '> shutdown sequence init',
];

const LINES_B = [
  '> node --status',
  '> ping 127.0.0.1',
  '> uptime 99.98%',
  '> queue drained',
  '> log rotated',
  '> checksum ok',
  '> archive complete',
  '> exit code 0',
];

function MatrixColumn({ lines, duration, className }: { lines: string[]; duration: number; className?: string }) {
  const doubled = [...lines, ...lines, ...lines];
  return (
    <div className={`absolute inset-y-0 overflow-hidden font-mono text-[11px] leading-6 ${className ?? ''}`}>
      <div
        className="animate-terminal-scroll px-2"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((line, i) => (
          <div key={i} className="whitespace-nowrap text-primary/50">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function LightBeams() {
  const beams = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        left: (i / 6) * 100 + Math.random() * 8,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 4,
        hue: [165, 190, 260, 320, 40, 140][i % 6],
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beams.map(b => (
        <span
          key={b.id}
          className="absolute top-0 bottom-0 w-[2px] animate-beam-sweep"
          style={{
            left: `${b.left}%`,
            background: `linear-gradient(to bottom, transparent, hsl(${b.hue} 100% 60% / 0.7), transparent)`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
}

function EmberParticles() {
  const embers = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 4 + Math.random() * 5,
        delay: Math.random() * 5,
        drift: (Math.random() - 0.5) * 80,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map(e => (
        <span
          key={e.id}
          className="absolute rounded-full bg-primary animate-float-up"
          style={{
            left: `${e.left}%`,
            bottom: '-10px',
            width: e.size,
            height: e.size,
            boxShadow: '0 0 8px 2px hsl(165 100% 50% / 0.8)',
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            // @ts-ignore
            '--drift': `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function SignOffScreen() {
  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden bg-black flex items-center justify-center">
      {/* Columnas tipo matrix a los costados */}
      <MatrixColumn lines={LINES_A} duration={7} className="left-0 w-1/4 opacity-60" />
      <MatrixColumn lines={LINES_B} duration={9} className="right-0 w-1/4 opacity-60" />

      {/* Haces de luz de colores */}
      <LightBeams />

      {/* Chispas ascendentes */}
      <EmberParticles />

      {/* Glow radial pulsante central */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow" />
      </div>

      {/* Scanlines sutiles */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,black_100%)]" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="relative mb-6">
          <span className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse-slow" />
          <h1 className="relative text-3xl sm:text-4xl font-extrabold tracking-widest text-primary animate-fade-in-up"
              style={{ textShadow: '0 0 20px hsl(165 100% 45% / 0.9), 0 0 60px hsl(165 100% 45% / 0.5)' }}>
            ESPERA 1 MINUTO
          </h1>
        </div>
        <p className="font-mono text-xs text-primary/60 tracking-[0.2em] animate-fade-in-up [animation-delay:150ms]">
          
        </p>
      </div>
    </div>
  );
}
