# Job Hunt Chief of Staff

A small, live AI prototype: an **"AI Chief of Staff"** that helps run a product manager's job
search. It tracks an application pipeline, tasks, and scheduling — and turns a messy,
plain-English update into a **proposed plan** that the human approves before anything changes.

It's a single self-contained HTML file. No build step, no server, no login. Just open it.

---

## The idea in one line

> It's the **memory** of my job search plus a **copilot** that turns messy updates into a
> proposed next-step plan I approve — so nothing falls through the cracks, and nothing happens
> without my say-so.

A diary remembers what happened. This notices what it *means* and proposes what to do next —
and I decide.

## The design choice that matters (human-in-the-loop)

This is deliberately **not** a fully autonomous agent. It has agentic behavior — it reasons over
context and plans a multi-step sequence of actions — but every turn ends in
**Approve / Tweak / Cancel**. It never acts on its own.

That's a product decision, not a limitation: in a job search, the cost of a wrong autonomous
action is high, so the right place for the human gate is *before* anything is written.

## The hero interaction

Type something messy, like:

> "Had a great coffee chat with the Company Y contact — he's really into AI, agreed to refer me,
> wants a follow-up in a week."

The assistant proposes a concrete plan:

- Advance **Company Y** from *Networking* → *Referral*
- Add prep + follow-up tasks (with sensible due dates)
- Surface the relevant calendar event (the Sept 8 coffee chat)
- **Ask me what I want to say** in the follow-up (it drafts nothing on my behalf, and sends nothing)

Nothing changes until I click **Approve**. I can **Tweak** any line or **Cancel** entirely.

## Running it live (bring your own free key)

The assistant runs on **Google Gemini**. To use it live:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open the page, click **API key**, paste the key, and Save.

The key is stored only in your own browser (local storage). It is **never** committed to this repo
or sent anywhere except Google's API.

### Safe mode (never breaks on stage)

If no key is set — or if the live API errors out or times out — the app falls back **silently** to
a pre-scripted "safe mode" so a live demo can't break. You can also toggle it manually from the
header before presenting.

## Notes

- All companies are anonymized as **Company X / Y / Z**; the pipeline data is illustrative.
- Built as a single HTML file so it works offline and is trivial to host (e.g. GitHub Pages).
- Use the **Reset demo** button for a clean run before presenting.
