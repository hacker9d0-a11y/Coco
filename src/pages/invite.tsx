import { useEffect, useMemo, useState } from 'react';
import { Gift, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

type Status = 'loading' | 'success' | 'already-used' | 'invalid';

const TERMINAL_LINES = [
  '> init secure_channel()',
  '> connecting to ledger node...',
  '> handshake ok [tls 1.3]',
  '> resolving invite_token',
  '> checking device_fingerprint',
  '> validating signature...',
  '> querying balance_service',
  '> sync block #48213',
  '> cache miss -> fetch remote',
  '> applying bonus_rules',
  '> writing tx_record',
  '> commit ok',
  '> awaiting confirmation...',
  '> heartbeat ok',
];

function TerminalBox() {
  const lines = [...TERMINAL_LINES, ...TERMINAL_LINES];

  return (
    <div className="w-full max-w-[420px] mt-8 rounded-xl overflow-hidden border border-white/10 bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
        <span className="ml-2 text-[10px] text-white/40 font-mono">terminal</span>
      </div>
      <div className="relative h-40 overflow-hidden font-mono text-[11px] leading-5">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none" />
        <div className="animate-terminal-scroll px-4 py-3">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-nowrap text-primary/70">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingParticles({ variant }: { variant: Status }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 6,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 5,
        drift: (Math.random() - 0.5) * 60,
      })),
    []
  );

  const color =
    variant === 'success' ? 'bg-primary/40' : variant === 'invalid' ? 'bg-destructive/30' : 'bg-primary/20';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <span
          key={p.id}
          className={`absolute rounded-full ${color} animate-float-up`}
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // @ts-ignore custom property consumed by keyframes
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function InviteScreen({
  token,
  useInviteLink,
}: {
  token: string;
  useInviteLink: (token: string) => Promise<{ success: boolean; error?: string; bonus?: number }>;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useInviteLink(token).then(result => {
      if (result.success) {
        setStatus('success');
      } else if (result.error === 'Already used on this device') {
        setStatus('already-used');
      } else {
        setStatus('invalid');
      }
    });
  }, [token]);

  const isError = status === 'already-used' || status === 'invalid';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow de fondo animado */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] rounded-full blur-[100px] pointer-events-none transition-colors duration-700 animate-pulse-slow ${
          isError ? 'bg-destructive/10' : 'bg-primary/10'
        }`}
      />

      {/* Partículas flotantes */}
      <FloatingParticles variant={status} />

      <div
        key={status}
        className={`w-full max-w-[420px] flex flex-col items-center relative z-10 text-center transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } animate-fade-in-up`}
      >
        {/* Icono con anillos pulsantes */}
        <div className="relative h-20 w-20 flex items-center justify-center mb-6">
          {status === 'success' && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping-slow" />
              <span className="absolute -inset-2 rounded-2xl border border-primary/20 animate-spin-slow" />
            </>
          )}
          {status === 'loading' && (
            <span className="absolute inset-0 rounded-2xl border-2 border-primary/20 border-t-primary animate-spin" />
          )}
          <div
            className={`relative h-16 w-16 rounded-2xl flex items-center justify-center border shadow-[0_0_30px_rgba(0,200,150,0.15)] transition-transform duration-500 ${
              status === 'success' ?