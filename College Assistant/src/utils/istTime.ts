/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The app must reason about "today", "tomorrow", and clock time consistently
 * in India Standard Time (IST, UTC+5:30) — regardless of what timezone the
 * browser or the server happens to be running in. Using `new Date()` directly
 * for day-of-week or hour checks is timezone-dependent and was a source of
 * real bugs (e.g. a server running in UTC would resolve "today" to the wrong
 * weekday for several hours a day). This module is the single source of
 * truth for "what day/time is it right now, in IST".
 *
 * Works in both the browser and Node (18+) via Intl — no timezone database
 * package required.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
const WEEKDAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export type WeekdayName = (typeof WEEKDAY_ORDER)[number];

export interface ISTNow {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  weekday: WeekdayName;
  /** YYYY-MM-DD in IST */
  iso: string;
}

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  weekday: 'long',
});

/** Current date/time, read as IST wall-clock values regardless of the host's local timezone. */
export function getISTNow(referenceDate: Date = new Date()): ISTNow {
  const parts = formatter.formatToParts(referenceDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  // Intl can format midnight as "24" with hour12:false in some environments — normalize.
  const rawHour = parseInt(get('hour'), 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = parseInt(get('minute'), 10);
  const weekday = get('weekday') as WeekdayName;

  const pad = (n: number) => String(n).padStart(2, '0');
  return { year, month, day, hour, minute, weekday, iso: `${year}-${pad(month)}-${pad(day)}` };
}

/** IST "today" as YYYY-MM-DD. */
export function todayISTISO(): string {
  return getISTNow().iso;
}

/** IST "tomorrow" as YYYY-MM-DD — computed via a real date object shifted by one day, not string math. */
export function tomorrowISTISO(): string {
  const now = getISTNow();
  // Construct a UTC instant matching this IST wall-clock moment, add a day,
  // then re-read it back as IST — avoids month/year rollover bugs.
  const utcMs = Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute) - 5.5 * 60 * 60 * 1000;
  const nextDay = new Date(utcMs + 24 * 60 * 60 * 1000);
  return getISTNow(nextDay).iso;
}

export function weekdayOfISODate(iso: string): WeekdayName | null {
  // Parse as a plain calendar date (no timezone shifting) since `iso` is
  // already an IST calendar date, not a UTC instant.
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  // Use noon UTC to sidestep any DST/timezone edge rounding entirely.
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return WEEKDAY_ORDER[dt.getUTCDay()];
}

/** Whole days between two IST calendar dates (b - a). */
export function daysBetweenISO(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** "YYYY-MM-DD HH:mm" for a given instant, expressed in IST — used for
 *  display timestamps (announcements, history) so they always read in
 *  India time regardless of server/browser timezone. */
export function formatISTTimestamp(date: Date): string {
  const ist = getISTNow(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${ist.iso} ${pad(ist.hour)}:${pad(ist.minute)}`;
}
