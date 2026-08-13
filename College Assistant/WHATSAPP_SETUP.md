# Real WhatsApp Connection — Setup

This app can link your **actual WhatsApp account** and read messages from
group chats you choose, using [Baileys](https://github.com/WhiskeySockets/Baileys)
(an unofficial WhatsApp Web protocol library) instead of a fake demo QR.

## Before you start

- **This is unofficial.** Baileys talks to WhatsApp the same way WhatsApp Web
  does, but it isn't WhatsApp's sanctioned Business API. Automating reads of
  group chats is common for personal projects, but it sits outside WhatsApp's
  Terms of Service, and there's a real (generally low, but non-zero) chance of
  your account getting flagged or temporarily restricted. Consider using a
  secondary number if you want to be cautious.
- **It needs to run continuously.** The connection is a live WebSocket session
  held open by a Node process. It cannot run in a serverless function, and it
  cannot run inside a sandboxed AI dev-preview (like the one used to build this
  code) — those environments don't have network access to WhatsApp's servers
  and don't stay running. You need to run it on your own computer or a small
  always-on server (e.g. a Raspberry Pi, a $5 VPS, or your laptop while you use
  the app).
- **Session files live on disk** in a folder called `whatsapp-auth/` (already
  in `.gitignore`). Treat that folder like a password — anyone with a copy of
  it can access your linked WhatsApp session until you unlink it.

## How to run it

```bash
npm install        # installs @whiskeysockets/baileys, qrcode, pino, etc.
npm run dev         # starts the Express + Vite dev server on :3000
```

1. Open the app in your browser and click **"Link WhatsApp"** in the top bar.
2. A real QR code will appear (generated server-side by Baileys). On your
   phone: **WhatsApp → Settings → Linked Devices → Link a Device**, then scan it.
3. Once linked, the modal shows your real group list — toggle on the ones you
   want the AI to monitor.
4. New messages in those groups now flow automatically into the same Gemini
   parser your WhatsApp Simulator uses (`parseCollegeMessage` in `server.ts`),
   over a live event stream at `/api/whatsapp/events`.
5. To unlink, click **"Unlink"** in the modal — this logs the session out and
   deletes the local `whatsapp-auth/` folder.

## Wiring live messages into the dashboard UI

The backend already parses and emits real messages as Server-Sent Events.
To have them show up in the "Live WhatsApp Group Stream" card on the
dashboard home (currently fed only by the manual simulator), subscribe to the
stream in `App.tsx`:

```ts
useEffect(() => {
  const es = new EventSource('/api/whatsapp/events');
  es.onmessage = (e) => {
    const payload = JSON.parse(e.data);
    // payload: { groupId, groupName, sender, rawMessage, parsed, timestamp }
    // Feed it through the same logic handleProcessNewMessage uses to update
    // announcements / timetable / calendar / reminders state.
  };
  return () => es.close();
}, []);
```

This last wiring step is left for you since it touches your live state model —
happy to do it in a follow-up if you'd like it fully connected end-to-end.
