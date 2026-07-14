import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building, User, CreditCard, PlusCircle,
  Sparkles, Clock, BellOff, TrendingUp, ChevronDown,
  Landmark, Hash, ArrowDownToLine, Timer, Users, MapPin, Monitor, Link2, Copy, Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { TransferState } from '@/hooks/use-bank-state';

interface DashboardProps {
  startTime: string | null;
  hourlyRate: number;
  bonusBalance: number;
  transfer: TransferState;
  logout: () => void;
  startTransfer: (amount: number, bankId: string, accountNumber: string) => Promise<void>;
  pauseTransfer: () => Promise<void>;
  resumeTransfer: () => Promise<void>;
  completeTransfer: () => Promise<void>;
  getInviteToken: () => Promise<string>;
}

// ── Visitor tracking ──────────────────────────────────────────────────────────
interface Visitor {
  id: string;
  name: string;
  device: string;
  location: string;
  flag: string;
  time: string;
  browser: string;
  connection: string;
  isp: string;
  referenceId: string;
  status: string;
}

const VISITOR_NAMES = [
  'Carlos M.','Alejandro R.','María G.','Valentina P.','Juan C.',
  'Sofia L.','Diego H.','Isabella F.','Andrés T.','Camila V.',
  'Luis E.','Daniela O.','Miguel S.','Gabriela N.','Pablo A.',
  'Luciana B.','Roberto J.','Natalia K.','Fernando W.','Valeria Q.',
];

const VISITOR_LOCATIONS = [
  { city: 'Santo Domingo', flag: '🇩🇴' },
  { city: 'Santiago, RD',  flag: '🇩🇴' },
  { city: 'La Romana',     flag: '🇩🇴' },
  { city: 'Miami, FL',     flag: '🇺🇸' },
  { city: 'New York, NY',  flag: '🇺🇸' },
  { city: 'Barcelona',     flag: '🇪🇸' },
  { city: 'Ciudad de México', flag: '🇲🇽' },
  { city: 'Bogotá',        flag: '🇨🇴' },
  { city: 'Buenos Aires',  flag: '🇦🇷' },
  { city: 'San Juan, PR',  flag: '🇵🇷' },
  { city: 'Caracas',       flag: '🇻🇪' },
  { city: 'Lima',          flag: '🇵🇪' },
];

const VISITOR_DEVICES = ['iPhone 15','Samsung Galaxy S24','MacBook Pro','Windows PC','iPad Pro','Pixel 8','OnePlus 12','Xiaomi 14'];
const VISITOR_BROWSERS = ['Chrome','Safari','Firefox','Edge','Samsung Internet','Opera'];
const VISITOR_CONNECTIONS = ['WiFi','Datos móviles (4G)','Datos móviles (5G)','Ethernet'];
const VISITOR_ISPS = ['Claro','Altice','Viva','AT&T','Verizon','Telefónica','Movistar','Comcast'];
const VISITOR_STATUSES = ['Verificado','Nuevo','Recurrente'];
const VISITORS_KEY = 'randy_bank_visitors';
const VISITOR_SESSION_KEY = 'randy_bank_visitor_added';

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android.*Mobile/.test(ua)) return 'Android Phone';
  if (/Android/.test(ua)) return 'Android Tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Dispositivo desconocido';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomReferenceId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function loadVisitors(): Visitor[] {
  try { return JSON.parse(localStorage.getItem(VISITORS_KEY) ?? '[]'); } catch { return []; }
}
function saveVisitors(v: Visitor[]) { localStorage.setItem(VISITORS_KEY, JSON.stringify(v)); }

function addCurrentVisitor(visitors: Visitor[]): Visitor[] {
  if (sessionStorage.getItem(VISITOR_SESSION_KEY)) return visitors;
  const loc = pickRandom(VISITOR_LOCATIONS);
  const entry: Visitor = {
    id: crypto.randomUUID(),
    name: pickRandom(VISITOR_NAMES),
    device: detectDevice(),
    location: loc.city,
    flag: loc.flag,
    time: new Date().toISOString(),
    browser: pickRandom(VISITOR_BROWSERS),
    connection: pickRandom(VISITOR_CONNECTIONS),
    isp: pickRandom(VISITOR_ISPS),
    referenceId: randomReferenceId(),
    status: pickRandom(VISITOR_STATUSES),
  };
  const updated = [entry, ...visitors].slice(0, 50);
  saveVisitors(updated);
  sessionStorage.setItem(VISITOR_SESSION_KEY, '1');
  return updated;
}

// ── Banks ─────────────────────────────────────────────────────────────────────
const BANKS = [
  { id: 'popular',     name: 'Banco Popular',   maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'banreservas', name: 'Banreservas',      maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'bhd',         name: 'Banco BHD',        maxLength: 14, placeholder: '14 dígitos (ej: 12345678901234)' },
  { id: 'apap',        name: 'APAP',             maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'scotiabank',  name: 'Scotiabank RD',    maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'santacruz',   name: 'Banco Santa Cruz', maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'promerica',   name: 'Banco Promerica',  maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'caribe',      name: 'Banco Caribe',     maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'lafise',      name: 'Banco LAFISE',     maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'vimenca',     name: 'Banco Vimenca',    maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
] as const;

type BankId = typeof BANKS[number]['id'];

const SIM_DURATION = 2 * 3600;

export function DashboardScreen({
  startTime, hourlyRate, bonusBalance, transfer,
  logout, startTransfer, pauseTransfer, resumeTransfer, completeTransfer, getInviteToken,
}: DashboardProps) {

  const [creditsEarned, setCreditsEarned] = useState(0);
  const [timerText, setTimerText]         = useState('00:00:00');
  const [progress, setProgress]           = useState(0);
  const [visitors, setVisitors]           = useState<Visitor[]>([]);

  // Form state
  const [selectedBankId, setSelectedBankId] = useState<BankId | null>(null);
  const [accountNumber, setAccountNumber]   = useState('');
  const [depositAmount, setDepositAmount]   = useState('');

  // Local transfer countdown (driven by server state)
  const [simRemaining, setSimRemaining] = useState(0);
  const [simDone, setSimDone]           = useState(false);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Invite link
  const [inviteLink, setInviteLink]   = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [showInvite, setShowInvite]   = useState(false);

  // Derived
  const simRunning = !!transfer?.running;

  // ── Load visitors ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loaded = loadVisitors();
    const updated = addCurrentVisitor(loaded);
    setVisitors(updated);
  }, []);

  // ── Balance timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!startTime) return;
    const calculate = () => {
      const elapsedSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setCreditsEarned(Math.floor(elapsedSeconds / 3600));
      const secondsIntoHour = elapsedSeconds % 3600;
      const secondsUntilNext = 3600 - secondsIntoHour;
      setProgress((secondsIntoHour / 3600) * 100);
      const h = Math.floor(secondsUntilNext / 3600);
      const m = Math.floor((secondsUntilNext % 3600) / 60);
      const s = secondsUntilNext % 60;
      setTimerText(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  // ── Sync transfer state from server ───────────────────────────────────────
  useEffect(() => {
    if (!transfer) {
      if (simRef.current) clearInterval(simRef.current);
      setSimRemaining(0);
      setSimDone(false);
      return;
    }

    if (transfer.remainingSecs <= 0) {
      setSimDone(true);
      setSimRemaining(0);
      return;
    }

    // Calculate real remaining if running
    let remaining = transfer.remainingSecs;
    if (transfer.running && transfer.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(transfer.startedAt).getTime()) / 1000);
      remaining = Math.max(0, transfer.remainingSecs - elapsed);
    }

    setSimRemaining(remaining);
    setSimDone(false);

    if (transfer.running && remaining > 0) {
      if (simRef.current) clearInterval(simRef.current);
      simRef.current = setInterval(() => {
        setSimRemaining(prev => {
          if (prev <= 1) {
            clearInterval(simRef.current!);
            setSimDone(true);
            completeTransfer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => { if (simRef.current) clearInterval(simRef.current); };
  }, [transfer]);

  // ── Pause transfer when page is hidden ────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && transfer?.running) {
        pauseTransfer();
      } else if (!document.hidden && transfer && !transfer.running && (transfer.remainingSecs > 0)) {
        resumeTransfer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [transfer]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const visitorBonus = visitors.length * 0.5;
  const balance = creditsEarned * hourlyRate + visitorBonus + (bonusBalance ?? 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const selectedBank = BANKS.find(b => b.id === selectedBankId) ?? null;

  const handleBankSelect = (id: BankId) => { setSelectedBankId(id); setAccountNumber(''); };
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAccountNumber(raw.slice(0, selectedBank?.maxLength ?? 20));
  };

  const formatSimTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStartTransfer = async () => {
    const requested = parseFloat(depositAmount || '0');
    if (!depositAmount || requested <= 0 || requested > balance) return;
    if (!selectedBank || accountNumber.length !== selectedBank.maxLength) return;
    await startTransfer(requested, selectedBankId!, accountNumber);
  };

  const handleShowInvite = async () => {
    if (inviteLink) { setShowInvite(v => !v); return; }
    const token = await getInviteToken();
    setInviteLink(`${window.location.origin}/invite/${token}`);
    setShowInvite(true);
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simProgress = SIM_DURATION > 0 ? ((SIM_DURATION - simRemaining) / SIM_DURATION) * 100 : 0;

  const transactions = Array.from({ length: Math.min(creditsEarned, 10) }).map((_, i) => {
    const date = new Date(new Date(startTime!).getTime() + (creditsEarned - i) * 3600 * 1000);
    return { id: i, date, amount: hourlyRate };
  });

  const dailyRate = hourlyRate * 24;
  const lastCreditTime = creditsEarned > 0
    ? new Date(new Date(startTime!).getTime() + creditsEarned * 3600 * 1000) : null;
  let timeAgoText = '';
  if (lastCreditTime) {
    const hoursAgo = Math.floor((Date.now() - lastCreditTime.getTime()) / (1000 * 3600));
    timeAgoText = hoursAgo === 0 ? 'Hace menos de una hora' : hoursAgo === 1 ? 'Hace 1 hora' : `Hace ${hoursAgo} horas`;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center p-4 md:p-6 pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="w-full max-w-[420px] flex flex-col space-y-6 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight text-sm">Lala</h1>
              <p className="text-muted-foreground text-xs font-medium">Generative Savings Account</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-card transition-colors">
                <User className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-card-border">
              <DropdownMenuItem className="text-muted-foreground focus:text-white focus:bg-background cursor-pointer">
                Detalles de cuenta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Balance Card */}
        <div className="bg-card rounded-[1.5rem] p-6 border border-card-border shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              <span>Saldo disponible</span>
            </div>
            <button className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="mb-1">
            <span data-testid="text-balance" className="text-4xl md:text-5xl font-bold tracking-tighter text-white tabular-nums">
              {formatCurrency(balance)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mb-8">  </p>
          <div className="bg-background border border-card-border rounded-xl p-4 font-mono text-sm shadow-inner">
  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-card-border/60">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
    </span>
    <span className="text-muted-foreground text-xs tracking-wide">sistema</span>
  </div>

  <p className="text-muted-foreground">
    <span className="text-primary">$</span> sudo start-bank
  </p>
  <p className="text-muted-foreground">Inicializando sistema...</p>
  <p className="text-muted-foreground">Conectando a la red...</p>
  <p className="text-primary">✓ Sistema listo.</p>
  <p className="text-muted-foreground">
    Producción: <span className="text-white font-semibold">${hourlyRate}/hora</span>
  </p>

  <span className="animate-pulse text-primary">█</span>
</div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-4 border border-card-border flex items-start space-x-4 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-muted-foreground shrink-0 border border-card-border">
            <BellOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-0.5">Notificaciones en tu teléfono</h3>
            <p className="text-muted-foreground text-xs">Las notificaciones push no están disponibles en este navegador</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 border border-card-border shadow-sm">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-1">Tasa diaria</p>
            <p className="text-white text-lg font-bold">{formatCurrency(dailyRate)}</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-card-border shadow-sm">
            <div className="h-8 w-8 bg-background rounded-lg flex items-center justify-center text-muted-foreground mb-3 border border-card-border">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-1">Último crédito</p>
            <div className="flex flex-col">
              <p className="text-primary text-sm font-bold mb-0.5">+{formatCurrency(hourlyRate)}</p>
              <p className="text-[10px] text-muted-foreground truncate">{timeAgoText || 'Sin créditos aún'}</p>
            </div>
          </div>
        </div>

        {/* Invite Link (hidden, tap to reveal) */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <button
            onClick={handleShowInvite}
            className="w-full p-4 flex items-center space-x-2 text-left hover:bg-white/[0.02] transition-colors"
          >
            <Link2 className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-semibold flex-1"></span>
            <span className="text-[10px] text-muted-foreground">{showInvite ? 'ocultar' : 'mostrar'}</span>
          </button>
          {showInvite && inviteLink && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-[10px] text-muted-foreground">.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-lg px-3 py-2 text-[11px] text-muted-foreground font-mono truncate border border-card-border">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-primary" />
            <h3 className="text-white text-sm font-semibold">Transferencia bancaria</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Bank selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Banco</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="button-bank-select"
                    disabled={simRunning}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-left hover:border-primary/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className={selectedBank ? 'text-white' : 'text-muted-foreground'}>
                      {selectedBank?.name ?? 'Selecciona un banco'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card border-card-border max-h-60 overflow-y-auto" align="start">
                  {BANKS.map(bank => (
                    <DropdownMenuItem
                      key={bank.id}
                      onSelect={() => handleBankSelect(bank.id)}
                      className={`cursor-pointer text-sm ${selectedBankId === bank.id ? 'text-primary bg-primary/10 focus:text-primary focus:bg-primary/10' : 'text-white focus:text-white focus:bg-background'}`}
                    >
                      {bank.name}
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono">{bank.maxLength} díg.</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Account number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center space-x-1.5">
                <Hash className="w-3 h-3" />
                <span>Número de cuenta</span>
                {selectedBank && (
                  <span className="text-primary/70 font-mono text-[10px]">({selectedBank.maxLength} dígitos exactos)</span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                disabled={!selectedBank || simRunning}
                placeholder={selectedBank?.placeholder ?? 'Selecciona un banco primero'}
                maxLength={selectedBank?.maxLength ?? 20}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              />
              {selectedBank && accountNumber.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground/60">{accountNumber.length} / {selectedBank.maxLength} dígitos</span>
                  {accountNumber.length === selectedBank.maxLength
                    ? <span className="text-[10px] text-primary font-medium">Longitud válida</span>
                    : <span className="text-[10px] text-red-400 font-medium">Faltan {selectedBank.maxLength - accountNumber.length} dígitos</span>
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deposit info */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center space-x-2">
            <ArrowDownToLine className="w-4 h-4 text-primary" />
            <h3 className="text-white text-sm font-semibold">Información del depósito</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Monto a depositar (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={formatCurrency(balance).replace('$', '').trim()}
                  disabled={simRunning}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Saldo actual: <span className="text-primary">{formatCurrency(balance)}</span>
              </p>
              {depositAmount && parseFloat(depositAmount) > balance && (
                <p className="text-[10px] text-red-400 font-medium">
                  Fondos insuficientes. No puedes transferir más de {formatCurrency(balance)}.
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center space-x-1.5">
                <Timer className="w-3 h-3" />
                <span>Tiempo estimado</span>
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white font-mono select-none cursor-default">
                2 horas
              </div>
            </div>

            {/* Countdown */}
            {(simRunning || simDone) && (
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {simDone ? 'Depósito completado' : 'Procesando depósito...'}
                  </span>
                  <span className={`text-sm font-bold tabular-nums font-mono ${simDone ? 'text-primary' : 'text-white'}`}>
                    {simDone ? '00:00:00' : formatSimTime(simRemaining)}
                  </span>
                </div>
                <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-card-border">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${simDone ? 'bg-primary' : 'bg-primary/80'}`}
                    style={{ width: `${simDone ? 100 : simProgress}%` }}
                  />
                </div>
                {simDone && (
                  <div className="flex items-center justify-center space-x-2 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-xs font-semibold">
                      {depositAmount ? `$${parseFloat(depositAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} depositado` : 'Depósito completado'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Button */}
            <div className="flex gap-2 pt-1">
              {!simRunning ? (
                <button
                  onClick={handleStartTransfer}
                  disabled={
                    simDone ||
                    !depositAmount ||
                    parseFloat(depositAmount) <= 0 ||
                    parseFloat(depositAmount) > balance ||
                    !selectedBank ||
                    accountNumber.length !== selectedBank.maxLength
                  }
                  className="flex-1 py-2.5 rounded-lg bg-primary text-background text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  Confirmar transferencia
                </button>
              ) : (
                <div className="flex-1 py-2.5 rounded-lg bg-background border border-card-border text-muted-foreground text-xs font-medium text-center select-none">
                  Transferencia en proceso — no se puede cancelar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-card rounded-xl border border-card-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-card-border">
            <h3 className="text-white text-sm font-semibold">Historial de transacciones</h3>
          </div>
          <div className="p-0">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Sin créditos aún. Vuelve en una hora.</div>
            ) : (
              <div className="divide-y divide-card-border">
                {transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">Crédito generativo</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-primary font-semibold text-sm">+{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visitor history */}
        <div className="bg-card rounded-xl border border-card-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-white text-sm font-semibold"></h3>
            </div>
            <span className="text-[10px] text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              +{formatCurrency(visitorBonus)} generado
            </span>
          </div>
          <div className="p-0">
            {visitors.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Sin visitas registradas.</div>
            ) : (
              <div className="divide-y divide-card-border">
                {visitors.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 text-xs font-bold">
                        {v.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-sm font-medium truncate">{v.name}</p>
                          <span className="text-[9px] text-primary/80 bg-primary/10 border border-primary/20 px-1.5 py-[1px] rounded-full shrink-0">
                            {v.status}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          <div className="flex items-center space-x-1 text-muted-foreground text-[10px]">
                            <Monitor className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{v.device}</span>
                          </div>
                          <span className="text-card-border">·</span>
                          <div className="flex items-center space-x-1 text-muted-foreground text-[10px]">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{v.flag} {v.location}</span>
                          </div>
                          <span className="text-card-border">·</span>
                          <span className="text-muted-foreground text-[10px] truncate">{v.browser}</span>
                          <span className="text-card-border">·</span>
                          <span className="text-muted-foreground text-[10px] truncate">{v.connection}</span>
                          <span className="text-card-border">·</span>
                          <span className="text-muted-foreground text-[10px] truncate">ISP: {v.isp}</span>
                          <span className="text-card-border">·</span>
                          <span className="text-muted-foreground text-[10px] truncate">Ref: {v.referenceId}</span>
                        </div>
                        <p className="text-muted-foreground/50 text-[10px] mt-0.5">
                          {new Date(v.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-primary font-semibold text-xs shrink-0 ml-2">+$0.50</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
