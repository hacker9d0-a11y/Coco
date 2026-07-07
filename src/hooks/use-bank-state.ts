import { useState, useEffect } from 'react';

const EXPIRY_KEY = 'randy_bank_session_expiry';
const FINGERPRINT_KEY = 'randy_bank_fp';
const API_URL = '/api/bank-data';
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function newExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function getOrCreateFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

export type TransferState = {
  running: boolean;
  remainingSecs: number;
  pausedAt: string | null;
  startedAt: string | null;
  amount: number;
  bankId: string;
  accountNumber: string;
} | null;

export type AuthState = 'loading' | 'setup' | 'login' | 'dashboard';

export function useBankState() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(100);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [transfer, setTransfer] = useState<TransferState>(null);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
  const hasInviteToken = new URLSearchParams(window.location.search).has('invite');
  try {
    const res = await fetch(`${API_URL}?action=status`);
    const data = await res.json();
    if (!data.hasAccount) { setAuthState('setup'); return; }
    setHourlyRate(data.hourlyRate ?? 100);
    setBonusBalance(data.bonusBalance ?? 0);

    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (hasInviteToken || !expiry || new Date(expiry).getTime() < Date.now()) {
      localStorage.removeItem(EXPIRY_KEY);
      setAuthState('login');
      return;
    }
    setStartTime(data.startTime);
    setTransfer(data.transfer ?? null);
    setAuthState('dashboard');
  } catch {
    setAuthState('login');
  }
};

  const setupAccount = async (password: string) => {
    const hash = await hashPassword(password);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup', hash }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not create account');
    localStorage.setItem(EXPIRY_KEY, newExpiry());
    setStartTime(data.startTime);
    setHourlyRate(data.hourlyRate ?? 100);
    setBonusBalance(data.bonusBalance ?? 0);
    setAuthState('dashboard');
  };

  const login = async (password: string): Promise<boolean> => {
    const hash = await hashPassword(password);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', hash }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return false;
    localStorage.setItem(EXPIRY_KEY, newExpiry());
    setStartTime(data.startTime);
    setHourlyRate(data.hourlyRate ?? 100);
    setBonusBalance(data.bonusBalance ?? 0);
    setTransfer(data.transfer ?? null);
    setAuthState('dashboard');
    return true;
  };

  const logout = () => {
    localStorage.removeItem(EXPIRY_KEY);
    setAuthState('login');
  };

  const startTransfer = async (amount: number, bankId: string, accountNumber: string) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer-start', amount, bankId, accountNumber }),
    });
    const data = await res.json();
    if (data.success) setTransfer(data.transfer);
  };

  const pauseTransfer = async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer-pause' }),
    });
    const data = await res.json();
    if (data.success) setTransfer(data.transfer);
  };

  const resumeTransfer = async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer-resume' }),
    });
    const data = await res.json();
    if (data.success) setTransfer(data.transfer);
  };

  const completeTransfer = async () => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer-complete' }),
    });
    setTransfer(null);
  };

  const useInviteLink = async (token: string): Promise<{ success: boolean; error?: string; bonus?: number }> => {
    const fingerprint = getOrCreateFingerprint();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'use-invite', token, fingerprint }),
    });
    const data = await res.json();
    if (data.success) {
      setBonusBalance(prev => prev + (data.bonus ?? 1000));
    }
    return data;
  };

  const getInviteToken = async (): Promise<string> => {
    const res = await fetch(`${API_URL}?action=invite-token`);
    const data = await res.json();
    return data.token;
  };

  return {
    authState, startTime, hourlyRate, bonusBalance, transfer,
    setupAccount, login, logout,
    startTransfer, pauseTransfer, resumeTransfer, completeTransfer,
    useInviteLink, getInviteToken,
  };
}
