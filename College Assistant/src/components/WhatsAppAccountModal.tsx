import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  RefreshCw, 
  X, 
  Shield, 
  Users, 
  Camera,
} from 'lucide-react';

interface WhatsAppAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroupIds: Set<string>;
  onToggleGroup: (group: { id: string; name: string; participantCount?: number }) => void;
}

type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';

interface WAServerState {
  status: WAStatus;
  qrDataUrl: string | null;
  linkedNumber: string | null;
  groups: { id: string; name: string; participantCount: number }[];
  lastError: string | null;
}

export const WhatsAppAccountModal: React.FC<WhatsAppAccountModalProps> = ({
  isOpen,
  onClose,
  selectedGroupIds,
  onToggleGroup,
}) => {
  const [waState, setWaState] = useState<WAServerState>({
    status: 'disconnected',
    qrDataUrl: null,
    linkedNumber: null,
    groups: [],
    lastError: null,
  });
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  // Kick off / resume the real WhatsApp connection whenever the modal opens,
  // then poll status (including the live QR code) while it's not connected.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (!res.ok) throw new Error('status endpoint unavailable');
        const data: WAServerState = await res.json();
        if (!cancelled) {
          setWaState(data);
          setBackendUnreachable(false);
        }
      } catch {
        if (!cancelled) setBackendUnreachable(true);
      }
    };

    (async () => {
      try {
        // Check current status first — only ask the backend to start a
        // connection if there genuinely isn't one in progress. Calling
        // connect() unconditionally every time the modal opens was safe in
        // principle (the backend used to guard against it), but doing this
        // check here too means we never even ask while already linked.
        const statusRes = await fetch('/api/whatsapp/status');
        const current = statusRes.ok ? await statusRes.json() : null;
        if (!current || current.status === 'disconnected' || current.status === 'error') {
          await fetch('/api/whatsapp/connect', { method: 'POST' });
        }
      } catch {
        setBackendUnreachable(true);
      }
      poll();
      interval = setInterval(poll, 2500);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setWaState({ status: 'disconnected', qrDataUrl: null, linkedNumber: null, groups: [], lastError: null });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Link Your Real WhatsApp Account</h3>
              <p className="text-xs text-slate-500">Scan with WhatsApp &rarr; Linked Devices to enable live AI parsing</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {backendUnreachable && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                Can't reach the WhatsApp backend right now. Make sure the server (<code className="font-mono">npm run dev</code>) is running on your machine — this feature needs a persistent Node process and won't work in a sandboxed preview.
              </div>
            )}

            {/* Connection Status Banner */}
            {waState.status === 'connected' ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">WhatsApp Linked</h4>
                    <p className="text-[11px] text-emerald-800">Connected as {waState.linkedNumber || 'your account'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition-colors"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${waState.status === 'qr_ready' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    {waState.status === 'qr_ready' ? 'Waiting for you to scan' : waState.status === 'connecting' ? 'Starting connection\u2026' : 'Not linked'}
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Open WhatsApp on your phone &rarr; Settings &rarr; <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>, then scan the code below.
                  </p>
                </div>
              </div>
            )}

            {/* Select Groups to Monitor */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Select WhatsApp Groups to Monitor
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedGroupIds.size} selected
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {waState.status !== 'connected' ? (
                  <p className="text-[11px] text-slate-500 italic px-1">
                    Link your WhatsApp account below to see your real groups here.
                  </p>
                ) : waState.groups.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic px-1">No groups found on this account yet.</p>
                ) : (
                  waState.groups.map((group) => {
                    const isActive = selectedGroupIds.has(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => onToggleGroup(group)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <div>
                            <span className="text-xs font-bold block">{group.name}</span>
                            <span className="text-[10px] text-slate-500">{group.participantCount} members</span>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Real, Scannable QR Code */}
            {waState.status !== 'connected' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Web Scanner</span>
                  </h4>
                </div>

                <div className="relative w-56 h-56 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-300 shadow-md flex items-center justify-center overflow-hidden">
                  {waState.qrDataUrl ? (
                    <img src={waState.qrDataUrl} alt="WhatsApp linking QR code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="text-[11px] font-medium">
                        {backendUnreachable ? 'Backend offline' : 'Generating QR code\u2026'}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 px-4">
                  This is a real, live WhatsApp Web QR code generated by your server — it refreshes automatically until scanned.
                </p>
              </div>
            )}

            {/* Privacy & Security Guarantee Banner */}
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Read-Only, Runs On Your Own Server</span>
              </div>
              <ul className="text-[11px] text-emerald-900 space-y-1 pl-6 list-disc font-medium leading-relaxed">
                <li><strong>No Automated Messaging:</strong> This app never sends or posts messages — it only reads groups you actively select.</li>
                <li><strong>Isolated Class Parsing:</strong> Only text from your selected groups is sent to the AI parser for timetable/exam extraction.</li>
                <li><strong>Unofficial library note:</strong> This uses an unofficial WhatsApp Web client, which is outside WhatsApp's official Terms of Service — use with a number you're comfortable taking that small risk on.</li>
              </ul>
            </div>

            {/* Done button */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all text-center"
              >
                Close &amp; Save Group Selection
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
