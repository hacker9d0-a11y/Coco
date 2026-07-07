import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useBankState } from './hooks/use-bank-state';
import { SetupScreen } from './pages/setup';
import { LoginScreen } from './pages/login';
import { DashboardScreen } from './pages/dashboard';
import { InviteScreen } from './pages/invite';
import { PartyScreen } from './pages/party';
import { SignOffScreen } from './pages/sign-off';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';

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
    getInviteToken,
  } = useBankState();

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
    );
  }

  return null;
}

function InviteRoute({ params }: { params: { token: string } }) {
  const { useInviteLink } = useBankState();
  return <InviteScreen token={params.token} useInviteLink={useInviteLink} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={BankAppShell} />
      <Route path="/invite/:token" component={InviteRoute} />
      <Route path="/party" component={PartyScreen} />
      <Route path="/sign-off" component={SignOffScreen} />
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