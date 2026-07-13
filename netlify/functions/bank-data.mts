import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const STORE = '-';

type AccountData = {
  hash: string;
  startTime: string;
  hourlyRate: number;
  bonusBalance: number; // extra balance from invite links
};

type TransferState = {
  running: boolean;
  remainingSecs: number;
  pausedAt: string | null; // ISO timestamp when paused
  startedAt: string | null; // ISO timestamp when last resumed
  amount: number;
  bankId: string;
  accountNumber: string;
};

type InviteLink = {
  token: string;
  usedBy: string[]; // fingerprint IDs that used it
};

type InviteUse = {
  token: string;
  fingerprint: string;
};

export default async (req: Request, _ctx: Context) => {
  const store = getStore(STORE);
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? (req.method === 'POST' ? (await req.clone().json().catch(() => ({}))).action : null);

  // ── GET /api/bank-data?action=status ─────────────────────────────────────
  if (req.method === 'GET' && url.searchParams.get('action') === 'status') {
    const account = await store.get('account', { type: 'json' }).catch(() => null) as AccountData | null;
    const transfer = await store.get('transfer', { type: 'json' }).catch(() => null) as TransferState | null;

    return Response.json({
      hasAccount: !!account,
      startTime: account?.startTime ?? null,
      hourlyRate: account?.hourlyRate ?? 100,
      bonusBalance: account?.bonusBalance ?? 0,
      transfer: transfer ?? null,
    });
  }

  // ── GET /api/bank-data?action=invite-token ────────────────────────────────
  if (req.method === 'GET' && url.searchParams.get('action') === 'invite-token') {
    const invite = await store.get('invite', { type: 'json' }).catch(() => null) as InviteLink | null;
    if (!invite) {
      // create one
      const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
      const newInvite: InviteLink = { token, usedBy: [] };
      await store.setJSON('invite', newInvite);
      return Response.json({ token });
    }
    return Response.json({ token: invite.token });
  }

  // ── POST actions ──────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body: any = {};
    try { body = await req.json(); } catch {}
    const { action: bodyAction } = body;
    const act = bodyAction;

    // setup
    if (act === 'setup') {
      const { hash } = body;
      if (!hash) return Response.json({ success: false, error: 'Missing hash' }, { status: 400 });
      const existing = await store.get('account', { type: 'json' }).catch(() => null);
      if (existing) return Response.json({ success: false, error: 'Account already exists' }, { status: 409 });
      const now = new Date().toISOString();
      await store.setJSON('account', { hash, startTime: now, hourlyRate: 100, bonusBalance: 0 });
      return Response.json({ success: true, startTime: now, hourlyRate: 100, bonusBalance: 0 });
    }

    // login
    if (act === 'login') {
      const { hash } = body;
      const account = await store.get('account', { type: 'json' }).catch(() => null) as AccountData | null;
      if (!account) return Response.json({ success: false, error: 'No account' }, { status: 404 });
      if (account.hash !== hash) return Response.json({ success: false, error: 'Wrong password' }, { status: 401 });
      const transfer = await store.get('transfer', { type: 'json' }).catch(() => null) as TransferState | null;
      return Response.json({ success: true, startTime: account.startTime, hourlyRate: account.hourlyRate, bonusBalance: account.bonusBalance ?? 0, transfer: transfer ?? null });
    }

    // transfer-start
    if (act === 'transfer-start') {
      const { amount, bankId, accountNumber } = body;
      const now = new Date().toISOString();
      const state: TransferState = {
        running: true,
        remainingSecs: 2 * 3600,
        pausedAt: null,
        startedAt: now,
        amount,
        bankId,
        accountNumber,
      };
      await store.setJSON('transfer', state);
      return Response.json({ success: true, transfer: state });
    }

    // transfer-pause
    if (act === 'transfer-pause') {
      const transfer = await store.get('transfer', { type: 'json' }).catch(() => null) as TransferState | null;
      if (!transfer || !transfer.running) return Response.json({ success: false, error: 'No active transfer' });
      // calculate how many seconds have elapsed since last resume
      const elapsed = transfer.startedAt
        ? Math.floor((Date.now() - new Date(transfer.startedAt).getTime()) / 1000)
        : 0;
      const remaining = Math.max(0, transfer.remainingSecs - elapsed);
      const updated: TransferState = { ...transfer, running: remaining > 0 ? false : false, remainingSecs: remaining, pausedAt: new Date().toISOString(), startedAt: null };
      await store.setJSON('transfer', updated);
      return Response.json({ success: true, transfer: updated });
    }

    // transfer-resume
    if (act === 'transfer-resume') {
      const transfer = await store.get('transfer', { type: 'json' }).catch(() => null) as TransferState | null;
      if (!transfer) return Response.json({ success: false, error: 'No transfer' });
      if (transfer.remainingSecs <= 0) return Response.json({ success: true, transfer: { ...transfer, running: false } });
      const updated: TransferState = { ...transfer, running: true, pausedAt: null, startedAt: new Date().toISOString() };
      await store.setJSON('transfer', updated);
      return Response.json({ success: true, transfer: updated });
    }

    // transfer-complete (client signals done)
    if (act === 'transfer-complete') {
      await store.delete('transfer');
      return Response.json({ success: true });
    }

    // use-invite
    if (act === 'use-invite') {
      const { token, fingerprint } = body as InviteUse;
      const ip =
  req.headers.get("x-nf-client-connection-ip") ||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

if (!ip) {
  return Response.json(
    { success: false, error: "No se pudo verificar tu conexión." },
    { status: 400 }
  );
}

const apiKey = process.env.IPQS_API_KEY;

if (!apiKey) {
  return Response.json(
    { success: false, error: "VPN check no configurado." },
    { status: 500 }
  );
}

const response = await fetch(
  `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}`
);

const ipInfo = await response.json();

if (!(ipInfo.vpn || ipInfo.proxy || ipInfo.tor)) {
  return Response.json(
    {
      success: false,
      error: "Debes conectarte mediante una VPN para usar esta invitación."
    },
    { status: 403 }
  );
}
      if (!token || !fingerprint) return Response.json({ success: false, error: 'Missing fields' }, { status: 400 });

      const invite = await store.get('invite', { type: 'json' }).catch(() => null) as InviteLink | null;
      if (!invite || invite.token !== token) return Response.json({ success: false, error: 'Invalid invite link' }, { status: 404 });
      if (invite.usedBy.includes(fingerprint)) return Response.json({ success: false, error: 'Already used on this device' }, { status: 409 });

      // Mark used
      invite.usedBy.push(fingerprint);
      await store.setJSON('invite', invite);

      // Add $1000 bonus to account
      const account = await store.get('account', { type: 'json' }).catch(() => null) as AccountData | null;
      if (account) {
        account.bonusBalance = (account.bonusBalance ?? 0) + 1000;
        await store.setJSON('account', account);
      }

      return Response.json({ success: true, bonus: 1000 });
    }

    return Response.json({ success: false, error: 'Unknown action' }, { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = { path: '/api/bank-data' };
