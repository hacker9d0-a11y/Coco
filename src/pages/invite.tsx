import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
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
  const lines = [...TERMINAL_LINES, ...TERMINAL_LINES, ...TERMINAL_LINES];

  return (
    <div className="fixed inset-0 -z-10 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none" />
      <div className="animate-terminal-scroll px-6 py-4 font-mono text-[11px] leading-5">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-nowrap text-primary/70">
            {line}
          </div>
        ))}
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
  const [countryAllowed, setCountryAllowed] = useState<boolean | null>(null);
  const [, navigate] = useLocation();

  // ✅ Arreglamos la variable que faltaba
  const isError = status === 'invalid';

  useEffect(() => {
    const verify = async () => {
      setMounted(true);

      try {
        // ✅ QUITAMOS EL BLOQUEO DE PAÍS: funciona en todo el mundo
        setCountryAllowed(true);

        // Continuamos validando el token normalmente
        const result = await useInviteLink(token);

        if (result.success) {
          setStatus("success");
        } else if (result.error === "Already used on this device") {
          setStatus("already-used");
        } else {
          setStatus("invalid");
        }
      } catch {
        setCountryAllowed(true); // Permitimos acceso aunque falle algo
        setStatus("invalid");
      }
    };

    verify();
  }, [token]);

  if (countryAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Acceso permitido</h1>
          <p>Cargando tu simulador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Terminal a pantalla completa (fondo) */}
      <TerminalBox />

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
          <button
            type="button"
            onClick={() => (status === 'already-used' || status === 'success') && navigate('/party')}
            disabled={status !== 'already-used' && status !== 'success'}
            aria-label={status === 'already-used' || status === 'success' ? 'Click' : undefined}
            className={`relative h-16 w-16 rounded-2xl flex items-center justify-center border shadow-[0_0_30px_rgba(0,200,150,0.15)] transition-transform duration-500 ${
              status === 'success' ? 'scale-100 animate-bounce-in' : 'scale-100'
            } ${
              status === 'already-used' || status === 'success'
                ? 'cursor-pointer hover:scale-105 active:scale-95'
                : 'cursor-default'
            } ${
              isError
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}
          >
            {status === 'loading' && <Loader2 className="w-8 h-8 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-8 h-8" />}
            {status === 'invalid' && <XCircle className="w-8 h-8 animate-shake" />}
          </button>
          {status === 'success' && (
            <Sparkles className="w-5 h-5 text-primary absolute -top-2 -right-2 animate-sparkle" />
          )}
        </div>
        {(status === 'already-used' || status === 'success') && (
          <span className="text-[11px] text-muted-foreground/70 -mt-4 mb-4 tracking-wide uppercase">Click</span>
        )}

        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight animate-fade-in">
              Verificando invitación...
            </h1>
            <p className="text-muted-foreground text-sm animate-fade-in [animation-delay:150ms]">
              Un momento, por favor.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2 justify-center animate-fade-in-up">
              <Gift className="w-6 h-6 text-primary animate-wiggle" />
              ¡Invitación aceptada!
            </h1>
            <p className="text-muted-foreground text-sm animate-fade-in-up [animation-delay:150ms]">
              Todo listo para empezar.
            </p>
          </>
        )}

        {status === 'already-used' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight animate-fade-in-up">
              Ya usaste esta invitación
            </h1>
            <p className="text-muted-foreground text-sm animate-fade-in-up [animation-delay:150ms]">
              Haz clic para continuar.
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight animate-fade-in-up">
              Invitación no válida
            </h1>
            <p className="text-muted-foreground text-sm animate-fade-in-up [animation-delay:150ms]">
              Verifica el enlace.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
