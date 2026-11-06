# Aurivane — AI-Powered Business Website Demo

**Project 06 of the Virellion Apex portfolio.** This demo site shows how [Virellion Apex](https://virellionapex.com) builds AI receptionists, chat assistants, online scheduling, lead capture, customer support and workflow automation for business websites.

> **Demonstration disclaimer.** Aurivane is a fictional company. This AI-powered website is a demonstration project developed by Virellion Apex. AI conversations, automated responses, scheduling, and lead capture are simulated unless connected to a live backend. No AI model, CRM, calendar or helpdesk is connected in this repository, and nothing a visitor types leaves the browser.

- **Stack:** HTML5, CSS3, vanilla JavaScript. There is no build step and nothing is installed through npm.
- **Hosting target:** GitHub → Cloudflare Pages (free plan is sufficient).
- **Secrets in this repo:** none. Keep it that way.

---

## Contents

1. [Features](#1-features)
2. [File structure & documentation](#2-file-structure--documentation)
3. [Run locally](#3-run-locally)
4. [Deploy: GitHub + Cloudflare Pages](#4-deploy-github--cloudflare-pages)
5. [Replacing demonstration data](#5-replacing-demonstration-data)
6. [Connecting a real AI backend (securely)](#6-connecting-a-real-ai-backend-securely)
7. [Connecting Calendly](#7-connecting-calendly)
8. [CRM, lead and support-system integration](#8-crm-lead-and-support-system-integration)
9. [Server-side environment variables](#9-server-side-environment-variables)
10. [Production security checklist](#10-production-security-checklist)
11. [Testing performed](#11-testing-performed)
12. [Image credits & licensing](#12-image-credits--licensing)

---

## 1. Features

| Page | What it demonstrates |
|---|---|
| `index.html` | AI hero with a simulated operations console, business introduction, service highlights (bento grid), automation steps, tabbed feature demos, customer benefits, consultation calls to action |
| `about.html` | Fictional company story, AI principles, engagement model, "Developed by Virellion Apex" section |
| `services.html` | Seven services: AI receptionist, customer support automation, workflow automation, lead generation automation, business process automation, appointment automation, AI integration consulting |
| `ai-receptionist.html` | Receptionist console with a welcome message that knows whether the business is open, business hours table, FAQs, service enquiries, a step-by-step **appointment request flow**, **validated contact collection**, a human-handoff demo and a live "captured details" panel |
| `chatbot.html` | Chat interface, message input, simulated replies (keyword intent matching), **session conversation history** (sessionStorage), suggested questions, FAQ answers, an assistant identity card, transcript download, clear-chat, and a graceful fallback that does not guess. Clearly labelled *Simulated response* |
| `appointments.html` | Appointment types, month calendar (past/closed days disabled), time-slot selection, customer details with validation, review step, demo confirmation with a reference number and **downloadable .ics calendar file**. **Calendly-ready**: one config value swaps in a live Calendly embed |
| `contact.html` → *Start a project* | Lead capture: contact info, business type, service interests, project requirements, qualification questions (timeline, budget, team size, decision-maker, current tools), full validation, **lead scoring & tiering**, and a preview of the JSON payload a CRM would receive |
| `contact.html` → *Get support* | Help Center: categories, searchable knowledge base with highlighting, **suggested answers while typing**, "was this helpful", contact options and an **escalation-to-a-human** ticket simulation |
| `automation.html` | How AI connects to websites, a secure reference architecture, an interactive **workflow simulator** (trigger → actions → run log), and integration tiles covering CRM, scheduling, communication and support platforms |
| `404.html` | Branded not-found page (Cloudflare Pages serves it automatically) |

Every simulated feature is labelled on screen, and every page footer carries the required disclaimer.

---

## 2. File structure & documentation

```
ai-business-demo/
├── index.html              Homepage
├── about.html              About the (fictional) company
├── services.html           AI solutions & services
├── ai-receptionist.html    Receptionist demo
├── chatbot.html            Chatbot demo
├── appointments.html       Scheduling demo (Calendly-ready)
├── automation.html         Technology, integrations, architecture, workflow simulator
├── contact.html            Lead capture + customer support center
├── 404.html                Not-found page
├── css/
│   └── style.css           Complete design system (tokens, components, responsive rules)
├── js/
│   └── script.js           All interactivity + SITE_CONFIG + BUSINESS data + knowledge base
├── images/
│   ├── logo.png            Original Aurivane logo mark (512×512, transparent)
│   └── hero.jpg            Original generated hero artwork (1920×1080); also used for social sharing
├── assets/
│   ├── favicon.png         64×64 favicon
│   ├── apple-touch-icon.png
│   └── README.txt
├── _headers                Cloudflare Pages security headers (CSP, HSTS, etc.) + caching
├── robots.txt
├── sitemap.xml
├── .gitignore              Blocks .env / .dev.vars / secrets from being committed
└── README.md
```

### `js/script.js` map

| Section | Purpose |
|---|---|
| `SITE_CONFIG` | **The only place to switch from demo to live.** Endpoints (empty = simulated), Calendly URL, time-zone label |
| `BUSINESS` | Fictional name, assistant name, placeholder email/phone, business hours, services |
| `KB` | Shared knowledge base (questions, answers, keywords, categories) used by the chatbot, receptionist and help center |
| `initGlobal` | Mobile nav, sticky header, scroll reveal, accessible tabs, hours widgets |
| `initHome` | Simulated activity feed on the homepage |
| `createChat` / `liveChat` | Shared chat renderer (user text is always inserted as text, never HTML) and the optional live-endpoint call |
| `initChatbot` | Chatbot intents, KB matching, session history, transcript download |
| `initReceptionist` | Receptionist state machine (appointment & contact flows with validation) |
| `initAppointments` | Calendar, slots, form, review, confirmation, .ics export, Calendly switch |
| `validateField` | Shared form validation with ARIA error messaging |
| `initLeadForm` / `scoreLead` | Lead capture, qualification scoring and payload preview |
| `initSupport` | Help center search, suggestions, categories, escalation simulation |
| `initAutomation` | Integration tiles and workflow simulator |

---

## 3. Run locally

Any static server works. Opening the files directly (`file://`) also mostly works, but a local server matches production behaviour:

```bash
cd ai-business-demo
python3 -m http.server 8080
# open http://localhost:8080
```

---

## 4. Deploy: GitHub + Cloudflare Pages

### 4.1 Push to GitHub

1. On GitHub, create a new **empty** repository, e.g. `lilmoniisenterprise/ai-business-demo` (no README, no .gitignore — this project has them).
2. From inside the `ai-business-demo` folder:

```bash
git init
git add .
git commit -m "Aurivane AI business demo — initial release"
git branch -M main
git remote add origin https://github.com/lilmoniisenterprise/ai-business-demo.git
git push -u origin main
```

(Or use GitHub's web uploader: open the empty repo → **uploading an existing file** → drag in the *contents* of the folder, keeping the `css`, `js`, `images` and `assets` folders.)

### 4.2 Create the Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `ai-business-demo` repository.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. **Save and Deploy**. You'll get a URL like `https://ai-business-demo.pages.dev`.
5. Every push to `main` redeploys automatically.

### 4.3 Custom subdomain (optional)

1. Pages project → **Custom domains** → **Set up a custom domain** → `ai.virellionapex.com`.
2. If `virellionapex.com` uses Cloudflare DNS, the CNAME is added for you. Otherwise add a `CNAME` record `ai → ai-business-demo.pages.dev` at your DNS provider.
3. Wait for the certificate to show **Active**, then open the URL and test it.

### 4.4 After the domain works

The canonical, Open Graph, sitemap and robots URLs use the **placeholder** `https://ai.virellionapex.com`. If you use a different URL:

- Find and replace `https://ai.virellionapex.com` across all `.html` files, `sitemap.xml` and `robots.txt`.
- Check the social preview with a sharing debugger (for example LinkedIn Post Inspector).

---

## 5. Replacing demonstration data

To reuse this site for a real client:

| What | Where |
|---|---|
| Business name, assistant name, email, phone, hours, services | `BUSINESS` in `js/script.js` |
| Chatbot / receptionist / help-center answers | `KB` array in `js/script.js` (each item: `cat`, `q`, `a`, `k` keywords) |
| Appointment types & durations | `TYPES` in `initAppointments` **and** the matching radio cards in `appointments.html` |
| Lead form options & scoring | `contact.html` form fields and `scoreLead()` in `js/script.js` |
| Workflow simulator triggers/actions | `TRIGGERS` / `ACTIONS` in `initAutomation` |
| Colours & fonts | `:root` tokens at the top of `css/style.css`; font link in each page `<head>` |
| Logo & hero | Replace `images/logo.png` and `images/hero.jpg` (keep the names, or update the references) |
| Page copy & SEO tags | Each `.html` file's content and `<head>` |
| Demo labels | Remove the demo ribbon, notices and badges **only after** real, tested integrations replace the simulation |

The placeholder contact details (`demo@aurivane.example`, `(555) 010-0142`) are deliberately non-functional. The `.example` domain and 555-01xx numbers are reserved for fiction.

---

## 6. Connecting a real AI backend (securely)

### The rule

**The browser must never hold an AI provider key.** Anything in `js/script.js` can be read by anyone. The website calls *your own* server endpoint, and only that endpoint holds the key.

```
Browser ──POST /api/chat──▶ Cloudflare Pages Function ──(secret key)──▶ AI provider
        ◀──── { reply } ────                           ◀──────────────
```

### Step 1 — add a Pages Function

Create `functions/api/chat.js` in the repository root. Cloudflare Pages turns it into the `/api/chat` endpoint automatically. The example below uses Anthropic's Messages API. Any provider follows the same pattern; check the provider's current API docs for exact model names and request fields before going live.

```js
// functions/api/chat.js — runs on Cloudflare's servers, never in the browser.
const SYSTEM_PROMPT = `You are Aria, the website assistant for <BUSINESS NAME>.
Answer only from the business information below. If unsure, say so and offer to connect the visitor with the team.
Never request payment, ID, health or password information. Keep answers under 120 words.
<BUSINESS INFORMATION: services, hours, policies, FAQs>`;

export async function onRequestPost({ request, env }) {
  // 1) Only accept same-site JSON requests
  const origin = request.headers.get("Origin") || "";
  if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403 });

  let body;
  try { body = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }

  // 2) Validate and trim input
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const clean = messages
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!clean.length || clean[clean.length - 1].role !== "user") return new Response("Bad request", { status: 400 });

  // 3) Call the provider with the SECRET key from environment variables
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.AI_API_KEY,          // set in Cloudflare → Settings → Variables and Secrets
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({ model: env.AI_MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages: clean })
  });
  if (!res.ok) return Response.json({ reply: "Sorry — I'm having trouble right now. Please try again or contact the team." }, { status: 200 });

  const data = await res.json();
  const reply = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  return Response.json({ reply });
}
```

### Step 2 — add secrets in Cloudflare

Pages project → **Settings** → **Variables and Secrets** → add for **Production** (and Preview if needed):

| Name | Type | Example |
|---|---|---|
| `AI_API_KEY` | **Secret** (encrypted) | your provider key |
| `AI_MODEL` | Text | the model ID from your provider's docs |
| `ALLOWED_ORIGIN` | Text | `https://ai.virellionapex.com` |

Redeploy after adding them.

### Step 3 — turn on the endpoint in the site

In `js/script.js`:

```js
const SITE_CONFIG = {
  chatEndpoint: "/api/chat",
  ...
};
```

The chatbot now sends the last 12 messages to `/api/chat` and labels replies **"Live AI response"**. If the endpoint fails, it falls back to the simulated reply. Update the on-page notices and demo badges at the same time so visitors are told accurately what they're talking to.

### Step 4 — protect it from abuse

- **Bot protection:** add Cloudflare Turnstile to the chat and forms and verify the token server-side (`https://challenges.cloudflare.com/turnstile/v0/siteverify`) before calling the AI.
- **Rate limiting:** use a Cloudflare WAF rate-limiting rule on `/api/*` (for example 20 requests/minute per IP).
- **Spending caps:** set monthly usage limits in the AI provider console.
- **Logging:** log request IDs, latency and errors — not full personal details.

### Local development with secrets

Put local-only values in a `.dev.vars` file (already in `.gitignore`) and run `npx wrangler pages dev .`. **Never commit `.dev.vars` or `.env` files.**

---

## 7. Connecting Calendly

The simplest production scheduler is Calendly's embed. The demo scheduler is already wired for it:

1. In Calendly, create the event type(s) and copy the scheduling link, e.g. `https://calendly.com/your-team/consultation`.
2. In `js/script.js` set:
   ```js
   calendlyUrl: "https://calendly.com/your-team/consultation",
   ```
3. Deploy. `appointments.html` now hides the demo scheduler and loads Calendly's inline widget (`assets.calendly.com/assets/external/widget.js`). The `_headers` Content-Security-Policy already allows Calendly's script, styles and frame.
4. Update the on-page "Demonstration scheduler" notice.

**Want booked meetings in your CRM?** Calendly can send booking events to a webhook (feature availability depends on your Calendly plan). Point it at a Pages Function such as `functions/api/calendly-webhook.js` that verifies the webhook signing key (stored as a secret) and then creates or updates the CRM contact.

**Custom alternative:** set `appointmentEndpoint: "/api/booking"` and write a function that checks availability and creates the event through the Google Calendar or Microsoft Graph API, using OAuth credentials stored as secrets.

---

## 8. CRM, lead and support-system integration

All three follow the same pattern: **browser → your Pages Function → vendor API using a secret token.**

### Leads → CRM

1. Set `leadEndpoint: "/api/lead"` in `SITE_CONFIG`.
2. The form already POSTs a structured JSON payload (see the "View the JSON payload" panel after a demo submission): contact fields, business type, services, requirements, qualification answers, `leadScore`, `tier`, `source` and `submittedAt`.
3. Create `functions/api/lead.js` that:
   - verifies Turnstile;
   - re-validates every field server-side (never trust the browser);
   - **recomputes the score on the server** (the browser score is for display only);
   - upserts the contact in your CRM (for example HubSpot's CRM contacts API using a private-app token in `CRM_TOKEN`);
   - notifies the team (Slack incoming webhook URL in `SLACK_WEBHOOK_URL`, or transactional email);
   - returns `{ ok: true }`.

The receptionist's contact and appointment flows use `leadEndpoint` and `appointmentEndpoint` too.

### Support escalation → helpdesk

1. Set `supportEndpoint: "/api/ticket"`.
2. `functions/api/ticket.js` creates a ticket in Zendesk, Freshdesk, Help Scout or similar (API token as a secret), attaches the category and search terms, and returns `{ ok: true }`.

### No-code option

If you'd rather not write server code, the function can forward validated payloads to an automation platform webhook (Zapier, Make, n8n). Store the webhook URL as a secret too, because anyone holding that URL can trigger your automation.

---

## 9. Server-side environment variables

| Variable | Used by | Type |
|---|---|---|
| `AI_API_KEY` | `/api/chat` | Secret |
| `AI_MODEL` | `/api/chat` | Text |
| `ALLOWED_ORIGIN` | all functions | Text |
| `TURNSTILE_SECRET_KEY` | all functions | Secret |
| `CRM_TOKEN` | `/api/lead` | Secret |
| `SLACK_WEBHOOK_URL` | `/api/lead`, `/api/ticket` | Secret |
| `HELPDESK_TOKEN` | `/api/ticket` | Secret |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | `/api/calendly-webhook` | Secret |

These variables are configured in Cloudflare and read through `env.NAME` inside functions only. They never go in HTML, CSS, `script.js` or the Git repository. (The Turnstile *site* key is public and may appear in HTML; the *secret* key may not.)

---

## 10. Production security checklist

- [ ] No keys, tokens or webhook URLs anywhere in the repo (search for `key`, `token`, `secret`, `hooks.`)
- [ ] All secrets stored as encrypted Cloudflare secrets; `.dev.vars`/`.env` never committed
- [ ] Every `/api/*` function validates the origin, method, content type, field types and lengths
- [ ] Turnstile (or similar) on chat and forms; WAF rate limiting on `/api/*`
- [ ] Provider spending limits set; graceful error messages when the AI is unavailable
- [ ] System prompt limits the assistant to approved business information and requires handoff when unsure
- [ ] No collection of payment, government ID, health or password data in chat or forms
- [ ] Privacy policy and terms pages added; chat disclosure states visitors are talking to an AI
- [ ] Data retention defined for logs, transcripts and leads; logs exclude sensitive fields
- [ ] `_headers` CSP updated when adding any new third-party script, font or frame (keep `connect-src 'self'` so the browser can't call third-party APIs directly)
- [ ] HTTPS only (HSTS header included); custom domain certificate **Active**
- [ ] Demo labels removed **only** for features that are actually connected and tested
- [ ] Live site tested end-to-end after every integration change

---

## 11. Testing performed

Automated headless-Chromium tests run before delivery covered:

- All 9 pages return 200, every internal link resolves, and the footer disclaimer appears on every page
- Homepage activity feed and feature tabs
- Chatbot: KB answers, suggested questions, fallback, HTML-injection safety (user input rendered as text), history restored after reload, clear chat
- Receptionist: full appointment flow with invalid → valid email, confirmation and reference; hours, human-handoff and FAQ routes; captured-details panel
- Scheduling: type → date → slot → validation errors → details → review → confirmation → `.ics` download → book again
- Lead form: 11 validation errors on empty submit, then a valid submission with score, tier and payload
- Support: search, suggested answers, category filter, escalation ticket timeline, `#support` deep link
- Automation: integration toggles and workflow simulation run
- Responsive layouts at 375, 768, 1024 and 1920 px wide with no horizontal overflow; the mobile menu opens and navigates
- Zero JavaScript errors across all pages

**Still to verify after deployment:** fonts and Unsplash photos loading from their CDNs, the live custom domain, and the CSP headers (check the browser console on the live site).

---

## 12. Image credits & licensing

- `images/hero.jpg` and `images/logo.png` (plus favicons) are **original artwork generated for this project**.
- Supporting photographs are loaded from Unsplash under the [Unsplash License](https://unsplash.com/license) and credited on-page:
  Annie Spratt, Charanjeet Dhiman, Héctor J. Rivas and Tim van der Kuip.
  To self-host them instead, download them from Unsplash, save them into `images/`, update the `src` attributes, and keep the photographer credits.
- Integration platform names on `automation.html` are trademarks of their owners. They are shown only as examples of possible integrations; no partnership is claimed.
- Fonts: Sora, IBM Plex Sans and IBM Plex Mono via Google Fonts (SIL Open Font License).

---

© Virellion Apex · [virellionapex.com](https://virellionapex.com)
