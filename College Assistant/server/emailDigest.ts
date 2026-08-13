/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sends an automatic email every night at 24:00 (midnight) with the next
 * day's timetable, plus any exams, quizzes, or important notes the AI
 * detected from WhatsApp that are relevant to tomorrow.
 *
 * REQUIRES (see EMAIL_SETUP.md):
 * - GMAIL_USER        — the Gmail address to send from
 * - GMAIL_APP_PASSWORD — a 16-character Gmail App Password (not your normal
 *                        password — Gmail blocks plain-password SMTP login)
 * - DIGEST_TO         — the recipient address (can be the same as GMAIL_USER)
 *
 * Like the WhatsApp connection, this needs a continuously-running Node
 * process and outbound network access to Gmail's SMTP servers — it cannot
 * be tested from this sandboxed dev environment (no network route to
 * smtp.gmail.com here), only on a machine/server you control.
 */

import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { getState } from './state';
import { getAcademicDay } from '../src/data/academicCalendar';
import { DayOfWeek, MasterTimetable } from '../src/types';
import { tomorrowISTISO, weekdayOfISODate } from '../src/utils/istTime';

function weekdayName(dateISO: string): DayOfWeek {
  return (weekdayOfISODate(dateISO) || 'Monday') as DayOfWeek;
}

function buildDigestHtml(): { subject: string; html: string } | null {
  const state = getState();
  const dateISO = tomorrowISTISO();
  const academicInfo = getAcademicDay(dateISO);
  const prettyDate = new Date(`${dateISO}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  });

  // Holiday tomorrow — short, clear email instead of an empty timetable.
  if (academicInfo && !academicInfo.isWorkingDay) {
    return {
      subject: `No classes tomorrow (${prettyDate}) — Holiday`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color:#4f46e5;">Tomorrow is a holiday 🎉</h2>
          <p><strong>${prettyDate}</strong></p>
          <p>${academicInfo.note || 'No classes scheduled.'}</p>
        </div>`,
    };
  }

  const effectiveWeekday: DayOfWeek = academicInfo?.followsTimetableOf
    ? (academicInfo.followsTimetableOf as DayOfWeek)
    : weekdayName(dateISO);

  const timetable: MasterTimetable | null = state.masterTimetable;
  const daySlots = timetable?.[effectiveWeekday] || {};
  const slotRows = Object.values(daySlots)
    .sort((a, b) => a.slotNumber - b.slotNumber)
    .map((cell) => {
      const status = cell.isCancelled ? ' <span style="color:#e11d48;">(Cancelled)</span>' : cell.isShifted ? ' <span style="color:#4f46e5;">(Shifted)</span>' : '';
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600;">Slot ${cell.slotNumber}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${cell.subjectName}${status}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666;">${cell.venue}</td>
      </tr>`;
    })
    .join('');

  // Exams/quizzes/important notes relevant to tomorrow, from AI-parsed announcements.
  const relevant = (state.announcements || []).filter((a) =>
    ['Exam', 'Quiz', 'Lab Evaluation', 'Assignment'].includes(a.category)
  );
  const notesRows = relevant
    .slice(0, 8)
    .map((a) => `<li><strong>${a.category}</strong>${a.subject ? ` — ${a.subject}` : ''}: ${a.normalizedMessage}</li>`)
    .join('');

  return {
    subject: `Tomorrow's Schedule — ${prettyDate}${academicInfo?.followsTimetableOf ? ` (${academicInfo.followsTimetableOf}'s Timetable)` : ''}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#4f46e5;">Your Schedule for Tomorrow</h2>
        <p><strong>${prettyDate}</strong>${academicInfo?.followsTimetableOf ? ` — working Saturday, following ${academicInfo.followsTimetableOf}'s timetable` : ''}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f5f5f7;text-align:left;">
              <th style="padding:6px 10px;">Slot</th><th style="padding:6px 10px;">Subject</th><th style="padding:6px 10px;">Venue</th>
            </tr>
          </thead>
          <tbody>${slotRows || '<tr><td colspan="3" style="padding:10px;color:#999;">No timetable data synced yet.</td></tr>'}</tbody>
        </table>
        ${notesRows ? `<h3 style="color:#4f46e5;">Exams, Quizzes & Notes</h3><ul>${notesRows}</ul>` : ''}
        <p style="color:#999;font-size:12px;margin-top:24px;">Sent automatically by College AI Assistant at midnight.</p>
      </div>`,
  };
}

async function sendDigestEmail() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, DIGEST_TO } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !DIGEST_TO) {
    console.warn('[EmailDigest] Skipped — GMAIL_USER / GMAIL_APP_PASSWORD / DIGEST_TO not set in .env');
    return;
  }

  const digest = buildDigestHtml();
  if (!digest) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"College AI Assistant" <${GMAIL_USER}>`,
      to: DIGEST_TO,
      subject: digest.subject,
      html: digest.html,
    });
    console.log(`[EmailDigest] Sent: "${digest.subject}"`);
  } catch (err) {
    console.error('[EmailDigest] Failed to send:', err);
  }
}

/** Schedules the digest for 00:00 every day, server-local time. */
export function startEmailDigestScheduler() {
  // Pin the schedule to IST explicitly — without this, "0 0 * * *" fires at
  // midnight in whatever timezone the HOST SERVER happens to be running in,
  // which is very likely NOT India if this is deployed on a typical cloud
  // VM (often UTC). node-cron's `timezone` option handles the conversion.
  cron.schedule(
    '0 0 * * *',
    () => {
      sendDigestEmail();
    },
    { timezone: 'Asia/Kolkata' }
  );
  console.log('[EmailDigest] Scheduled for 00:00 daily (Asia/Kolkata)');
}

// Exported for manual testing (e.g. via a debug endpoint) without waiting for midnight.
export { sendDigestEmail, buildDigestHtml };
