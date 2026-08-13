/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The frontend (src/App.tsx) owns the live timetable/announcement/group
 * state during a session, and syncs it here via POST /api/state/sync. Two
 * consumers depend on this being real and durable, not just an in-memory
 * mirror:
 *  - The midnight email digest (server-side, independent of any open
 *    browser tab) needs real data to build tomorrow's schedule from.
 *  - The frontend itself, on page load, calls GET /api/state/load to
 *    restore where you left off — including your linked WhatsApp groups —
 *    instead of starting over from scratch on every reload.
 * Backed by SQLite (server/db.ts) so this also survives a full server
 * restart, not just a browser refresh.
 */

import type { MasterTimetable, CollegeAnnouncement, MonitoredWhatsAppGroup, TimetableChangeRecord } from '../src/types';
import { saveState, loadState } from './db';

interface AppState {
  masterTimetable: MasterTimetable | null;
  announcements: CollegeAnnouncement[];
  monitoredGroups: MonitoredWhatsAppGroup[];
  changeHistory: TimetableChangeRecord[];
  updatedAt: string | null;
}

type SyncablePart = Partial<Pick<AppState, 'masterTimetable' | 'announcements' | 'monitoredGroups' | 'changeHistory'>>;

// Hydrate from disk on boot — this is what makes a server restart
// non-destructive.
const state: AppState = {
  masterTimetable: loadState('masterTimetable', null),
  announcements: loadState('announcements', []),
  monitoredGroups: loadState('monitoredGroups', []),
  changeHistory: loadState('changeHistory', []),
  updatedAt: loadState('updatedAt', null),
};

export function updateState(partial: SyncablePart) {
  if (partial.masterTimetable) {
    state.masterTimetable = partial.masterTimetable;
    saveState('masterTimetable', state.masterTimetable);
  }
  if (partial.announcements) {
    state.announcements = partial.announcements;
    saveState('announcements', state.announcements);
  }
  if (partial.monitoredGroups) {
    state.monitoredGroups = partial.monitoredGroups;
    saveState('monitoredGroups', state.monitoredGroups);
  }
  if (partial.changeHistory) {
    state.changeHistory = partial.changeHistory;
    saveState('changeHistory', state.changeHistory);
  }
  state.updatedAt = new Date().toISOString();
  saveState('updatedAt', state.updatedAt);
}

export function getState(): AppState {
  return state;
}
