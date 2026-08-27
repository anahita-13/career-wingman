# Job Hunt Chief of Staff

A small, live AI tool that helps run a product manager's job search. It tracks an
application pipeline, tasks, and scheduling — and turns a messy, plain-English update
(or a pasted job description) into a **proposed plan** you approve before anything changes.

It's a single self-contained HTML file. No build step, no accounts, no server required.
Download it, open it, and your data is saved on your own device.

---

## The idea in one line

> It's the **memory** of my job search plus a **copilot** that turns messy updates into a
> proposed next-step plan I approve — so nothing falls through the cracks, and nothing happens
> without my say-so.

## The problem it solves

A job hunt gets scattered across your head, your inbox, and a few note apps — so warm leads go
cold and follow-ups slip. This is one place that both remembers everything and tells you the
next move.

## The design choice that matters (human-in-the-loop)

This is deliberately a **human-in-the-loop agent**, not a fully autonomous one. It has real
agentic behavior — it reads your pipeline, plans a multi-step sequence of actions, and
**executes them against your data** — but every turn ends in **Approve / Tweak / Cancel**. It
never acts on its own.

That's a product decision, not a limitation: in a job search, the cost of a wrong autonomous
action is high, so the human gate belongs *before* anything is written.

## What it does

- **Pipeline board** — track each role and its stage; edit stages inline; add / edit / delete roles.
- **Assistant** — type an update ("coffee chat went well, they'll refer me, follow up in a week")
  or **paste a job description**, and it proposes a concrete plan: add the role, tailored
  next-step tasks, calendar notes, and a follow-up prompt.
- **Tasks** — populated by approved plans, or added/edited by hand. Everything is checkable and editable.
- **Interactive calendar** — a real month grid (page through months, "Today" jump). Tasks with a
  due date and events plot on their day; click a day to see everything scheduled then. Fuzzy dates
  ("this week") land in an "Undated" tray.
- **Everything is saved** on your device (browser local storage) and survives a reload, with
  optional cloud sync across devices.

## How the "memory" works

Two different kinds of memory, on purpose:

- **Persistent data memory.** Your pipeline, tasks, and calendar are saved in the browser's
  built-in `localStorage` on every change and reloaded on open — so the app remembers your job
  search permanently, even after you close the tab or reboot.
- **Conversation memory (last 5 turns).** The assistant keeps a short rolling buffer of recent
  turns and includes it in the prompt, so follow-ups like "actually, make that Friday" or "add one
  more task" resolve against what was just discussed. Only the last few turns are kept, to keep
  token usage low.

## Syncing across devices (laptop ↔ phone)

Data lives on-device by default. To sync (e.g. laptop and phone), deploy the included
**Cloudflare Worker + KV** (`jhcos-sync-worker.js`) — a tiny free key-value store — then on each
device open **Sync** and set the same **Worker URL** and a private **sync code**:

- **Push** sends this device's data up to the cloud; **Pull** replaces this device's data with the
  cloud copy. Optional **auto-push** uploads on every change.
- Your **laptop does not need to be on** — the data lives in Cloudflare, not on your laptop. Your
  phone pulls straight from the cloud. Set it up once per device (the sync code is the only secret
  you share between them).
- The **sync code is a password** — anyone with the URL + code can read/write that record, so use a
  long private code. The Gemini key is *not* synced (kept out of the shared data on purpose); paste
  it separately on each device if you want live AI there too.

Deploy steps are in the header comment of `jhcos-sync-worker.js`.

## Running it live (bring your own free key)

The assistant runs on **Google Gemini**. To use it live:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open the page, click **API key**, paste the key, Save.

The key is stored only in your own browser. It is **never** committed to this repo or sent
anywhere except Google's API. If you host this publicly (e.g. GitHub Pages), **do not hardcode a
key into the file** — each user brings their own.

> **Important:** live Gemini is blocked on `file://` pages (opened by double-click). For live AI,
> run the page from `http(s)` — e.g. **GitHub Pages** or a local server. Opened locally, the app
> still works fully in **safe mode**.

### Safe mode (never breaks)

With no key set — or if the live API errors, 404s, or hits the free rate limit — the app falls
back to a pre-scripted **safe mode** and tells you why (visible banner). Safe mode is
JD-aware: it reads pasted job text and tailors tasks. You can run an entire demo in safe mode at
zero token cost, and toggle it manually from the header.

### Stretching the free tier

- Requests are trimmed and the model output is capped.
- Repeat questions are **cached** (no repeat token cost).
- A **"Live calls today"** counter shows your usage.
- On a `404`, the app auto-tries alternate Gemini models; on `429`, it explains the rate limit.

## Optional: reading a job link directly

A browser page can't fetch an arbitrary job posting (cross-origin + JavaScript-rendered pages),
and the free Gemini API can't browse URLs. To read a link directly, deploy the included
**Cloudflare Worker** (`jd-reader-worker.js`) — a tiny free proxy that fetches the page
server-side and returns readable text:

1. Sign up (free) at <https://dash.cloudflare.com>.
2. **Workers & Pages → Create → Worker**, name it (e.g. `jd-reader`).
3. **Edit code**, paste the contents of `jd-reader-worker.js`, **Deploy**.
4. Copy the Worker URL (e.g. `https://jd-reader.YOURNAME.workers.dev`).
5. In the app: **API key → JD reader URL**, paste it, Save.

Now pasting a job link fetches the posting and Gemini tailors the plan to it. The Worker only
reads page HTML; it never sees your Gemini key (the app calls Gemini directly).

Without the Worker, just paste the job description text instead — same tailored result.

## Hosting on GitHub Pages (shareable link)

1. Create a **public** repo (e.g. `job-hunt-chief-of-staff`).
2. Upload `job-hunt-chief-of-staff.html` (and this README).
3. **Settings → Pages → Deploy from a branch → main → / (root) → Save.**
4. In ~1 minute you get a URL like
   `https://<username>.github.io/job-hunt-chief-of-staff/job-hunt-chief-of-staff.html`.
5. Open it, add your own Gemini key, and live AI works (it's `https`, not `file://`).

## Honest limitations

- **Single-user.** No accounts or multi-user collaboration. Cross-device sync is optional and
  do-it-yourself (via your own Cloudflare Worker), not a hosted service.
- **No real sending.** Follow-ups are saved as tasks; the app never emails or messages anyone.
- **Self-contained calendar, not your life calendar.** It's a real interactive month grid for your
  job hunt, but it does not sync with Outlook/Google Calendar (that needs OAuth + a backend).
- **Short conversation memory.** The assistant remembers the last ~5 turns, not the whole history.
- **BYO-key visibility.** Your key is readable in your own browser's dev tools — fine for personal use.

## Files

- `job-hunt-chief-of-staff.html` — the app (open this).
- `jd-reader-worker.js` — optional Cloudflare Worker for reading job links from a URL.
- `jhcos-sync-worker.js` — optional Cloudflare Worker (+ KV) for cross-device sync.
- `README.md` — this file.
