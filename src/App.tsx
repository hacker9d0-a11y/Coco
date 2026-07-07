import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useBankState } from './hooks/use-bank-state';
import { SetupScreen } from './pages/setup';
import { LoginScreen } from './pages/login';
import { DashboardScreen } from './pages/dashboard';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient();

function BankAppShell() {
  const {
    authState,
    startTime,
    hourlyRate,
    bonusBalance,
    transfer,
    setupAccount,
    login,
    logout,
    startTransfer,
    pauseTransfer,
    resumeTransfer,
    completeTransfer,
    useInviteLink,
    getInviteToken,
  } = useBankState();

  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  // Handle invite link from URL: /?invite=TOKEN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;

    // Remove token from URL silently
    window.history.replaceState({}, '', '/');

    // Wait until logged in to apply the invite
    if (authState === 'dashboard') {
      useInviteLink(token).then(result => {
        if (result.success) {
          setInviteMsg(`¡Link de invitación canjeado! +$1,000.00 añadidos a tu cuenta.`);
        } else if (result.error === 'Already used on this device') {
          setInviteMsg('Este link ya fue usado en este dispositivo.');
        } else {
          setInviteMsg('Link de invitación inválido o expirado.');
        }
        setTimeout(() => setInviteMsg(null), 5000);
      });
    }
  }, [authState]);

  if (authState === 'loading') {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (authState === 'setup') return <SetupScreen setupAccount={setupAccount} />;
  if (authState === 'login') return <LoginScreen login={login} />;

  if (authState === 'dashboard') {
    return (
      <>
        {inviteMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-background text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
            {inviteMsg}
          </div>
        )}
        <DashboardScreen
          startTime={startTime}
          hourlyRate={hourlyRate}
          bonusBalance={bonusBalance}
          transfer={transfer}
          logout={logout}
          startTransfer={startTransfer}
          pauseTransfer={pauseTransfer}
          resumeTransfer={resumeTransfer}
          completeTransfer={completeTransfer}
          getInviteToken={getInviteToken}
        />
      </>
    );
  }

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={BankAppShell} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
