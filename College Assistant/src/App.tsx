/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, TabType } from './components/Navbar';
import { TimetableGrid } from './components/TimetableGrid';
import { WhatsappSimulator } from './components/WhatsappSimulator';
import { CollegeVocabularyView } from './components/CollegeVocabularyView';
import { OfficialTimetableModal } from './components/OfficialTimetableModal';
import { WhatsAppAccountModal } from './components/WhatsAppAccountModal';
import { DashboardView } from './components/DashboardView';
import { LectureNamesView } from './components/LectureNamesView';
import { AboutView } from './components/AboutView';
import { X } from 'lucide-react';
import { getISTNow, todayISTISO, weekdayOfISODate, daysBetweenISO, formatISTTimestamp, WeekdayName } from './utils/istTime';

import {
  DayOfWeek,
  MasterTimetable,
  TimetableChangeRecord,
  CollegeAnnouncement,
  ScheduledReminder,
  CalendarEvent,
  LearnedAcronym,
  MonitoredWhatsAppGroup,
  AIParseResult,
} from './types';

import {
  INITIAL_MASTER_TIMETABLE,
  INITIAL_GROUPS,
  INITIAL_ACRONYMS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REMINDERS,
  INITIAL_CALENDAR_EVENTS,
} from './data/defaultData';

const WEEKDAY_NAMES: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Works out which day of the timetable an AI-parsed message actually refers
 * to — and, just as importantly, whether we should touch the timetable at
 * all. Returns `null` when the date is too ambiguous or too far in the
 * future/past to safely apply automatically (e.g. a message about an exam
 * "next month"), so a vaguely-dated message can never accidentally clear or
 * overwrite today's schedule. Everything is resolved relative to the real
 * current date in India Standard Time, not server/browser local time.
 */
function resolveTargetDay(
  dateStr: string | undefined,
  parsedDateISO: string | undefined,
  currentDay: DayOfWeek
): DayOfWeek | null {
  const todayISO = todayISTISO();

  if (parsedDateISO && /^\d{4}-\d{2}-\d{2}$/.test(parsedDateISO)) {
    const diff = daysBetweenISO(todayISO, parsedDateISO);
    // Only auto-apply to the live timetable for dates within the current
    // week (yesterday through +6 days) — anything further out is "future,
    // verify before applying" territory rather than something to silently
    // stamp onto today's grid.
    if (diff >= -1 && diff <= 6) {
      const resolved = weekdayOfISODate(parsedDateISO);
      if (resolved && resolved !== 'Sunday' && resolved !== 'Saturday') {
        return resolved as DayOfWeek;
      }
    }
    return null; // too far away, or lands on a weekend with no timetable data
  }

  const normalized = (dateStr || '').trim().toLowerCase();
  if (!normalized || normalized === 'today') return currentDay;
  if (normalized === 'tomorrow' || normalized === 'tmr' || normalized === 'tmrw') {
    const idx = WEEKDAY_NAMES.indexOf(currentDay);
    let next = WEEKDAY_NAMES[(idx + 1) % 7];
    // Skip weekends — treat "tomorrow" said on a Friday as meaning Monday's
    // class, since that's the next day the timetable actually has classes.
    while (next === 'Saturday' || next === 'Sunday') {
      const nIdx = WEEKDAY_NAMES.indexOf(next);
      next = WEEKDAY_NAMES[(nIdx + 1) % 7];
    }
    return next;
  }

  const namedDay = WEEKDAY_NAMES.find((d) => normalized.includes(d.toLowerCase()));
  if (namedDay) {
    if (namedDay === 'Sunday' || namedDay === 'Saturday') return null;
    return namedDay;
  }

  // Genuinely unclear (e.g. "next month", a specific far-off date the AI
  // described only in prose) — don't guess, skip the timetable mutation.
  if (normalized) return null;

  // No date info at all: treat as today, since most urgent WhatsApp
  // announcements ("class cancelled", "room changed") are about right now.
  return currentDay;
}

/**
 * Finds which slot number a message refers to. The AI sometimes returns an
 * explicit slot number, but often (e.g. "blockchain class cancelled
 * tomorrow") it only names the subject. In that case, look up where that
 * subject already sits in the day's timetable instead of silently failing
 * to apply the change.
 */
function findSlotForMessage(
  daySlots: MasterTimetable[DayOfWeek],
  parsed: AIParseResult
): number | undefined {
  if (parsed.slot && daySlots[parsed.slot]) return parsed.slot;

  const entries = Object.entries(daySlots || {});
  if (parsed.subjectCode) {
    const match = entries.find(([, cell]) => cell.subjectCode?.toLowerCase() === parsed.subjectCode!.toLowerCase());
    if (match) return Number(match[0]);
  }
  if (parsed.subject) {
    const needle = parsed.subject.toLowerCase();
    const match = entries.find(
      ([, cell]) =>
        cell.subjectName.toLowerCase().includes(needle) || needle.includes(cell.subjectName.toLowerCase())
    );
    if (match) return Number(match[0]);
  }
  return parsed.slot;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Core Application Data States
  const [masterTimetable, setMasterTimetable] = useState<MasterTimetable>(INITIAL_MASTER_TIMETABLE);
  const [originalTimetable] = useState<MasterTimetable>(INITIAL_MASTER_TIMETABLE);
  const [changeHistory, setChangeHistory] = useState<TimetableChangeRecord[]>([]);
  
  const [announcements, setAnnouncements] = useState<CollegeAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [reminders, setReminders] = useState<ScheduledReminder[]>(INITIAL_REMINDERS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [learnedAcronyms, setLearnedAcronyms] = useState<LearnedAcronym[]>(INITIAL_ACRONYMS);
  const [monitoredGroups, setMonitoredGroups] = useState<MonitoredWhatsAppGroup[]>(INITIAL_GROUPS);

  // On first load, restore whatever was last synced to the server (which is
  // itself durably saved to disk — see server/db.ts) instead of always
  // starting over from the default seed data. This is what makes a page
  // refresh (or coming back tomorrow) not lose your linked groups, timetable
  // changes, or announcement feed.
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/state/load');
        if (!res.ok) return;
        const saved = await res.json();
        if (cancelled) return;
        if (saved.masterTimetable) setMasterTimetable(saved.masterTimetable);
        if (Array.isArray(saved.announcements) && saved.announcements.length > 0) {
          setAnnouncements(saved.announcements);
        }
        if (Array.isArray(saved.monitoredGroups) && saved.monitoredGroups.length > 0) {
          setMonitoredGroups(saved.monitoredGroups);
        }
        if (Array.isArray(saved.changeHistory) && saved.changeHistory.length > 0) {
          setChangeHistory(saved.changeHistory);
        }
      } catch {
        // Backend not reachable yet (e.g. still booting) — keep defaults,
        // the next periodic sync will still work once it's up.
      } finally {
        if (!cancelled) setHasHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggling a real WhatsApp group adds it to (or removes it from) the
  // monitored list entirely — there's no pre-seeded list to flip a flag on.
  const handleToggleGroup = (group: { id: string; name: string; participantCount?: number }) => {
    setMonitoredGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      if (exists) return prev.filter((g) => g.id !== group.id);
      return [
        ...prev,
        { id: group.id, name: group.name, unreadCount: 0, isActive: true, lastMessageTime: 'Just linked' },
      ];
    });
  };

  // Keep the WhatsApp backend's "which groups to read" list in sync with
  // whichever groups are currently selected here.
  useEffect(() => {
    const groupIds = monitoredGroups.map((g) => g.id).filter((id) => id.endsWith('@g.us'));
    fetch('/api/whatsapp/active-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupIds }),
    }).catch(() => {});
  }, [monitoredGroups]);

  // Real-time WhatsApp connection status, polled independent of whether the
  // link modal is open — this is what lets the navbar show "already linked"
  // immediately on page load/reopen, instead of requiring the user to open
  // the modal to find out.
  const [waStatus, setWaStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error'>('disconnected');
  const [waLinkedNumber, setWaLinkedNumber] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setWaStatus(data.status);
          setWaLinkedNumber(data.linkedNumber);
        }
      } catch {
        // silently ignore — badge just shows "not linked"
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const [isOfficialPdfOpen, setIsOfficialPdfOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Determine current day for timetable view with 18:00 (6 PM) auto-shift rule
  const getCurrentDayInfo = (): { day: DayOfWeek; isAfter18: boolean } => {
    // Always resolve "today"/"tomorrow" in India Standard Time, regardless
    // of what timezone the browser happens to be running in.
    const ist = getISTNow();
    let dayIdx = WEEKDAY_NAMES.indexOf(ist.weekday as DayOfWeek);
    const isAfter18 = ist.hour >= 18;

    // After 18:00 (6:00 PM) IST, automatically show tomorrow's schedule!
    if (isAfter18) {
      dayIdx = (dayIdx + 1) % 7;
    }

    let selected = WEEKDAY_NAMES[dayIdx];
    // If weekend (Sunday/Saturday), default to Monday for students
    if (selected === 'Sunday' || selected === 'Saturday') {
      selected = 'Monday';
    }
    return { day: selected as DayOfWeek, isAfter18 };
  };

  const { day: currentDay, isAfter18 } = getCurrentDayInfo();

  // Keep the server's copy of state durably in sync (SQLite-backed — see
  // server/db.ts), so both the midnight email digest and a future page
  // reload have real, current data instead of the default seed data. Waits
  // for the initial hydration to finish first, so we never overwrite
  // already-saved data with the empty defaults during the brief window
  // before /api/state/load responds.
  useEffect(() => {
    if (!hasHydrated) return;
    const timeout = setTimeout(() => {
      fetch('/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterTimetable, announcements, monitoredGroups, changeHistory }),
      }).catch(() => {
        // Non-fatal — the dashboard still works locally even if sync fails.
      });
    }, 500); // debounce rapid successive updates
    return () => clearTimeout(timeout);
  }, [masterTimetable, announcements, monitoredGroups, changeHistory, hasHydrated]);


  // Process New WhatsApp Message via Gemini AI
  // Applies an already-parsed AI result to app state (timetable, calendar,
  // reminders, acronyms, announcements). Shared by both the manual WhatsApp
  // simulator (which parses via a fetch call) and real live WhatsApp
  // messages arriving over the SSE stream (which arrive pre-parsed).
  const applyParsedMessage = (
    rawMessage: string,
    groupName: string,
    sender: string,
    parsed: AIParseResult,
    timestampOverride?: string
  ) => {
    // 1. Add to Announcements stream
    const newAnn: CollegeAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: timestampOverride || formatISTTimestamp(new Date()),
      groupName,
      sender,
      rawMessage,
      normalizedMessage: parsed.normalizedText,
      category: (parsed.type as any) || 'General',
      subject: parsed.subject,
      dateStr: parsed.dateStr,
      slot: parsed.slot || undefined,
      venue: parsed.venue || undefined,
      actionRequired: true,
      syncedToCalendar: parsed.calendarEventNeeded,
    };

    setAnnouncements((prev) => [newAnn, ...prev]);

    // 2. Handle Timetable Engine Modification — applied immediately so the
    // Timetable page reflects it as soon as the message comes in.
    if (
      parsed.type === 'Class Shift' ||
      parsed.type === 'Cancelled' ||
      parsed.type === 'Room Changed'
    ) {
      const targetDay = resolveTargetDay(parsed.dateStr, parsed.parsedDateISO, currentDay);

      // Genuinely ambiguous or far-future/past date → don't guess which day
      // to touch. The message still shows up in Announcements either way.
      if (targetDay) {
        setMasterTimetable((prev) => {
          const updated = { ...prev };
          const daySlots = { ...(updated[targetDay] || {}) };

          if (parsed.type === 'Cancelled' && (parsed.wholeDayCancelled || !findSlotForMessage(daySlots, parsed))) {
            // "No classes tomorrow" / "third years may not have class" — no
            // single subject named, so clear every class slot for that day
            // rather than silently doing nothing.
            for (const key of Object.keys(daySlots)) delete daySlots[Number(key)];
          } else {
            // The AI doesn't always return an explicit slot number (e.g.
            // "blockchain class cancelled tomorrow" names the subject, not a
            // slot). Fall back to finding that subject's own slot on the
            // target day from the current timetable.
            const resolvedSlot = findSlotForMessage(daySlots, parsed);

            if (resolvedSlot && daySlots[resolvedSlot]) {
              const originalCell = daySlots[resolvedSlot];

              if (parsed.type === 'Cancelled') {
                // No class → the slot should show as genuinely free, not
                // just flagged, so remove it from the day entirely.
                delete daySlots[resolvedSlot];
              } else if (parsed.type === 'Room Changed' && parsed.venue) {
                daySlots[resolvedSlot] = {
                  ...originalCell,
                  venue: parsed.venue,
                  isShifted: true,
                };
              }
            }

            if (parsed.type === 'Class Shift' && parsed.newSlot) {
              const oldSlotNum = resolvedSlot;
              const oldCell = (oldSlotNum && daySlots[oldSlotNum]) || {
                id: `shift-${Date.now()}`,
                slotNumber: parsed.newSlot,
                subjectCode: parsed.subjectCode || 'SUBJ',
                subjectName: parsed.subject || 'Class',
                faculty: parsed.faculty || 'Faculty',
                venue: parsed.venue || 'Room 1',
                type: 'Theory' as const,
              };

              // The class no longer occupies its old slot once shifted.
              if (oldSlotNum && oldSlotNum !== parsed.newSlot) {
                delete daySlots[oldSlotNum];
              }

              daySlots[parsed.newSlot] = {
                ...oldCell,
                slotNumber: parsed.newSlot,
                isShifted: true,
              };
            }
          }

          updated[targetDay] = daySlots;
          return updated;
        });
      }

      // Record Audit Trail
      const historyRecord: TimetableChangeRecord = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatISTTimestamp(new Date()).split(' ')[1], // HH:mm in IST
        originalMessage: rawMessage,
        changeType: parsed.type as any,
        subject: parsed.wholeDayCancelled ? 'All Classes' : parsed.subject || 'Subject',
        day: targetDay || currentDay,
        oldSlot: parsed.oldSlot || parsed.slot || undefined,
        newSlot: parsed.newSlot || undefined,
        newVenue: parsed.venue || undefined,
        status: targetDay ? 'Applied' : 'Skipped',
      };

      setChangeHistory((prev) => [historyRecord, ...prev]);
    }

    // 3. Sync to Google Calendar
    if (parsed.calendarEventNeeded && parsed.subject) {
      const eventId = `gcal_${Date.now()}`;
      const newEvent: CalendarEvent = {
        id: eventId,
        title: `⚡ ${parsed.type}: ${parsed.subject}`,
        description: `Auto-generated by College AI Assistant.\nMessage: "${rawMessage}"`,
        startDateTime: `${parsed.parsedDateISO || '2026-07-29'}T11:35:00`,
        endDateTime: `${parsed.parsedDateISO || '2026-07-29'}T12:25:00`,
        location: parsed.venue || 'Room 1',
        category: parsed.type,
        googleCalendarEventId: eventId,
        status: 'Confirmed',
      };

      setCalendarEvents((prev) => [newEvent, ...prev]);
    }

    // 4. Schedule Reminder Engine
    if (parsed.reminderNeeded && parsed.subject) {
      const newRem: ScheduledReminder = {
        id: `rem-${Date.now()}`,
        title: `${parsed.type}: ${parsed.subject}`,
        subject: parsed.subject,
        eventDate: parsed.dateStr || 'Upcoming',
        category: parsed.type,
        channels: ['Desktop', 'Email', 'Telegram'],
        startReminderDate: '3 days before event (Active)',
        repeatIntervalHours: 5,
        status: 'Scheduled',
      };

      setReminders((prev) => [newRem, ...prev]);
    }

    // 5. Update Learned Acronyms
    if (parsed.learnedAcronyms && parsed.learnedAcronyms.length > 0) {
      parsed.learnedAcronyms.forEach((ac) => {
        setLearnedAcronyms((prev) => {
          if (prev.some((a) => a.term.toLowerCase() === ac.term.toLowerCase())) return prev;
          return [
            {
              id: `ac-${Date.now()}`,
              term: ac.term,
              meaning: ac.meaning,
              category: ac.category as any,
              confidence: 0.95,
              detectedFrom: rawMessage,
              learnedAt: new Date().toISOString().split('T')[0],
            },
            ...prev,
          ];
        });
      });
    }
  };

  // Used by the manual WhatsApp simulator: calls the parser API, then
  // applies the result via applyParsedMessage.
  const handleProcessNewMessage = async (
    rawMessage: string,
    groupName: string,
    sender: string
  ): Promise<AIParseResult> => {
    try {
      const res = await fetch('/api/parse-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMessage, groupName, sender }),
      });

      const responseData = await res.json();
      const parsed: AIParseResult = responseData.data;

      applyParsedMessage(rawMessage, groupName, sender, parsed);

      return parsed;
    } catch (err: any) {
      console.error('Error handling message:', err);
      throw err;
    }
  };

  // Real (and backfilled) WhatsApp messages arrive here, already parsed
  // server-side — applied immediately so the timetable and dashboard update
  // live without a page refresh.
  useEffect(() => {
    const es = new EventSource('/api/whatsapp/events');
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const { groupName, sender, rawMessage, parsed, timestamp } = payload;
        if (!parsed) return;
        const prettyTimestamp = formatISTTimestamp(new Date(timestamp));
        applyParsedMessage(rawMessage, groupName, sender, parsed, prettyTimestamp);
      } catch (err) {
        console.error('Failed to process live WhatsApp event:', err);
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects on its own; nothing to do here.
    };
    return () => es.close();
  }, [currentDay]);

  const handleRevertChange = (historyId: string) => {
    setChangeHistory((prev) =>
      prev.map((h) => (h.id === historyId ? { ...h, status: 'Reverted' } : h))
    );
    // Reset timetable to original
    setMasterTimetable(originalTimetable);
  };

  const handleSyncGoogleCalendar = () => {
    console.log('Synchronizing Google Calendar...');
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] bg-aurora text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingAnnouncementsCount={announcements.length}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        waStatus={waStatus}
        waLinkedNumber={waLinkedNumber}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tab 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <span className="gradient-text">Student</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Here's what your monitored WhatsApp groups have flagged — synced live.</p>
                  </div>
                </div>

                <DashboardView
                  groups={monitoredGroups}
                  announcements={announcements}
                  onOpenAccountModal={() => setIsAccountModalOpen(true)}
                  onOpenSimulator={() => setIsSimulatorOpen(true)}
                />
              </div>
            )}

            {/* Tab 2: Lecture Names */}
            {activeTab === 'lectures' && <LectureNamesView />}

            {/* Tab 3: Gen Z Words */}
            {activeTab === 'genz' && (
              <CollegeVocabularyView
                acronyms={learnedAcronyms}
                onAddAcronym={(ac) => setLearnedAcronyms((prev) => [ac, ...prev])}
              />
            )}

            {/* Tab 4: Timetable */}
            {activeTab === 'timetable' && (
              <TimetableGrid
                masterTimetable={masterTimetable}
                originalTimetable={originalTimetable}
                changeHistory={changeHistory}
                onRevertChange={handleRevertChange}
                onOpenOfficialPdf={() => setIsOfficialPdfOpen(true)}
              />
            )}

            {/* Tab 5: About */}
            {activeTab === 'about' && <AboutView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* WhatsApp AI Simulator (opened from Dashboard, not a main nav tab) */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 15 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl max-w-4xl w-full p-5 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <WhatsappSimulator
                groups={monitoredGroups}
                announcements={announcements}
                onProcessNewMessage={handleProcessNewMessage}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official PDF Viewer Modal */}
      <OfficialTimetableModal
        isOpen={isOfficialPdfOpen}
        onClose={() => setIsOfficialPdfOpen(false)}
      />

      {/* WhatsApp Account & API Key Linker Modal */}
      <WhatsAppAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        selectedGroupIds={new Set(monitoredGroups.map((g) => g.id))}
        onToggleGroup={handleToggleGroup}
      />

      {/* Bottom Status Bar */}
      <footer className="h-9 bg-white/75 backdrop-blur-xl border-t border-slate-200/70 px-4 sm:px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono select-none">
        <div className="flex gap-4 sm:gap-6 overflow-hidden">
          <span>DB: POSTGRESQL_PROD</span>
          <span className="hidden sm:inline">STORAGE: 14.2 GB / 100 GB</span>
          <span className="hidden md:inline">SESSIONS: Playwright_Instance_Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 font-bold">AUTO-SYNC: ON</span>
          <span className="w-1 h-1 rounded-full bg-slate-400"></span>
          <span className="hidden sm:inline">REMINDERS: DESKTOP + TELEGRAM</span>
        </div>
      </footer>
    </div>
  );
}
