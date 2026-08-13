# Midnight Email Digest — Setup

Every night at **00:00 (midnight)**, the server emails you tomorrow's
timetable — including any exams, quizzes, or important notes the AI has
flagged from your WhatsApp groups so far.

## 1. Get a Gmail App Password (not your normal password)

Gmail blocks plain-password SMTP logins from apps like this one. You need an
**App Password** instead:

1. Turn on 2-Step Verification on your Google account, if it isn't already:
   https://myaccount.google.com/security
2. Go to https://myaccount.google.com/apppasswords
3. Create a new app password (name it something like "College AI Assistant").
4. Copy the 16-character password it gives you — you'll only see it once.

## 2. Fill in `.env`

Open `.env` in the project root and fill these in (already added as empty
placeholders):

```
GMAIL_USER="youraddress@gmail.com"
GMAIL_APP_PASSWORD="the 16-character app password, no spaces"
DIGEST_TO="youraddress@gmail.com"
```

`DIGEST_TO` can be the same address as `GMAIL_USER`, or a different one if
you want the digest sent somewhere else.

## 3. Run it

```bash
npm run dev
```

The scheduler starts automatically with the server — you'll see
`[EmailDigest] Scheduled for 00:00 daily` in the terminal. Like the WhatsApp
connection, **this needs the server running continuously**; if you close the
terminal, the schedule stops until you restart it.

## 4. Test it without waiting until midnight

Two endpoints let you check it works right away:

```bash
# See the exact HTML that would be emailed, right in your browser:
curl http://localhost:3000/api/digest/preview

# Actually send tonight's digest right now:
curl -X POST http://localhost:3000/api/digest/send-now
```

## Where the data comes from

- **Timetable**: synced automatically from whatever's currently in the app
  (including any WhatsApp-detected shifts/cancellations) via
  `POST /api/state/sync`, called from the frontend every time it changes.
- **Holidays / working Saturdays**: read from the real academic calendar
  (`src/data/academicCalendar.ts`, parsed from your official PDF) — if
  tomorrow is a holiday, you'll get a short "no classes" email instead of an
  empty timetable table.
- **Exams / quizzes / notes**: pulled from AI-parsed WhatsApp announcements
  categorized as Exam, Quiz, Lab Evaluation, or Assignment.

## A couple of things worth knowing

- **This can't be tested from a sandboxed dev environment** (like the one
  used to build this code) — there's no network route to Gmail's SMTP
  servers from there. It's built and syntax-checked, but the first real
  send-test needs to happen on your own machine.
- If the digest looks empty, it's almost always because nothing has synced
  to the server yet — open the app in your browser first (that's what
  triggers the sync), then try `/api/digest/preview` again.
