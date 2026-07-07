import { useEffect, useState } from 'react';
import { Gift, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type Status = 'loading' | 'success' | 'already-used' | 'invalid';

export function InviteScreen({
  token,
  useInviteLink,
}: {
  token: string;
  useInviteLink: (token: string) => Promise<{ success: boolean; error?: string; bonus?: number }>;
}) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10 text-center">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary border border-primary/20 shadow-[0_0_30px_rgba(0,200,150,0.15)]">
          {status === 'loading' && <Loader2 className="w-8 h-8 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-8 h-8" />}
          {(status === 'already-used' || status === 'invalid') && <XCircle className="w-8 h-8" />}
        </div>

        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Verificando invitación...</h1>
            <p className="text-muted-foreground text-sm">Un momento, por favor.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-2 justify-center">
              <Gift className="w-6 h-6 text-primary" /> ¡Invitación canjeada!
            </h1>
            <p className="text-muted-foreground text-sm">Se añadieron $1,000.00 a la cuenta.</p>
          </>
        )}

        {status === 'already-used' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Este link ya fue usado</h1>
            <p className="text-muted-foreground text-sm">Este link de invitación ya fue canjeado en este dispositivo.</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Link inválido</h1>
            <p className="text-muted-foreground text-sm">Este link de invitación no es válido o ya expiró.</p>
          </>
        )}
      </div>
    </div>
  );
}