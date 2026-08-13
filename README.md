# College AI Assistant

An AI assistant that quietly reads your college WhatsApp groups — without ever replying — and turns the noise into a live, always-current timetable. It catches exam announcements, cancelled classes, room changes, and casual Gen-Z shorthand ("cls cancld tmr, prep for mids"), and every night at midnight it emails you tomorrow's schedule.

This README walks through everything from zero: getting the API keys, running it locally, customizing it for your own college, and — further down — what it'd take to run it in the cloud so it works even when your laptop is off.

> **Before you start:** this app comes with placeholder data (`Teacher 1`, `Course 1`, `Room 1`, etc.) instead of real names — you'll swap these for your own college's details in Step 6. It also uses an **unofficial** WhatsApp library (not WhatsApp's official Business API) to read your groups. That's common for personal projects like this, but it sits outside WhatsApp's Terms of Service, so there's a small real risk of your account being flagged. Consider using a secondary number if you'd rather not risk your primary one.

<img width="1024" height="653" alt="image" src="https://github.com/user-attachments/assets/cca60b7e-0fc4-4b35-9795-333a4099f842" />
<img width="1024" height="605" alt="image" src="https://github.com/user-attachments/assets/7e574a75-8539-487b-ae20-aef8f764cae4" />
<img width="1024" height="547" alt="image" src="https://github.com/user-attachments/assets/b82595a3-3d9f-456b-b3d2-d59930596f33" />

---

## What you'll need before starting

- **Node.js 18 or newer** (built and tested on Node 22) — [download here](https://nodejs.org) if you don't have it. Check with `node -v` in a terminal.
- **A Google account**, for the free Gemini API key (the AI that reads your messages).
- **A WhatsApp account**, for linking your groups.
- *(Optional)* **A Gmail account**, only if you want the midnight email digest feature.

---

## Step 1 — Get the project onto your machine

If you're reading this after downloading a zip, skip to unzipping it. If you're cloning from GitHub:

```bash
git clone <your-repo-url>
cd college-ai-assistant
```

## Step 2 — Install dependencies

```bash
npm install
```

This installs everything the app needs — React, Express, the WhatsApp library, the AI SDK, etc. Takes about 30–60 seconds.

## Step 3 — Get your Gemini API key (this is what powers the AI parsing)

1. Go to **[Google AI Studio](https://aistudio.google.com/apikey)**.
2. Sign in with any Google account.
3. Click **"Create API key"**.
4. Choose "Create API key in new project" if you don't already have a Google Cloud project — this is free, no credit card required for the free tier.
5. Copy the key it gives you (it'll look like `AIzaSy...`).

**Keep this key private.** Anyone with it can make API calls billed to your account (though the free tier has generous limits for personal projects). Never commit it to GitHub — that's exactly why `.env` is in `.gitignore`.

## Step 4 — Set up your `.env` file

In the project folder, copy the example file:

```bash
cp .env.example .env
```

Open `.env` and paste your key in:

```
GEMINI_API_KEY="your-key-here"
APP_URL="http://localhost:3000"
```

Leave `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `DIGEST_TO` blank for now — those are only needed for the email digest feature (Step 8).

## Step 5 — Run it

```bash
npm run dev
```

You should see:

```
🚀 College AI Assistant Server running on http://0.0.0.0:3000
```

Open **http://localhost:3000** in your browser — not `http://0.0.0.0:3000`, that address won't load (it means "listen on every network interface," not an actual page to visit).

---

## Step 6 — Customize it for your own college

Out of the box, everything uses generic placeholders. To make it actually useful, edit these three files:

| File | What it controls |
|---|---|
| `src/data/subjects.ts` | Your subjects, course codes, and faculty (shown on the "Lecture Names" page) |
| `src/data/defaultData.ts` | Your actual weekly timetable — which subject is in which slot, on which day |
| `server.ts` (search for `SUBJECT_REFERENCE`) | The same subject list, given to the AI so it recognizes your subjects by name in WhatsApp messages — **keep this in sync with the two files above** |

Just find-and-replace `Teacher 1`, `Course 1`, `Room 1`, etc. with your real details in all three places.

### Your academic calendar

`src/data/academicCalendar.ts` ships with a real academic year's worth of holidays and working-Saturday data (parsed from one college's official calendar PDF), so it can correctly tell you "today is a holiday" or "this Saturday follows Monday's timetable." **This is specific to one institution — replace it with your own college's calendar** if the dates don't match yours. The file documents its own data shape (`AcademicDay` interface) if you want to regenerate it from your own college's PDF.

---

## Step 7 — Link your real WhatsApp account

1. Click **"Link WhatsApp"** in the top nav.
2. A real, scannable QR code appears.
3. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device**, then scan it.
4. Once linked, select which groups you want monitored.

Full details — including the last-10-messages backfill behavior and the ToS/risk note again — are in **[WHATSAPP_SETUP.md](WHATSAPP_SETUP.md)**.

**Important:** this needs the server (`npm run dev`) running continuously to stay connected. Closing the terminal disconnects it (though your login session is saved, so reconnecting won't need a new QR scan).

---

## Step 8 — Set up the midnight email digest *(optional)*

Every night at 00:00 IST, the app can email you tomorrow's schedule. This needs a **Gmail App Password** — not your normal Gmail password, since Google blocks plain-password logins from apps like this.

1. Turn on 2-Step Verification on your Google account, if you haven't: **[myaccount.google.com/security](https://myaccount.google.com/security)**.
2. Go to **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**.
3. Create a new app password (name it "College AI Assistant").
4. Copy the 16-character password — you'll only see it once.
5. Add it to `.env`:

```
GMAIL_USER="youraddress@gmail.com"
GMAIL_APP_PASSWORD="the 16-character password, no spaces"
DIGEST_TO="youraddress@gmail.com"
```

Full details, plus how to test it immediately instead of waiting until midnight, are in **[EMAIL_SETUP.md](EMAIL_SETUP.md)**.

---

## How your data is stored

Everything — your linked groups, timetable changes, announcement history — is saved to a plain JSON file at `data/app-state.json`, created automatically the first time you run the app. This means:

- **Refreshing the page** doesn't lose anything.
- **Restarting the server** (closing and reopening the terminal) doesn't lose anything either.
- Your WhatsApp login session is saved separately, in `whatsapp-auth/`.

Both `data/` and `whatsapp-auth/` are already in `.gitignore` — **never commit them**. They contain your personal data and your WhatsApp session credentials respectively; anyone with a copy of `whatsapp-auth/` could access your linked WhatsApp session.

---

## What still requires your laptop to be on

Right now, everything — the WhatsApp connection, the message parsing, the midnight email — only runs while `npm run dev` is actively running on your machine. If your laptop is off, asleep, or the terminal is closed, none of it works, though nothing is lost; it picks back up next time you start it.

---

## Future: making this run even when your laptop is off

To have this genuinely always-on — running overnight, independent of your laptop — it needs to live on a small server somewhere else. This is a real next step, not yet done in this codebase. Rough shape of what it'd involve:

### Option A: A cheap always-on VPS (recommended)
A small virtual server (e.g., a $5–6/month DigitalOcean droplet, a free-tier Oracle Cloud instance, or similar) that you keep running 24/7. You'd:
1. Install Node.js on it.
2. Copy the project over (`git clone` your repo).
3. Run `npm install && npm run build`, then start it with a process manager like **PM2** (`pm2 start server.ts --interpreter tsx`) so it survives SSH disconnects and auto-restarts on crash.
4. Re-link WhatsApp on that server (it needs its own QR scan — a WhatsApp session is tied to the device it was linked from).
5. Point a domain at it, or just use its IP address.

This is the most "actually always-on" option, and gives you a stable place to keep `data/` and `whatsapp-auth/` long-term.

### Option B: A platform-as-a-service (Railway, Render, Fly.io)
Similar idea, but the platform handles the server setup for you. Look for a **"persistent worker" or "web service"** plan (not "serverless functions" — those sleep after inactivity and won't hold a live WhatsApp connection) with a **persistent volume** attached (so `data/` and `whatsapp-auth/` survive redeploys).

### Turning it into an installable app (PWA)
Separately from hosting, the app can be made "installable" — an icon on your phone/desktop home screen that opens like a native app — by adding a web app manifest and service worker. This is a smaller change than full cloud deployment and can be done on top of either local or cloud hosting.

### A note on cost and complexity
None of this is required to use the app day-to-day on your laptop. It only matters if you specifically want it running independent of your machine being on.

---

## Project structure

```
college-ai-assistant/
├── src/
│   ├── App.tsx                  # Main app shell, state, and the message-processing pipeline
│   ├── components/              # Dashboard, Timetable, Lecture Names, Gen Z Words, About, modals
│   ├── data/
│   │   ├── defaultData.ts       # Your timetable + course catalog (customize this)
│   │   ├── subjects.ts          # Subject/faculty reference (customize this)
│   │   └── academicCalendar.ts  # Holiday/working-day data (replace with your college's)
│   ├── types.ts                 # Shared TypeScript types
│   └── utils/istTime.ts         # India Standard Time helpers (used throughout for date logic)
├── server.ts                    # Express server + Gemini AI parsing endpoint
├── server/
│   ├── whatsapp.ts               # Real WhatsApp connection (Baileys)
│   ├── emailDigest.ts            # Midnight email digest (nodemailer + node-cron)
│   ├── db.ts                     # Persistence (JSON file, see "How your data is stored")
│   └── state.ts                  # Server-side mirror of live app state
├── WHATSAPP_SETUP.md              # WhatsApp linking details
├── EMAIL_SETUP.md                 # Email digest setup details
└── .env.example                   # Copy to .env and fill in your keys
```

## License

Apache-2.0 — see individual file headers.
