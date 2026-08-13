/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real WhatsApp Web connection using Baileys (an unofficial WhatsApp Web protocol
 * library). This connects to YOUR OWN WhatsApp account by scanning a real QR code
 * with your phone (WhatsApp app -> Settings -> Linked Devices -> Link a Device),
 * exactly like WhatsApp Web / WhatsApp Desktop does.
 *
 * IMPORTANT — read before running:
 * 1. This uses an UNOFFICIAL library, not WhatsApp's official Business API.
 *    Automated / bot-like use of unofficial clients is outside WhatsApp's Terms
 *    of Service. Using it to auto-read your own group announcements for personal
 *    organizing is common practice for hobby projects, but there is a real (if
 *    generally low) risk your account could be flagged or temporarily restricted.
 *    Use at your own risk, ideally with a secondary/non-critical number.
 * 2. This process must stay RUNNING continuously to keep the session alive —
 *    it cannot run in a serverless function or a sandboxed dev-preview that
 *    sleeps. Run it on a machine or small server you control.
 * 3. Session credentials are written to ./whatsapp-auth on disk (gitignored).
 *    Anyone with access to that folder can access your linked WhatsApp session.
 *    Do not commit it or upload it anywhere.
 * 4. Only groups you explicitly toggle "active" in the app are read; the
 *    process never sends messages on your behalf.
 */

import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import P from 'pino';
import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
} from '@whiskeysockets/baileys';

const AUTH_DIR = path.join(process.cwd(), 'whatsapp-auth');

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';

interface WAGroupSummary {
  id: string;
  name: string;
  participantCount: number;
}

interface WAState {
  status: WhatsAppStatus;
  qrDataUrl: string | null;
  linkedNumber: string | null;
  groups: WAGroupSummary[];
  lastError: string | null;
}

type MessageHandler = (args: { groupId: string; groupName: string; sender: string; text: string; timestampMs?: number }) => void;

interface BufferedMessage {
  id: string;
  sender: string;
  text: string;
  timestampMs: number;
}

const MAX_BACKFILL_PER_GROUP = 10;

class WhatsAppManager {
  private sock: WASocket | null = null;
  private state: WAState = {
    status: 'disconnected',
    qrDataUrl: null,
    linkedNumber: null,
    groups: [],
    lastError: null,
  };
  private activeGroupIds = new Set<string>();
  private messageHandler: MessageHandler | null = null;
  // Recent message history per group, captured from Baileys' one-time
  // post-link history sync, used to backfill the last ~10 messages of a
  // group the moment you select it (see setActiveGroups below).
  private historyByGroup = new Map<string, BufferedMessage[]>();
  private backfilledGroupIds = new Set<string>();
  // Prevents the same WhatsApp message being processed twice if it shows up
  // in both the one-time history sync and the live message stream.
  private processedMessageIds = new Set<string>();

  getState(): WAState {
    return this.state;
  }

  setActiveGroups(ids: string[]) {
    const newlyActivated = ids.filter((id) => !this.activeGroupIds.has(id));
    this.activeGroupIds = new Set(ids);
    for (const jid of newlyActivated) {
      this.backfillGroup(jid);
    }
  }

  /** Replays the last ~10 buffered messages for a newly-selected group, in
   *  chronological order, through the same handler live messages use — so
   *  the timetable/dashboard update immediately with recent context instead
   *  of waiting for the next new message to arrive. Best-effort: only
   *  messages WhatsApp actually sent during the post-link history sync are
   *  available; this can't fetch older history on demand. */
  private backfillGroup(jid: string) {
    if (this.backfilledGroupIds.has(jid)) return; // don't replay twice
    this.backfilledGroupIds.add(jid);

    const buffered = this.historyByGroup.get(jid);
    if (!buffered || buffered.length === 0) return;

    const group = this.state.groups.find((g) => g.id === jid);
    const last10 = [...buffered].sort((a, b) => a.timestampMs - b.timestampMs).slice(-MAX_BACKFILL_PER_GROUP);

    for (const msg of last10) {
      if (this.processedMessageIds.has(msg.id)) continue;
      this.processedMessageIds.add(msg.id);
      this.messageHandler?.({
        groupId: jid,
        groupName: group?.name || 'WhatsApp Group',
        sender: msg.sender,
        text: msg.text,
        timestampMs: msg.timestampMs,
      });
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  async start() {
    // A socket instance already exists and is in progress or connected —
    // starting another one here was the real cause of "QR keeps
    // regenerating": two competing Baileys sockets sharing the same auth
    // files fight each other, WhatsApp kicks one out with a stream
    // conflict, and the resulting reconnect looks like a fresh (re-QR'd)
    // login. Only ever have one socket alive at a time.
    if (this.sock) return;
    this.state.status = 'connecting';
    this.state.lastError = null;

    if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();
    const logger = P({ level: 'silent' }) as any;

    this.sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      browser: ['College AI Assistant', 'Chrome', '1.0.0'],
    });

    this.sock.ev.on('creds.update', saveCreds);

    // WhatsApp sends a one-time batch of recent chat history shortly after
    // linking (or reconnecting) — this is the only source of "past
    // messages" available; there's no on-demand "fetch last N" API.
    this.sock.ev.on('messaging-history.set', ({ messages }: any) => {
      console.log(`[WhatsApp] History sync received: ${messages?.length || 0} total messages across all chats`);
      for (const msg of messages || []) {
        const jid = msg.key?.remoteJid || '';
        if (!jid.endsWith('@g.us')) continue;
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';
        if (!text) continue;
        const timestampMs = (Number(msg.messageTimestamp) || Date.now() / 1000) * 1000;
        const msgId = msg.key?.id || `${jid}-${timestampMs}-${text.slice(0, 20)}`;
        const entry: BufferedMessage = { id: msgId, sender: msg.pushName || 'Unknown', text, timestampMs };
        const list = this.historyByGroup.get(jid) || [];
        list.push(entry);
        this.historyByGroup.set(jid, list);
      }
      // If any already-active groups were selected before history arrived
      // (e.g. re-selected after a restart), backfill them now.
      for (const jid of this.activeGroupIds) {
        this.backfillGroup(jid);
      }
    });

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.state.status = 'qr_ready';
        this.state.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
      }

      if (connection === 'open') {
        this.state.status = 'connected';
        this.state.qrDataUrl = null;
        this.state.linkedNumber = this.sock?.user?.id?.split(':')[0] ?? null;
        await this.refreshGroups();
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        this.state.status = 'disconnected';
        this.state.qrDataUrl = null;
        this.sock = null; // clear so the guard in start() allows a fresh reconnect
        if (shouldReconnect) {
          setTimeout(() => this.start(), 2000);
        } else {
          // Logged out from the phone side — clear stored session
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          this.state.linkedNumber = null;
          this.state.groups = [];
        }
      }
    });

    this.sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        const jid = msg.key.remoteJid || '';
        if (!jid.endsWith('@g.us')) continue; // only groups
        if (!this.activeGroupIds.has(jid)) continue; // only monitored groups
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';
        if (!text) continue;
        const timestampMs = (Number(msg.messageTimestamp) || Date.now() / 1000) * 1000;
        const msgId = msg.key?.id || `${jid}-${timestampMs}-${text.slice(0, 20)}`;
        if (this.processedMessageIds.has(msgId)) continue; // already handled via backfill
        this.processedMessageIds.add(msgId);
        const group = this.state.groups.find((g) => g.id === jid);
        this.messageHandler?.({
          groupId: jid,
          groupName: group?.name || 'WhatsApp Group',
          sender: msg.pushName || 'Unknown',
          text,
          timestampMs,
        });
      }
    });
  }

  async refreshGroups() {
    if (!this.sock) return;
    try {
      const chats = await this.sock.groupFetchAllParticipating();
      this.state.groups = Object.values(chats).map((c: any) => ({
        id: c.id,
        name: c.subject || 'Unnamed Group',
        participantCount: c.participants?.length ?? 0,
      }));
    } catch (err) {
      console.error('[WhatsApp] Failed to fetch groups:', err);
    }
  }

  async logout() {
    try {
      await this.sock?.logout();
    } catch {
      // ignore
    }
    this.sock = null;
    this.state = { status: 'disconnected', qrDataUrl: null, linkedNumber: null, groups: [], lastError: null };
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }
}

export const whatsappManager = new WhatsAppManager();
