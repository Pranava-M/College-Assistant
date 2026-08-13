import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { whatsappManager } from './server/whatsapp';
import { updateState, getState } from './server/state';
import { startEmailDigestScheduler, sendDigestEmail, buildDigestHtml } from './server/emailDigest';
import { getISTNow, tomorrowISTISO } from './src/utils/istTime';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Slot reference mapping for prompt grounding
const SLOT_REFERENCE = `
Slot 1: 08:00 AM - 08:50 AM
Slot 2: 08:50 AM - 09:40 AM
Slot 3: 09:40 AM - 10:30 AM
Slot 4: 10:45 AM - 11:35 AM
Slot 5: 11:35 AM - 12:25 PM
Slot 6: 12:25 PM - 01:15 PM
Slot 7: 01:15 PM - 02:05 PM (Lunch Break)
Slot 8: 02:05 PM - 02:55 PM
Slot 9: 02:55 PM - 03:45 PM
Slot 10: 03:45 PM - 04:35 PM
Slot 12: 05:25 PM - 06:15 PM
`;

// College Subject Reference
const SUBJECT_REFERENCE = `
ML / Course 1 -> COURSE101 (Faculty: Teacher 1)
CN / Course 2 -> COURSE102 (Faculty: Teacher 2)
TOC / Course 3 -> COURSE103 (Faculty: Teacher 3)
ES / Course 4 -> COURSE104 (Faculty: Teacher 4)
PE1 / Blockchain -> COURSE105 Course 5 (Faculty: Teacher 5, Venue: Room 3 / Room 2)
PE2 / Course 6 -> COURSE106 Course 6 (Faculty: Teacher 6, Venue: Room 4)
CIR -> Career Readiness Skills
ENV -> COURSE107 Course 7
MENTORING -> Mentoring Session
`;

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'College AI Assistant Backend', timestamp: new Date().toISOString() });
});

// Shared Gemini-backed parser used by both the manual simulator and real
// incoming WhatsApp group messages.
async function parseCollegeMessage(rawMessage: string, groupName: string, sender: string) {
  try {
    const now = getISTNow();
    const systemPrompt = `You are a high-accuracy College AI Assistant NLP parser for student WhatsApp messages.
Your task is to analyze informal, Gen Z student slang and college announcements, normalize the message, extract structured events, detect timetable changes, and learn custom college acronyms.

Current date/time (India Standard Time — always use this, never your own assumption): ${now.weekday}, ${now.iso}, ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')} IST.
When the message says "today", "tomorrow", "tmr", or names a weekday, resolve dateStr and parsedDateISO relative to THIS date, not any other date you might otherwise assume.

Reference Slot System:
${SLOT_REFERENCE}

Reference College Subjects:
${SUBJECT_REFERENCE}

Gen Z Slang Dictionary:
- tmr / tmrw / nxt day -> Tomorrow
- tdy / 2day -> Today
- cls / clss -> Class
- eval / evln -> Evaluation
- mid / mids -> Mid Semester
- end sem / endsem -> End Semester
- sir / maam absent -> Faculty unavailable / Class cancelled
- room chngd / venue chngd -> Venue changed
- slot X -> Slot number X

Instructions:
Return STRICT valid JSON only without markdown formatting. The JSON must match this structure:
{
  "rawMessage": string,
  "normalizedText": string,
  "type": "Quiz" | "Exam" | "Lab Evaluation" | "Class Shift" | "Cancelled" | "Room Changed" | "Faculty Changed" | "Extra Class" | "Assignment" | "Project Review" | "Seminar" | "Holiday" | "General",
  "subject": string | null (e.g. "Course 1", "Course 2", "Course 3" — null if the message doesn't name one specific subject),
  "subjectCode": string | null (e.g. "COURSE101"),
  "dateStr": string (e.g. "Tomorrow", "Today", "18 August 2026" — resolved using the current date given above),
  "parsedDateISO": string (YYYY-MM-DD, resolved using the current date given above — NEVER guess a different year/date than what's implied relative to it),
  "slot": number | null,
  "oldSlot": number | null,
  "newSlot": number | null,
  "venue": string | null,
  "faculty": string | null,
  "wholeDayCancelled": boolean (true ONLY when the message cancels ALL classes for the day / a whole batch, e.g. "no classes tomorrow", "third years may not have class" — false when it's about one specific subject/slot),
  "confidenceScore": number (between 0.85 and 1.0),
  "learnedAcronyms": [
    { "term": string, "meaning": string, "category": "Subject" | "Venue" | "Faculty" | "Slang" }
  ],
  "calendarEventNeeded": boolean,
  "reminderNeeded": boolean,
  "explanation": string
}`;

    const userPrompt = `Analyze this WhatsApp message: "${rawMessage}"
Group: ${groupName || 'College Group'}
Sender: ${sender || 'Student Rep'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    let resultText = response.text || '{}';
    // Clean potential markdown wrap
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return { success: true, data: JSON.parse(resultText) };
  } catch (error: any) {
    console.error('Error parsing Gemini response:', error);
    // Fallback heuristic parser if Gemini API key or call fails
    const rawMsg = rawMessage || '';
    const isQuiz = /quiz/i.test(rawMsg);
    const isCancelled = /cancel|no cls|no class|not have class|absent/i.test(rawMsg);
    const isShift = /shift|moved|slot/i.test(rawMsg);
    const now = getISTNow();

    const subjectMatch = /\bML\b/i.test(rawMsg)
      ? { subject: 'Course 1', subjectCode: 'COURSE101' }
      : /\bCN\b/i.test(rawMsg)
      ? { subject: 'Course 2', subjectCode: 'COURSE102' }
      : /blockchain/i.test(rawMsg)
      ? { subject: 'Course 5', subjectCode: 'COURSE105' }
      : /design pattern/i.test(rawMsg)
      ? { subject: 'Course 6', subjectCode: 'COURSE106' }
      : null;

    const isTomorrow = /tmr|tmrw|tomorrow/i.test(rawMsg);
    const dateStr = isTomorrow ? 'Tomorrow' : 'Today';
    const parsedDateISO = isTomorrow ? tomorrowISTISO() : now.iso;

    return {
      success: true,
      fallback: true,
      data: {
        rawMessage: rawMsg,
        normalizedText: rawMsg.replace(/tmr/i, 'tomorrow').replace(/cls/i, 'class').replace(/tdy/i, 'today'),
        type: isQuiz ? 'Quiz' : isCancelled ? 'Cancelled' : isShift ? 'Class Shift' : 'General',
        subject: subjectMatch?.subject ?? null,
        subjectCode: subjectMatch?.subjectCode ?? null,
        dateStr,
        parsedDateISO,
        // No subject detected but the message reads as a cancellation →
        // treat it as cancelling the whole day rather than guessing a slot.
        wholeDayCancelled: isCancelled && !subjectMatch,
        slot: subjectMatch ? 5 : null,
        confidenceScore: 0.6,
        learnedAcronyms: [],
        calendarEventNeeded: true,
        reminderNeeded: true,
        explanation: 'Parsed via rule-based fallback system (Gemini unavailable).',
      },
    };
  }
}

// AI Parser Endpoint using Gemini (used by the manual WhatsApp simulator)
app.post('/api/parse-message', async (req, res) => {
  const { rawMessage, groupName, sender } = req.body;
  if (!rawMessage) {
    return res.status(400).json({ error: 'Message text is required' });
  }
  const result = await parseCollegeMessage(rawMessage, groupName, sender);
  return res.json(result);
});

// ---------------------------------------------------------------------------
// Real WhatsApp connection (Baileys) — see server/whatsapp.ts for details.
// ---------------------------------------------------------------------------

// Live announcements produced by REAL incoming WhatsApp group messages,
// pushed to connected clients over Server-Sent Events.
const sseClients = new Set<express.Response>();

whatsappManager.onMessage(async ({ groupId, groupName, sender, text, timestampMs }) => {
  console.log(`[WhatsApp] Message received from "${groupName}" (${sender}): "${text}"`);
  const result = await parseCollegeMessage(text, groupName, sender);
  console.log(`[WhatsApp] Parsed as: ${result.data?.type}${result.data?.subject ? ` — ${result.data.subject}` : ''}`);
  const payload = {
    id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date(timestampMs || Date.now()).toISOString(),
    groupId,
    groupName,
    sender,
    rawMessage: text,
    parsed: result.data,
  };
  console.log(`[WhatsApp] Broadcasting to ${sseClients.size} connected client(s)`);
  for (const client of sseClients) {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
});

// Start (or resume) the real WhatsApp connection; returns current status/QR.
app.post('/api/whatsapp/connect', async (_req, res) => {
  try {
    await whatsappManager.start();
    return res.json({ success: true, ...whatsappManager.getState() });
  } catch (error: any) {
    console.error('[WhatsApp] connect error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to start WhatsApp connection' });
  }
});

// Poll connection status + QR code (data URL) while linking.
app.get('/api/whatsapp/status', (_req, res) => {
  res.json(whatsappManager.getState());
});

// Set which real WhatsApp groups should be monitored (by group JID).
app.post('/api/whatsapp/active-groups', (req, res) => {
  const { groupIds } = req.body as { groupIds: string[] };
  whatsappManager.setActiveGroups(Array.isArray(groupIds) ? groupIds : []);
  res.json({ success: true });
});

// Unlink the device and clear the stored session.
app.post('/api/whatsapp/logout', async (_req, res) => {
  await whatsappManager.logout();
  res.json({ success: true });
});

// Real-time stream of parsed announcements from live WhatsApp groups.
app.get('/api/whatsapp/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ---------------------------------------------------------------------------
// Midnight email digest — keeps a server-side mirror of the live timetable /
// announcements state (synced from the frontend), then emails tomorrow's
// schedule automatically at 00:00. See server/emailDigest.ts.
// ---------------------------------------------------------------------------

// Frontend calls this whenever timetable/announcements/groups/history change.
// Persisted to SQLite, not just kept in memory, so it survives a server
// restart as well as a browser reload.
app.post('/api/state/sync', (req, res) => {
  const { masterTimetable, announcements, monitoredGroups, changeHistory } = req.body || {};
  updateState({ masterTimetable, announcements, monitoredGroups, changeHistory });
  res.json({ success: true, updatedAt: getState().updatedAt });
});

// Frontend calls this once on load to restore where you left off — your
// linked groups, timetable changes, and announcement feed — instead of
// starting over from the default seed data on every visit.
app.get('/api/state/load', (_req, res) => {
  res.json(getState());
});

// Manually trigger tonight's digest right now, for testing without waiting
// until midnight. Does not affect the schedule itself.
app.post('/api/digest/send-now', async (_req, res) => {
  await sendDigestEmail();
  res.json({ success: true });
});

// Preview the digest HTML in-browser without sending an email.
app.get('/api/digest/preview', (_req, res) => {
  const digest = buildDigestHtml();
  if (!digest) return res.status(404).send('Nothing to preview yet.');
  res.send(digest.html);
});

// Incoming Webhook (Simulating WhatsApp / Playwright / Make.com)
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { groupName, sender, messageText, secretKey } = req.body;

  console.log(`[WhatsApp Webhook] Received from ${groupName} by ${sender}: "${messageText}"`);

  // Simple response returning parsed intent
  return res.json({
    status: 'received',
    timestamp: new Date().toISOString(),
    group: groupName || 'B.Tech CSE Sec-H',
    sender: sender || '+91 90000 00000',
    message: messageText,
    processed: true,
    actionTaken: 'Timetable & Google Calendar synced automatically without sending messages',
  });
});

// Make.com Integration Webhook
app.post('/api/make/trigger', (req, res) => {
  const payload = req.body;
  console.log('[Make.com Webhook Payload]', payload);

  return res.json({
    success: true,
    message: 'Make.com scenario payload processed successfully',
    receivedData: payload,
    recommendedNextStep: 'Route to Google Calendar & Send Email Reminder',
  });
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 College AI Assistant Server running on http://0.0.0.0:${PORT}`);
  });

  startEmailDigestScheduler();

  // Resume any existing WhatsApp session automatically on boot — if you've
  // linked before, this reconnects using the saved session in
  // whatsapp-auth/ without requiring you to open the link modal or scan a
  // QR code again. If no session exists yet, this just sits idle until you
  // open the modal for the first time.
  whatsappManager.start().catch((err) => {
    console.error('[WhatsApp] Failed to auto-start on boot:', err);
  });
}

startServer();
