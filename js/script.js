/* =========================================================================
   AURIVANE — AI Business Systems · Demonstration site by Virellion Apex
   -------------------------------------------------------------------------
   Everything in this file runs in the visitor's browser. It contains NO API
   keys, secrets, or credentials, and it must never contain any.

   DEMO MODE (default): chat replies, receptionist flows, scheduling, lead
   capture and support tickets are SIMULATED in the browser. Nothing is sent
   anywhere. Data lives in memory (and sessionStorage for chat history) only.

   GOING LIVE: set the endpoint values in SITE_CONFIG below to YOUR OWN
   server-side routes (for example Cloudflare Pages Functions at /api/...).
   Those server routes hold the secrets as environment variables and talk to
   the AI provider / CRM / helpdesk. See README.md → "Connecting a real backend".
   ========================================================================= */

const SITE_CONFIG = {
  /* Leave empty ("") to stay in simulated demo mode. */
  chatEndpoint: "",        // e.g. "/api/chat"     → server calls the AI model
  leadEndpoint: "",        // e.g. "/api/lead"     → server writes to the CRM
  supportEndpoint: "",     // e.g. "/api/ticket"   → server creates a helpdesk ticket
  appointmentEndpoint: "", // e.g. "/api/booking"  → server books in your calendar system
  calendlyUrl: "",         // e.g. "https://calendly.com/your-team/consultation" → replaces demo scheduler
  timeZoneLabel: "Central Time",
  virellionUrl: "https://virellionapex.com"
};

/* ---------- Fictional business data (replace for a real client) ---------- */
const BUSINESS = {
  name: "Aurivane",
  assistantName: "Aria",
  email: "demo@aurivane.example",        // placeholder — .example is a reserved, non-routable domain
  phone: "(555) 010-0142",               // placeholder — 555-01xx numbers are reserved for fiction
  /* 0 = Sunday … 6 = Saturday. Times are 24h, in the business time zone. */
  hours: {
    0: null,
    1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 17],
    6: [9, 13]
  },
  services: [
    { id: "receptionist", name: "AI Receptionist", blurb: "Greets visitors, answers common questions, shares hours, and collects appointment requests around the clock.", page: "services.html#receptionist" },
    { id: "support", name: "Customer Support Automation", blurb: "Answers repeat questions from your own knowledge base and hands complex issues to your team with full context.", page: "services.html#support" },
    { id: "workflow", name: "Workflow Automation", blurb: "Connects forms, CRM, calendar, email and chat so routine handoffs happen without copy-and-paste.", page: "services.html#workflow" },
    { id: "leads", name: "Lead Generation Automation", blurb: "Captures, qualifies and routes enquiries so your team follows up on the right leads first.", page: "services.html#leads" },
    { id: "process", name: "Business Process Automation", blurb: "Maps and automates back-office tasks such as intake, document routing and status updates.", page: "services.html#process" },
    { id: "appointments", name: "Appointment Automation", blurb: "Online booking, confirmations, reminders and rescheduling connected to your calendar.", page: "services.html#appointments" },
    { id: "consulting", name: "AI Integration Consulting", blurb: "Strategy, vendor selection, secure architecture and rollout planning for AI in your business.", page: "services.html#consulting" }
  ]
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const isDemo = (endpoint) => !endpoint;

/* =========================================================================
   SHARED KNOWLEDGE BASE — used by the chatbot, receptionist and support center
   ========================================================================= */
const KB = [
  { id: "what", cat: "Getting started", q: "What does Aurivane do?",
    a: "Aurivane designs AI-assisted customer experiences for small and mid-sized businesses: website receptionists, support assistants, online scheduling, lead capture and the automations that connect them to your CRM, calendar and inbox. <em>Aurivane is a fictional company created for this Virellion Apex demonstration.</em>",
    k: ["what", "do", "about", "company", "aurivane", "who are you", "offer"] },
  { id: "real-ai", cat: "Getting started", q: "Is this chatbot powered by a real AI model?",
    a: "Not on this demo. Every reply here is a <strong>simulated, rule-based response</strong> written in advance and matched to keywords in your message. No AI model, API or server is connected. In a production build, the same interface sends your message to a secure server endpoint, which calls an AI provider using keys that never reach the browser.",
    k: ["real", "ai", "gpt", "model", "llm", "fake", "simulated", "demo", "powered", "openai", "claude", "human or"] },
  { id: "start", cat: "Getting started", q: "How does a typical project start?",
    a: "Projects begin with a short discovery consultation, followed by a written plan covering the workflows to automate, the systems to connect, the data involved and a security review. Build, testing and a supervised launch follow. You can <a href=\"appointments.html\">request a consultation</a> to see the flow.",
    k: ["start", "begin", "process", "onboard", "kickoff", "how does it work", "steps"] },
  { id: "industries", cat: "Getting started", q: "Which industries do you work with?",
    a: "The patterns shown here suit service businesses with frequent enquiries and bookings: clinics and wellness studios, legal and accounting firms, home services, real estate, hospitality, retail and professional consultancies.",
    k: ["industry", "industries", "clinic", "law", "legal", "restaurant", "real estate", "retail", "who do you work"] },

  { id: "rec-what", cat: "AI Receptionist", q: "What can an AI receptionist handle?",
    a: "Greeting visitors, sharing hours and location details, answering frequent questions, explaining services, collecting appointment requests and contact details, and routing urgent requests to a person. Try the <a href=\"ai-receptionist.html\">receptionist demo</a>.",
    k: ["receptionist", "front desk", "greet", "answer calls", "virtual receptionist"] },
  { id: "rec-after", cat: "AI Receptionist", q: "Does the receptionist work after hours?",
    a: "Yes — that is one of the main benefits. Outside business hours it can still answer questions and collect requests, then tell the visitor when the team will follow up. On this demo the after-hours behaviour is simulated using the sample hours shown on the page.",
    k: ["after hours", "night", "weekend", "24/7", "24 7", "closed", "overnight"] },
  { id: "rec-voice", cat: "AI Receptionist", q: "Can it answer phone calls?",
    a: "This demo is web chat only. Phone answering is possible with a telephony provider and a voice AI service connected through a secure server. That would be scoped as a separate integration with its own costs.",
    k: ["phone", "call", "voice", "telephone", "ring"] },

  { id: "bot-train", cat: "Chatbot", q: "How is a chatbot trained on my business?",
    a: "A production assistant is grounded in <em>your</em> approved content — service pages, FAQs, policies — through retrieval from a curated knowledge base, plus clear instructions about tone and what it must not answer. It is tested against real questions before launch and reviewed after.",
    k: ["train", "learn", "knowledge", "my business", "content", "teach", "custom"] },
  { id: "bot-wrong", cat: "Chatbot", q: "What if the assistant does not know an answer?",
    a: "A well-built assistant should say it is not sure and offer a handoff instead of guessing. The flows here demonstrate that: unknown questions get a fallback with options to contact a person.",
    k: ["wrong", "mistake", "don't know", "dont know", "hallucinate", "unsure", "incorrect"] },

  { id: "sch-how", cat: "Scheduling", q: "How does online scheduling work?",
    a: "Visitors choose an appointment type, pick an available date and time, add their details and receive a confirmation. In production, availability comes from your calendar (for example via Calendly, Google Calendar or Microsoft 365), so double-booking is prevented. Try the <a href=\"appointments.html\">scheduling demo</a>.",
    k: ["schedule", "book", "booking", "appointment", "calendar", "availability", "meeting"] },
  { id: "sch-remind", cat: "Scheduling", q: "Can clients get reminders and reschedule?",
    a: "Yes. Confirmation and reminder emails or texts, plus reschedule and cancel links, are standard in a connected setup. The demo produces a sample confirmation and a downloadable calendar file but sends no messages.",
    k: ["remind", "reminder", "reschedule", "cancel", "no-show", "no show"] },

  { id: "int-crm", cat: "Integrations", q: "Which CRMs can be connected?",
    a: "Common choices include HubSpot, Salesforce, Zoho CRM and Pipedrive, or a custom database. Leads captured on the website are sent by the server to the CRM with the source, interests and qualification answers attached. See <a href=\"automation.html\">Automation &amp; Integrations</a>.",
    k: ["crm", "hubspot", "salesforce", "zoho", "pipedrive", "integrate", "integration", "connect"] },
  { id: "int-comm", cat: "Integrations", q: "Can notifications go to Slack, email or SMS?",
    a: "Yes. A server-side workflow can notify your team in Slack or Microsoft Teams, send transactional email, or text via an SMS provider when a lead arrives or a conversation is escalated.",
    k: ["slack", "teams", "email", "sms", "text", "notify", "notification", "whatsapp"] },

  { id: "sec-keys", cat: "Security & data", q: "Where are API keys stored?",
    a: "Never in the website code. Keys live as encrypted environment variables on the server (for example Cloudflare Pages Functions or Workers secrets). The browser only talks to your own endpoint, which validates the request, applies rate limits and then calls the provider.",
    k: ["api key", "key", "secret", "credential", "token", "env", "environment"] },
  { id: "sec-data", cat: "Security & data", q: "What happens to the information I type here?",
    a: "On this demo it stays in your browser tab and is not sent anywhere. Chat history is kept in session storage and disappears when you close the tab. Please do not enter sensitive personal information — use sample details.",
    k: ["data", "privacy", "private", "store", "stored", "information", "gdpr", "safe", "secure", "security"] },
  { id: "sec-sensitive", cat: "Security & data", q: "Should the assistant collect sensitive information?",
    a: "No. Good practice is to collect only what is needed to follow up — typically name, email and the request — and to keep payment, health, identity and account details out of chat entirely.",
    k: ["sensitive", "ssn", "credit card", "card number", "medical", "password", "pii"] },

  { id: "bill-price", cat: "Pricing", q: "How much does an AI solution cost?",
    a: "Pricing depends on scope: number of workflows, integrations, conversation volume and AI usage costs. Projects are quoted after a discovery consultation. For real pricing from the team that built this demo, contact <a href=\"https://virellionapex.com\" target=\"_blank\" rel=\"noopener\">Virellion Apex</a>.",
    k: ["price", "pricing", "cost", "how much", "budget", "quote", "fee", "expensive", "cheap"] },
  { id: "bill-usage", cat: "Pricing", q: "Are there ongoing costs?",
    a: "Usually: hosting (often free or low cost for static sites), AI usage billed per request by the provider, and any paid tools such as a CRM or scheduling plan. A good proposal itemises these so there are no surprises.",
    k: ["ongoing", "monthly", "subscription", "maintenance", "usage", "recurring"] },
  { id: "who-built", cat: "Getting started", q: "Who built this website?",
    a: "This site is a demonstration project developed by <a href=\"https://virellionapex.com\" target=\"_blank\" rel=\"noopener\">Virellion Apex</a> to show how AI receptionists, chat support, scheduling and lead automation can work on a business website.",
    k: ["who built", "virellion", "apex", "developer", "made this", "designed"] }
];

/* =========================================================================
   UTILITIES
   ========================================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (str) => String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const timeNow = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;
const refId = (prefix) => `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const store = {
  get(key, fallback) { try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, val) { try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* storage unavailable: keep in memory only */ } },
  del(key) { try { sessionStorage.removeItem(key); } catch { /* ignore */ } }
};

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 3200);
}

/** Business-hours helper (uses visitor's local clock as a stand-in for the business time zone). */
function hoursStatus(date = new Date()) {
  const h = BUSINESS.hours[date.getDay()];
  const fmt = (n) => { const p = n >= 12 ? "PM" : "AM"; const x = n % 12 || 12; return `${x}:00 ${p}`; };
  const hourNow = date.getHours() + date.getMinutes() / 60;
  const open = !!h && hourNow >= h[0] && hourNow < h[1];
  let next = "";
  if (!open) {
    for (let i = 0; i < 8; i++) {
      const d = new Date(date); d.setDate(d.getDate() + i);
      const hh = BUSINESS.hours[d.getDay()];
      if (hh && (i > 0 || hourNow < hh[0])) { next = `${i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAMES[d.getDay()]} at ${fmt(hh[0])}`; break; }
    }
  }
  return { open, today: h ? `${fmt(h[0])} – ${fmt(h[1])}` : "Closed", next, fmt };
}
function hoursTableHTML() {
  const today = new Date().getDay();
  const { fmt } = hoursStatus();
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = BUSINESS.hours[d];
    return `<li class="${d === today ? "today" : ""}"><span>${DAY_NAMES[d]}</span><span>${h ? `${fmt(h[0])} – ${fmt(h[1])}` : "Closed"}</span></li>`;
  }).join("");
}

/** Simple keyword-scoring matcher shared by chat surfaces. */
function matchKB(text, list = KB) {
  const t = ` ${text.toLowerCase().replace(/[^\w\s'/-]/g, " ")} `;
  let best = null, bestScore = 0;
  for (const item of list) {
    let score = 0;
    for (const k of item.k) if (t.includes(k.includes(" ") ? k : ` ${k}`)) score += k.includes(" ") ? 3 : 2;
    for (const w of item.q.toLowerCase().split(/\W+/)) if (w.length > 4 && t.includes(w)) score += 0.5;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 2 ? best : null;
}

/* =========================================================================
   GLOBAL: header, nav, reveal, tabs, footer year
   ========================================================================= */
function initGlobal() {
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".nav-toggle");
  const menu = $(".nav-menu");
  if (toggle && menu) {
    const close = () => { toggle.setAttribute("aria-expanded", "false"); menu.classList.remove("open"); document.body.style.overflow = ""; };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { close(); toggle.focus(); } });
    window.addEventListener("resize", () => { if (window.innerWidth > 980) close(); });
  }

  // current page
  const here = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  $$(".nav-links a").forEach((a) => {
    const target = a.getAttribute("href").replace(/\.html$/, "").replace(/^\.\//, "");
    if (target === here || (here === "index" && target === "index")) a.setAttribute("aria-current", "page");
  });

  // reveal on scroll
  const items = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add("in"));

  // accessible tabs (any [role=tablist])
  $$("[role='tablist']").forEach((list) => {
    const tabs = $$("[role='tab']", list);
    const activate = (tab, focus) => {
      tabs.forEach((t) => {
        const sel = t === tab;
        t.setAttribute("aria-selected", String(sel));
        t.tabIndex = sel ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !sel;
      });
      if (focus) tab.focus();
      list.dispatchEvent(new CustomEvent("tabchange", { detail: tab }));
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => activate(t));
      t.addEventListener("keydown", (e) => {
        let n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); activate(n, true); }
      });
    });
  });

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-hours-status]").forEach((el) => {
    const s = hoursStatus();
    el.className = `status-pill ${s.open ? "open" : "closed"}`;
    el.innerHTML = `<span class="dot"></span>${s.open ? `Open now · ${s.today}` : `Closed · opens ${s.next}`}`;
  });
  $$("[data-hours-table]").forEach((el) => (el.innerHTML = hoursTableHTML()));
}

/* =========================================================================
   HOME: simulated activity feed
   ========================================================================= */
function initHome() {
  const feed = $("#activity-feed");
  if (!feed) return;
  const events = [
    ["lead", "New lead captured — dental clinic, website redesign"],
    ["chat", "Chat answered: “Do you work on weekends?”"],
    ["book", "Consultation request — Thu 10:30 AM"],
    ["sync", "Lead synced to CRM pipeline · Stage: New"],
    ["chat", "Escalated to human: billing question"],
    ["lead", "Lead qualified · Score 78 · Warm"],
    ["book", "Reminder scheduled for tomorrow 9:00 AM"],
    ["sync", "Team notified in #new-leads"],
    ["chat", "After-hours FAQ answered: parking info"],
    ["lead", "Quote request — property management firm"]
  ];
  const counters = { chats: $("#stat-chats"), leads: $("#stat-leads"), books: $("#stat-books") };
  const n = { chats: 128, leads: 23, books: 9 };
  let i = 0;
  const push = () => {
    const [type, msg] = events[i % events.length]; i++;
    const li = document.createElement("li");
    li.innerHTML = `<span class="tag ${type}">${type === "book" ? "booking" : type}</span><span class="msg">${esc(msg)}</span><span class="t">${timeNow()}</span>`;
    feed.prepend(li);
    while (feed.children.length > 5) feed.lastElementChild.remove();
    if (type === "chat") n.chats++;
    if (type === "lead") n.leads++;
    if (type === "book") n.books++;
    if (counters.chats) { counters.chats.textContent = n.chats; counters.leads.textContent = n.leads; counters.books.textContent = n.books; }
  };
  for (let k = 0; k < 4; k++) push();
  if (!prefersReduced) {
    let timer = setInterval(push, 2800);
    document.addEventListener("visibilitychange", () => { clearInterval(timer); if (!document.hidden) timer = setInterval(push, 2800); });
  }
}

/* =========================================================================
   CHAT ENGINE (shared rendering)
   ========================================================================= */
function createChat(root, opts = {}) {
  const log = $(".chat-log", root);
  const form = $(".chat-form", root);
  const input = $("input", form);
  const api = {
    log, input,
    add(role, html, { label, chips, persist = true } = {}) {
      const wrap = document.createElement("div");
      wrap.className = `msg msg--${role}`;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      if (role === "user") bubble.textContent = html; else bubble.innerHTML = html;
      wrap.appendChild(bubble);
      if (role !== "system") {
        const meta = document.createElement("div");
        meta.className = "meta";
        const who = role === "user" ? "You" : (opts.botName || "Assistant");
        meta.innerHTML = `<span>${esc(who)} · ${timeNow()}</span>${role === "bot" ? `<span class="sim-tag">${label || "Simulated response"}</span>` : ""}`;
        wrap.appendChild(meta);
      }
      if (chips && chips.length) wrap.appendChild(api.chips(chips));
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
      if (persist && opts.onPersist) opts.onPersist({ role, html, label, t: Date.now() });
      return wrap;
    },
    chips(list) {
      const box = document.createElement("div");
      box.className = "quick-replies";
      list.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.textContent = typeof c === "string" ? c : c.label;
        b.addEventListener("click", () => {
          $$(".quick-replies", log).forEach((q) => q.remove()); // old suggestions no longer relevant
          if (opts.onChip) opts.onChip(typeof c === "string" ? { label: c, value: c } : c);
        });
        box.appendChild(b);
      });
      return box;
    },
    async typing(ms = 700) {
      const t = document.createElement("div");
      t.className = "msg msg--bot";
      t.innerHTML = `<div class="bubble typing" aria-label="Assistant is typing"><i></i><i></i><i></i></div>`;
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      await sleep(prefersReduced ? 50 : ms);
      t.remove();
    },
    clear() { log.innerHTML = ""; }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 500) { toast("Please keep messages under 500 characters."); return; }
    input.value = "";
    $$(".quick-replies", log).forEach((q) => q.remove());
    opts.onSend && opts.onSend(text);
  });
  return api;
}

/** Calls a real server endpoint if configured, else returns null so the caller simulates. */
async function liveChat(endpoint, history) {
  if (isDemo(endpoint)) return null;
  try {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return typeof data.reply === "string" ? esc(data.reply).replace(/\n/g, "<br>") : null;
  } catch (err) {
    console.warn("Live chat endpoint failed, falling back to simulated reply.", err);
    return null;
  }
}

/* =========================================================================
   CHATBOT PAGE
   ========================================================================= */
function initChatbot() {
  const root = $("#chatbot");
  if (!root) return;
  const KEY = "aurivane.chat.v1";
  let history = store.get(KEY, []);
  const live = !isDemo(SITE_CONFIG.chatEndpoint);
  const modeEl = $("#chat-mode");
  if (modeEl) modeEl.textContent = live ? "Live endpoint configured" : "Demo mode · rule-based replies";
  const counter = $("#chat-count");
  const updateCount = () => { if (counter) counter.textContent = history.filter((m) => m.role === "user").length; };

  const SUGGESTED = ["What can an AI receptionist do?", "Is this a real AI?", "How do I book a consultation?", "Which CRMs can you connect?", "Where are API keys stored?", "How much does it cost?"];

  const chat = createChat(root, {
    botName: BUSINESS.assistantName,
    onPersist: (m) => { history.push(m); store.set(KEY, history); updateCount(); },
    onSend: (t) => respond(t),
    onChip: (c) => respond(c.value || c.label)
  });

  function intents(text) {
    const t = text.toLowerCase();
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo|hiya)\b/.test(t)) return { html: `<p>Hello! I'm ${BUSINESS.assistantName}, the demo assistant for ${BUSINESS.name}. I can explain our AI services, scheduling, integrations and security. What would you like to know?</p>`, chips: SUGGESTED.slice(0, 4) };
    if (/\b(thank|thanks|thx|appreciate)\b/.test(t)) return { html: "<p>You're welcome! Anything else I can help with?</p>", chips: ["See all services", "Book a consultation"] };
    if (/\b(bye|goodbye|see you)\b/.test(t)) return { html: "<p>Thanks for trying the demo. Your conversation stays in this tab until you close it.</p>" };
    if (/\b(human|person|agent|representative|talk to someone|real person|staff)\b/.test(t)) return { html: `<p>In a live setup, I'd hand this conversation to a team member with the full transcript attached. <strong>This is a demo, so no one will be notified.</strong></p><p>You can see the escalation flow in the <a href="contact.html#support">Support Center</a>, or reach the developer of this demo at <a href="${SITE_CONFIG.virellionUrl}" target="_blank" rel="noopener">Virellion Apex</a>.</p>`, chips: ["Open the Support Center"] };
    if (/\b(services?|what do you offer|solutions|products)\b/.test(t) && !/receptionist|crm|price|cost/.test(t)) return { html: `<p>${BUSINESS.name} offers seven AI services:</p><ul>${BUSINESS.services.map((s) => `<li><strong>${s.name}</strong> — ${s.blurb}</li>`).join("")}</ul><p><a href="services.html">View the full services page →</a></p>`, chips: ["What can an AI receptionist do?", "Book a consultation"] };
    if (/\b(hours|open|opening|closing|when are you)\b/.test(t)) { const s = hoursStatus(); return { html: `<p>Our sample business hours (${SITE_CONFIG.timeZoneLabel}):</p><ul class="hours-list">${hoursTableHTML()}</ul><p>${s.open ? "We're <strong>open now</strong>." : `We're currently closed and reopen ${s.next}.`}</p>` }; }
    if (/\b(contact|email|phone|reach you|get in touch)\b/.test(t)) return { html: `<p>For this fictional company, the placeholder contact details are <strong>${BUSINESS.email}</strong> and <strong>${BUSINESS.phone}</strong> (not real). To talk about building something like this, visit <a href="${SITE_CONFIG.virellionUrl}" target="_blank" rel="noopener">virellionapex.com</a>.</p>`, chips: ["Start a project", "Book a consultation"] };
    return null;
  }

  const chipMap = {
    "See all services": "services",
    "Book a consultation": () => { location.href = "appointments.html"; },
    "Start a project": () => { location.href = "contact.html#project"; },
    "Open the Support Center": () => { location.href = "contact.html#support"; }
  };

  async function respond(text) {
    const action = chipMap[text];
    if (typeof action === "function") { chat.add("user", text); action(); return; }
    chat.add("user", text);
    const userHistory = history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.role === "user" ? m.html : m.html.replace(/<[^>]+>/g, " ") }));
    await chat.typing(650 + Math.min(text.length * 12, 900));
    const liveReply = await liveChat(SITE_CONFIG.chatEndpoint, userHistory);
    if (liveReply) { chat.add("bot", liveReply, { label: "Live AI response" }); return; }
    const intent = intents(action || text);
    if (intent) { chat.add("bot", intent.html, { chips: intent.chips }); return; }
    const hit = matchKB(text);
    if (hit) {
      const related = KB.filter((x) => x.cat === hit.cat && x.id !== hit.id).slice(0, 2).map((x) => x.q);
      chat.add("bot", `<p>${hit.a}</p>`, { chips: related });
      return;
    }
    chat.add("bot", `<p>I don't have a prepared answer for that one — and as a simulated assistant I won't guess.</p><p>Try one of the topics below, or ask about services, scheduling, integrations, security or pricing.</p>`, { chips: SUGGESTED.slice(0, 4), label: "Simulated fallback" });
  }

  function welcome() {
    chat.add("system", "Demonstration chat · Replies are pre-written and matched by keyword · No AI model is connected", { persist: false });
    chat.add("bot", `<p>Hi, I'm <strong>${BUSINESS.assistantName}</strong> — ${BUSINESS.name}'s demo assistant.</p><p>Ask me about AI receptionists, chat support, scheduling, CRM integrations, security or pricing.</p>`, { chips: SUGGESTED.slice(0, 4) });
  }

  // restore session history
  if (history.length) {
    chat.add("system", "Conversation restored from this browser session", { persist: false });
    history.forEach((m) => chat.add(m.role, m.html, { label: m.label, persist: false }));
  } else welcome();
  updateCount();

  $$("[data-suggest]").forEach((b) => b.addEventListener("click", () => respond(b.dataset.suggest)));
  const clearBtn = $("#chat-clear");
  if (clearBtn) clearBtn.addEventListener("click", () => { history = []; store.del(KEY); chat.clear(); updateCount(); welcome(); toast("Conversation cleared"); });
  const dlBtn = $("#chat-download");
  if (dlBtn) dlBtn.addEventListener("click", () => {
    if (!history.length) { toast("Nothing to download yet"); return; }
    const lines = history.map((m) => `[${new Date(m.t).toLocaleString()}] ${m.role === "user" ? "You" : BUSINESS.assistantName + " (simulated)"}: ${m.html.replace(/<li>/g, "\n - ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()}`);
    const blob = new Blob([`Aurivane demo chat transcript\nSimulated responses — no AI model connected.\n\n${lines.join("\n\n")}\n`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aurivane-demo-chat.txt"; a.click(); URL.revokeObjectURL(a.href);
  });
}

/* =========================================================================
   AI RECEPTIONIST PAGE — guided state machine
   ========================================================================= */
function initReceptionist() {
  const root = $("#receptionist");
  if (!root) return;
  const captured = {};
  const capEl = $("#capture-data");
  const progress = $("#flow-progress");
  let flow = null; // { name, steps:[], i, data }

  const chat = createChat(root, {
    botName: `${BUSINESS.assistantName} · Receptionist`,
    onSend: (t) => handleText(t),
    onChip: (c) => handleChip(c)
  });

  const MENU = [
    { label: "Business hours", value: "hours" },
    { label: "Frequently asked questions", value: "faq" },
    { label: "Our services", value: "services" },
    { label: "Request an appointment", value: "appt" },
    { label: "Leave my contact details", value: "contact" },
    { label: "Speak with a person", value: "human" }
  ];
  const FAQ_IDS = ["rec-after", "sch-how", "int-crm", "sec-data", "bill-price"];

  function renderCapture() {
    const entries = Object.entries(captured);
    capEl.innerHTML = entries.length
      ? `<dl class="kv">${entries.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`
      : `<p class="capture-empty">Nothing captured yet. Details you share in a flow appear here.</p>`;
  }
  function setProgress(i = 0, total = 0) {
    progress.innerHTML = total ? Array.from({ length: total }, (_, k) => `<i class="${k < i ? "on" : ""}"></i>`).join("") : "";
    progress.setAttribute("aria-label", total ? `Step ${Math.min(i + 1, total)} of ${total}` : "");
  }
  const say = async (html, chips, ms = 600) => { await chat.typing(ms); chat.add("bot", html, { chips }); };
  const menuChips = () => MENU;

  async function welcome() {
    const s = hoursStatus();
    chat.add("system", "Demonstration receptionist · Scripted flows · Nothing you enter is sent anywhere");
    await say(`<p>Welcome to <strong>${BUSINESS.name}</strong>! I'm ${BUSINESS.assistantName}, the virtual receptionist.</p><p>${s.open ? `We're open right now (${s.today}).` : `Our team is away at the moment — we reopen ${s.next} — but I can still help.`} How can I help you today?</p>`, menuChips(), 500);
  }

  /* ----- flows ----- */
  const nextDays = () => {
    const out = []; const d = new Date();
    while (out.length < 4) { d.setDate(d.getDate() + 1); if (BUSINESS.hours[d.getDay()]) out.push(d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })); }
    return out;
  };
  const FLOWS = {
    appt: [
      { key: "Appointment type", ask: "<p>Great — let's request an appointment. What would you like to book?</p>", chips: ["Discovery consultation (30 min)", "AI receptionist walkthrough (45 min)", "Automation planning session (60 min)"], chipOnly: true },
      { key: "Preferred day", ask: "<p>Which day works best?</p>", chips: () => nextDays(), chipOnly: true },
      { key: "Time of day", ask: "<p>Do you prefer a morning or an afternoon?</p>", chips: ["Morning", "Afternoon", "No preference"], chipOnly: true },
      { key: "Name", ask: "<p>May I have your name? <span class=\"muted small\">(sample details are fine)</span></p>", validate: (v) => (v.length >= 2 && v.length <= 80 ? null : "Please enter a name between 2 and 80 characters.") },
      { key: "Email", ask: "<p>And the best email for the confirmation?</p>", validate: (v) => (EMAIL_RE.test(v) ? null : "That doesn't look like a valid email address — could you check it?") }
    ],
    contact: [
      { key: "Name", ask: "<p>Happy to take your details. What's your name?</p>", validate: (v) => (v.length >= 2 && v.length <= 80 ? null : "Please enter a name between 2 and 80 characters.") },
      { key: "Email", ask: "<p>What's your email address?</p>", validate: (v) => (EMAIL_RE.test(v) ? null : "That email doesn't look right — please try again.") },
      { key: "Phone", ask: "<p>A phone number is optional. Type it, or choose skip.</p>", chips: ["Skip"], validate: (v) => (v === "Skip" || PHONE_RE.test(v) ? null : "Please enter digits only (spaces, dashes and + are fine), or choose Skip.") },
      { key: "Topic", ask: "<p>What would you like to discuss?</p>", chips: ["AI receptionist", "Customer support automation", "Workflow automation", "Something else"] }
    ]
  };

  async function startFlow(name) {
    flow = { name, i: 0 };
    Object.keys(captured).forEach((k) => delete captured[k]);
    renderCapture();
    await askStep();
  }
  async function askStep() {
    const steps = FLOWS[flow.name];
    setProgress(flow.i, steps.length + 1);
    const s = steps[flow.i];
    const chips = typeof s.chips === "function" ? s.chips() : s.chips;
    await say(s.ask, chips ? [...chips, { label: "Cancel", value: "__cancel" }] : [{ label: "Cancel", value: "__cancel" }]);
    chat.input.focus();
  }
  async function answerStep(value) {
    const steps = FLOWS[flow.name];
    const s = steps[flow.i];
    if (s.chipOnly) {
      const opts = typeof s.chips === "function" ? s.chips() : s.chips;
      if (!opts.includes(value)) { await say("<p>Please choose one of the options below.</p>", [...opts, { label: "Cancel", value: "__cancel" }], 300); return; }
    }
    const err = s.validate ? s.validate(value) : null;
    if (err) { await say(`<p>${err}</p>`, s.chips ? [...s.chips, { label: "Cancel", value: "__cancel" }] : [{ label: "Cancel", value: "__cancel" }], 350); return; }
    captured[s.key] = value === "Skip" ? "—" : value;
    renderCapture();
    flow.i++;
    if (flow.i < steps.length) await askStep();
    else await confirmFlow();
  }
  async function confirmFlow() {
    const steps = FLOWS[flow.name];
    setProgress(steps.length, steps.length + 1);
    const summary = Object.entries(captured).map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join("");
    await say(`<p>Here's what I have:</p><ul>${summary}</ul><p>Shall I submit this ${flow.name === "appt" ? "appointment request" : "contact request"}?</p>`, [{ label: "Confirm", value: "__confirm" }, { label: "Start over", value: "__restart" }, { label: "Cancel", value: "__cancel" }]);
  }
  async function submitFlow() {
    const steps = FLOWS[flow.name];
    setProgress(steps.length + 1, steps.length + 1);
    const ref = refId(flow.name === "appt" ? "APPT-DEMO" : "LEAD-DEMO");
    captured["Reference (demo)"] = ref;
    renderCapture();
    const endpoint = flow.name === "appt" ? SITE_CONFIG.appointmentEndpoint : SITE_CONFIG.leadEndpoint;
    let sent = false;
    if (!isDemo(endpoint)) {
      try { const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "receptionist", ...captured }) }); sent = r.ok; } catch { sent = false; }
    }
    await say(sent
      ? `<p>Thank you! Your request has been submitted. Reference <strong>${ref}</strong>.</p>`
      : `<p><strong>Demo complete.</strong> In a live deployment this ${flow.name === "appt" ? "request would be placed on the team calendar and a confirmation email sent" : "contact would be created in the CRM and the team notified"}.</p><p>Demo reference: <strong>${ref}</strong>. <em>Nothing was sent or saved.</em></p>`,
      [{ label: "Back to main menu", value: "__menu" }, ...(flow.name === "appt" ? [{ label: "Try the full scheduler", value: "__scheduler" }] : [])], 900);
    flow = null;
  }

  /* ----- input routing ----- */
  async function handleChip(c) {
    const v = c.value ?? c.label;
    chat.add("user", c.label);
    if (v === "__cancel") { flow = null; setProgress(); await say("<p>No problem — cancelled. What else can I help with?</p>", menuChips()); return; }
    if (v === "__menu") { setProgress(); await say("<p>What else can I help you with?</p>", menuChips()); return; }
    if (v === "__restart") { await startFlow(flow ? flow.name : "appt"); return; }
    if (v === "__confirm") { await submitFlow(); return; }
    if (v === "__scheduler") { location.href = "appointments.html"; return; }
    if (flow) { await answerStep(v); return; }
    await route(v);
  }
  async function handleText(t) {
    chat.add("user", t);
    if (flow) { await answerStep(t); return; }
    const low = t.toLowerCase();
    if (/hour|open|close/.test(low)) return route("hours");
    if (/appoint|book|schedul|meeting|consult/.test(low)) return route("appt");
    if (/contact|call me|email me|reach me|my details/.test(low)) return route("contact");
    if (/human|person|someone|staff|agent/.test(low)) return route("human");
    if (/service|offer/.test(low)) return route("services");
    if (/faq|question/.test(low)) return route("faq");
    const hit = matchKB(t);
    if (hit) return say(`<p>${hit.a}</p>`, [{ label: "Back to main menu", value: "__menu" }]);
    await say("<p>I'm a scripted demo receptionist, so I may not understand everything. Here's what I can help with:</p>", menuChips());
  }
  async function route(v) {
    if (v === "hours") {
      const s = hoursStatus();
      return say(`<p>Our sample hours (${SITE_CONFIG.timeZoneLabel}):</p><ul class="hours-list">${hoursTableHTML()}</ul><p>${s.open ? "We're <strong>open now</strong>." : `We're closed now and reopen <strong>${s.next}</strong>.`}</p>`, [{ label: "Request an appointment", value: "appt" }, { label: "Back to main menu", value: "__menu" }]);
    }
    if (v === "faq") return say("<p>Here are the questions visitors ask most often:</p>", FAQ_IDS.map((id) => ({ label: KB.find((k) => k.id === id).q, value: `faq:${id}` })).concat([{ label: "Back to main menu", value: "__menu" }]));
    if (v.startsWith && v.startsWith("faq:")) { const item = KB.find((k) => k.id === v.slice(4)); return say(`<p>${item.a}</p>`, [{ label: "More FAQs", value: "faq" }, { label: "Back to main menu", value: "__menu" }]); }
    if (v === "services") return say("<p>Which service would you like to hear about?</p>", BUSINESS.services.map((s) => ({ label: s.name, value: `svc:${s.id}` })));
    if (v.startsWith && v.startsWith("svc:")) { const s = BUSINESS.services.find((x) => x.id === v.slice(4)); return say(`<p><strong>${s.name}</strong> — ${s.blurb}</p><p><a href="${s.page}">Read more on the services page →</a></p>`, [{ label: "Request an appointment", value: "appt" }, { label: "Other services", value: "services" }, { label: "Back to main menu", value: "__menu" }]); }
    if (v === "appt") return startFlow("appt");
    if (v === "contact") return startFlow("contact");
    if (v === "human") {
      const s = hoursStatus();
      return say(`<p>I'd normally transfer you to a team member ${s.open ? "now" : `when we reopen ${s.next}`}, with this conversation attached so you don't have to repeat yourself.</p><p><strong>This is a demonstration, so no one will be notified.</strong> Would you like to leave your details instead?</p>`, [{ label: "Leave my contact details", value: "contact" }, { label: "Back to main menu", value: "__menu" }]);
    }
    return say("<p>How can I help?</p>", menuChips());
  }

  $$("[data-reception]").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.reception;
    if (flow && v !== flow.name) flow = null;
    handleChip({ label: b.textContent.trim(), value: v });
  }));
  $("#reception-reset")?.addEventListener("click", () => { flow = null; Object.keys(captured).forEach((k) => delete captured[k]); renderCapture(); setProgress(); chat.clear(); welcome(); });
  renderCapture();
  welcome();
}

/* =========================================================================
   APPOINTMENTS PAGE
   ========================================================================= */
function initAppointments() {
  const root = $("#booking");
  if (!root) return;

  // Calendly mode: replace the demo scheduler with the real embed.
  if (SITE_CONFIG.calendlyUrl) {
    const host = $("#calendly-embed");
    $("#demo-scheduler").hidden = true;
    host.hidden = false;
    host.innerHTML = `<div class="calendly-inline-widget" data-url="${esc(SITE_CONFIG.calendlyUrl)}?hide_gdpr_banner=1" style="min-width:320px;height:700px;"></div>`;
    const s = document.createElement("script"); s.src = "https://assets.calendly.com/assets/external/widget.js"; s.async = true; document.body.appendChild(s);
    return;
  }

  const state = { step: 1, type: null, date: null, time: null };
  const TYPES = {
    discovery: { name: "Discovery Consultation", mins: 30, mode: "Video call" },
    receptionist: { name: "AI Receptionist Walkthrough", mins: 45, mode: "Video call" },
    automation: { name: "Automation Planning Session", mins: 60, mode: "Video call" },
    support: { name: "Support System Review", mins: 30, mode: "Phone call" }
  };
  const steps = $$(".book-step", root);
  const stepperItems = $$(".stepper li", root);
  const sum = { type: $("#sum-type"), date: $("#sum-date"), time: $("#sum-time"), len: $("#sum-len"), mode: $("#sum-mode") };
  const btnNext = $("#book-next"), btnBack = $("#book-back");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxView = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  function updateSummary() {
    const t = state.type && TYPES[state.type];
    sum.type.textContent = t ? t.name : "—";
    sum.len.textContent = t ? `${t.mins} minutes` : "—";
    sum.mode.textContent = t ? t.mode : "—";
    sum.date.textContent = state.date ? state.date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "—";
    sum.time.textContent = state.time ? `${state.time} ${SITE_CONFIG.timeZoneLabel}` : "—";
  }
  function canAdvance() {
    if (state.step === 1) return !!state.type;
    if (state.step === 2) return !!(state.date && state.time);
    return true;
  }
  function go(n) {
    state.step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    stepperItems.forEach((li, i) => { li.classList.toggle("active", i + 1 === n); li.classList.toggle("done", i + 1 < n); if (i + 1 === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
    btnBack.hidden = n === 1;
    btnNext.innerHTML = n === 4 ? "Confirm request (demo)" : `Continue <span class="arrow" aria-hidden="true">→</span>`;
    btnNext.disabled = !canAdvance();
    if (n === 4) renderReview();
    $("#booking-title")?.focus({ preventScroll: true });
    const top = root.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > top) window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
  }

  // step 1: type
  $$("input[name='appt-type']", root).forEach((r) => r.addEventListener("change", () => { state.type = r.value; state.time = null; renderSlots(); updateSummary(); btnNext.disabled = !canAdvance(); }));

  // step 2: calendar
  const grid = $("#cal-grid"), label = $("#cal-label"), prev = $("#cal-prev"), next = $("#cal-next");
  function renderCalendar() {
    label.textContent = view.toLocaleDateString([], { month: "long", year: "numeric" });
    prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    next.disabled = view >= maxView;
    const first = new Date(view);
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => `<div class="dow" aria-hidden="true">${d}</div>`).join("");
    for (let i = 0; i < first.getDay(); i++) html += `<div class="cal-day empty" aria-hidden="true"></div>`;
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const closed = !BUSINESS.hours[date.getDay()];
      const past = date <= today; // same-day booking disabled to give the team notice
      const sel = state.date && date.getTime() === state.date.getTime();
      const lbl = date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) + (closed ? ", closed" : past ? ", unavailable" : "");
      html += `<button type="button" class="cal-day${date.getTime() === today.getTime() ? " today" : ""}" data-date="${date.toISOString()}" aria-pressed="${sel}" aria-label="${lbl}" ${closed || past ? "disabled" : ""}>${d}</button>`;
    }
    grid.innerHTML = html;
    $$(".cal-day[data-date]", grid).forEach((b) => b.addEventListener("click", () => { state.date = new Date(b.dataset.date); state.time = null; renderCalendar(); renderSlots(); updateSummary(); btnNext.disabled = !canAdvance(); }));
  }
  prev.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); });
  next.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); });

  const slotsEl = $("#slots"), slotsNote = $("#slots-note");
  function renderSlots() {
    if (!state.date) { slotsEl.innerHTML = ""; slotsNote.textContent = "Select a date to see available times."; return; }
    const h = BUSINESS.hours[state.date.getDay()];
    const mins = state.type ? TYPES[state.type].mins : 30;
    const out = [];
    for (let m = h[0] * 60; m + mins <= h[1] * 60; m += 30) {
      const hh = Math.floor(m / 60), mm = m % 60;
      const label12 = `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`;
      // deterministic "already booked" pattern so the demo looks realistic and stays stable
      const seed = (state.date.getDate() * 31 + m) % 7;
      out.push({ label: label12, taken: seed === 0 || seed === 4 || hh === 12 });
    }
    slotsEl.innerHTML = out.map((s) => `<button type="button" class="slot" ${s.taken ? "disabled aria-label=\"" + s.label + ", unavailable\"" : ""} aria-pressed="${state.time === s.label}">${s.label}</button>`).join("");
    slotsNote.textContent = `${out.filter((s) => !s.taken).length} sample times available · ${SITE_CONFIG.timeZoneLabel}`;
    $$(".slot:not([disabled])", slotsEl).forEach((b) => b.addEventListener("click", () => { state.time = b.textContent; $$(".slot", slotsEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); updateSummary(); btnNext.disabled = !canAdvance(); }));
  }

  // step 3: details form validation
  const form = $("#booking-form");
  function validateDetails() {
    let ok = true;
    $$("[data-validate]", form).forEach((el) => { if (!validateField(el)) ok = false; });
    if (!ok) $(".field.invalid input, .field.invalid textarea", form)?.focus();
    return ok;
  }
  $$("[data-validate]", form).forEach((el) => el.addEventListener("blur", () => validateField(el)));

  function renderReview() {
    const t = TYPES[state.type];
    const d = Object.fromEntries(new FormData(form));
    $("#review").innerHTML = `
      <dl class="kv">
        <dt>Appointment</dt><dd>${esc(t.name)} · ${t.mins} min</dd>
        <dt>Date</dt><dd>${esc(state.date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}</dd>
        <dt>Time</dt><dd>${esc(state.time)} ${esc(SITE_CONFIG.timeZoneLabel)}</dd>
        <dt>Meeting</dt><dd>${esc(t.mode)}</dd>
        <dt>Name</dt><dd>${esc(d.name)}</dd>
        <dt>Email</dt><dd>${esc(d.email)}</dd>
        ${d.phone ? `<dt>Phone</dt><dd>${esc(d.phone)}</dd>` : ""}
        ${d.company ? `<dt>Company</dt><dd>${esc(d.company)}</dd>` : ""}
        ${d.notes ? `<dt>Notes</dt><dd>${esc(d.notes)}</dd>` : ""}
      </dl>`;
  }

  btnBack.addEventListener("click", () => go(Math.max(1, state.step - 1)));
  btnNext.addEventListener("click", async () => {
    if (state.step === 3 && !validateDetails()) return;
    if (state.step < 4) { go(state.step + 1); return; }
    // confirm
    btnNext.disabled = true; btnNext.textContent = "Confirming…";
    await sleep(prefersReduced ? 50 : 900);
    const d = Object.fromEntries(new FormData(form));
    const ref = refId("APPT-DEMO");
    let sent = false;
    if (!isDemo(SITE_CONFIG.appointmentEndpoint)) {
      try { const r = await fetch(SITE_CONFIG.appointmentEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: state.type, date: state.date.toISOString(), time: state.time, ...d }) }); sent = r.ok; } catch { sent = false; }
    }
    showConfirmation(ref, d, sent);
  });

  function showConfirmation(ref, d, sent) {
    const t = TYPES[state.type];
    $("#demo-scheduler").hidden = true;
    const box = $("#booking-confirm");
    box.hidden = false;
    $("#confirm-ref").textContent = ref;
    $("#confirm-msg").innerHTML = sent
      ? `Your request for <strong>${esc(t.name)}</strong> on <strong>${esc(state.date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }))} at ${esc(state.time)}</strong> was submitted.`
      : `This is a <strong>demonstration confirmation</strong>. No appointment was booked and no email was sent to ${esc(d.email)}. In production, the slot would be reserved in the calendar system and a confirmation with reschedule links would be emailed.`;
    $("#confirm-detail").innerHTML = `${esc(t.name)} · ${esc(state.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }))} · ${esc(state.time)} ${esc(SITE_CONFIG.timeZoneLabel)}`;
    $("#ics-download").onclick = () => downloadICS(t, d, ref);
    box.querySelector("h2").focus();
  }
  function downloadICS(t, d, ref) {
    const [hm, ap] = state.time.split(" ");
    let [h, m] = hm.split(":").map(Number);
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const start = new Date(state.date); start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + t.mins * 60000);
    const f = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aurivane Demo//EN", "BEGIN:VEVENT", `UID:${ref}@aurivane.example`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:[DEMO] ${t.name} — Aurivane`, `DESCRIPTION:Demonstration booking ${ref}. Not a real appointment.`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = `aurivane-demo-${ref}.ics`; a.click(); URL.revokeObjectURL(a.href);
  }
  $("#book-again")?.addEventListener("click", () => {
    state.type = null; state.date = null; state.time = null; form.reset();
    $$("input[name='appt-type']", root).forEach((r) => (r.checked = false));
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));
    $("#booking-confirm").hidden = true; $("#demo-scheduler").hidden = false;
    renderCalendar(); renderSlots(); updateSummary(); go(1);
  });

  // preselect type via ?type=
  const pre = new URLSearchParams(location.search).get("type");
  if (pre && TYPES[pre]) { const r = $(`input[value='${pre}']`, root); if (r) { r.checked = true; state.type = pre; } }
  renderCalendar(); renderSlots(); updateSummary(); go(1);
}

/* =========================================================================
   FORM VALIDATION (shared)
   ========================================================================= */
function validateField(el) {
  const field = el.closest(".field");
  const err = field ? $(".err", field) : null;
  const rule = el.dataset.validate;
  const v = (el.value || "").trim();
  let msg = "";
  if (el.required && !v) msg = "This field is required.";
  else if (v && rule === "email" && !EMAIL_RE.test(v)) msg = "Enter a valid email address, like name@company.com.";
  else if (v && rule === "phone" && !PHONE_RE.test(v)) msg = "Enter a valid phone number (digits, spaces, dashes, + only).";
  else if (rule === "name" && v && (v.length < 2 || v.length > 80)) msg = "Enter between 2 and 80 characters.";
  else if (rule === "min20" && v && v.length < 20) msg = `Please add a little more detail (${20 - v.length} more characters).`;
  else if (rule === "select" && el.required && !v) msg = "Please choose an option.";
  if (field) field.classList.toggle("invalid", !!msg);
  if (err) err.textContent = msg;
  el.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

/* =========================================================================
   CONTACT PAGE: lead capture + support center
   ========================================================================= */
function initContact() {
  const switcher = $("#mode-switch");
  if (!switcher) return;
  const panels = { project: $("#panel-project"), support: $("#panel-support") };
  const setMode = (m, focus) => {
    $$("button", switcher).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
    Object.entries(panels).forEach(([k, p]) => (p.hidden = k !== m));
    if (focus) history.replaceState(null, "", `#${m}`);
  };
  $$("button", switcher).forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode, true)));
  const fromHash = () => setMode(location.hash === "#support" ? "support" : "project");
  window.addEventListener("hashchange", fromHash);
  fromHash();
  initLeadForm();
  initSupport();
}

function initLeadForm() {
  const form = $("#lead-form");
  if (!form) return;
  $$("[data-validate]", form).forEach((el) => {
    el.addEventListener("blur", () => validateField(el));
    el.addEventListener("input", () => { if (el.closest(".field")?.classList.contains("invalid")) validateField(el); });
  });
  const reqLen = $("#requirements"), reqCount = $("#req-count");
  reqLen?.addEventListener("input", () => (reqCount.textContent = `${reqLen.value.length}/1500`));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let ok = true;
    $$("[data-validate]", form).forEach((el) => { if (!validateField(el)) ok = false; });
    // at least one service interest
    const svc = $$("input[name='services']:checked", form);
    const svcField = $("#services-field");
    svcField.classList.toggle("invalid", svc.length === 0);
    $(".err", svcField).textContent = svc.length ? "" : "Choose at least one service you're interested in.";
    if (!svc.length) ok = false;
    const consent = $("#consent");
    const cField = consent.closest(".field");
    cField.classList.toggle("invalid", !consent.checked);
    $(".err", cField).textContent = consent.checked ? "" : "Please confirm you understand this is a demonstration form.";
    if (!consent.checked) ok = false;
    if (!ok) {
      const first = $(".field.invalid input, .field.invalid select, .field.invalid textarea", form);
      first?.focus();
      toast("Please fix the highlighted fields.");
      return;
    }
    const btn = $("button[type='submit']", form);
    btn.disabled = true; btn.textContent = "Qualifying…";
    const fd = new FormData(form);
    const data = {
      name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || null, company: fd.get("company"),
      businessType: fd.get("businessType"), services: fd.getAll("services"), requirements: fd.get("requirements"),
      qualification: { timeline: fd.get("timeline"), budget: fd.get("budget"), teamSize: fd.get("teamSize"), decisionMaker: fd.get("decision"), currentTools: fd.getAll("tools") },
      source: "website-lead-form", submittedAt: new Date().toISOString()
    };
    const { score, tier, reasons } = scoreLead(data);
    data.leadScore = score; data.tier = tier;
    await sleep(prefersReduced ? 50 : 1000);
    let sent = false;
    if (!isDemo(SITE_CONFIG.leadEndpoint)) {
      try { const r = await fetch(SITE_CONFIG.leadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); sent = r.ok; } catch { sent = false; }
    }
    renderLeadResult(data, score, tier, reasons, sent);
    btn.disabled = false; btn.innerHTML = `Submit project request <span class="arrow" aria-hidden="true">→</span>`;
  });
  form.addEventListener("reset", () => setTimeout(() => { $$(".field", form).forEach((f) => f.classList.remove("invalid")); $$(".err", form).forEach((e) => (e.textContent = "")); if (reqCount) reqCount.textContent = "0/1500"; }, 0));
}

function scoreLead(d) {
  let s = 0; const reasons = [];
  const t = { "asap": 25, "1-3": 20, "3-6": 12, "exploring": 4 }[d.qualification.timeline] ?? 0;
  s += t; if (t >= 20) reasons.push("Near-term timeline");
  const b = { "25k+": 30, "10-25k": 25, "5-10k": 18, "under5k": 8, "unsure": 6 }[d.qualification.budget] ?? 0;
  s += b; if (b >= 18) reasons.push("Budget aligned with scope");
  if (d.qualification.decisionMaker === "yes") { s += 15; reasons.push("Speaking with a decision-maker"); }
  else if (d.qualification.decisionMaker === "shared") s += 8;
  s += Math.min(d.services.length * 4, 16); if (d.services.length >= 3) reasons.push("Multiple services of interest");
  s += { "1-10": 6, "11-50": 10, "51-200": 12, "200+": 14 }[d.qualification.teamSize] ?? 0;
  if ((d.requirements || "").length > 120) { s += 4; reasons.push("Detailed requirements provided"); }
  s = Math.min(100, s);
  const tier = s >= 70 ? "Hot" : s >= 45 ? "Warm" : "Nurture";
  if (!reasons.length) reasons.push("Early-stage enquiry — suited to an educational follow-up");
  return { score: s, tier, reasons };
}

function renderLeadResult(data, score, tier, reasons, sent) {
  const out = $("#lead-result");
  const route = tier === "Hot" ? "Route to senior consultant · follow up within 1 business hour" : tier === "Warm" ? "Route to sales queue · follow up same business day" : "Add to nurture email sequence · invite to webinar";
  out.hidden = false;
  out.innerHTML = `
    <div class="result-card" tabindex="-1">
      <div class="flex between"><h3 class="mb-0">${sent ? "Request received" : "Demonstration lead captured"}</h3><span class="badge ${sent ? "badge--sage" : "badge--demo"}">${sent ? "Sent to server" : "Not sent · demo only"}</span></div>
      <p class="mt-1">${sent ? "Thanks — the team will be in touch." : `Thanks, ${esc(data.name.split(" ")[0])}. <strong>Nothing was transmitted or stored.</strong> Below is what an automated lead pipeline would do with this submission.`}</p>
      <p class="small muted mb-0">Lead qualification score</p>
      <div class="score-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}" aria-label="Lead score"><i></i></div>
      <p class="flex between small"><span><strong style="color:var(--mist)">${score}/100</strong> · Tier: <strong style="color:var(--sage)">${tier}</strong></span><span class="muted">Rule-based demo scoring</span></p>
      <ul class="list-check">${reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="small"><strong style="color:var(--mist)">Automated next step:</strong> ${route}</p>
      <details class="mt-1"><summary class="small" style="cursor:pointer;color:var(--sage)">View the JSON payload a CRM integration would receive</summary><pre class="payload mt-1">${esc(JSON.stringify(data, null, 2))}</pre></details>
      <div class="flex mt-2"><a class="btn btn--primary btn--sm" href="appointments.html">Book a consultation</a><button type="button" class="btn btn--sm" id="lead-new">Submit another</button></div>
    </div>`;
  requestAnimationFrame(() => { $(".score-meter i", out).style.width = `${score}%`; });
  $(".result-card", out).focus();
  out.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  $("#lead-new").addEventListener("click", () => { $("#lead-form").reset(); out.hidden = true; $("#lead-form input").focus(); });
}

function initSupport() {
  const wrap = $("#support-center");
  if (!wrap) return;
  const cats = ["All", ...new Set(KB.map((k) => k.cat))];
  const catList = $("#cat-list"), faqEl = $("#faq-list"), search = $("#kb-search"), sugg = $("#kb-suggested"), suggList = $("#kb-suggested-list");
  let active = "All";

  catList.innerHTML = cats.map((c) => `<li><button type="button" data-cat="${esc(c)}" aria-pressed="${c === active}"><span>${esc(c)}</span><span class="count">${c === "All" ? KB.length : KB.filter((k) => k.cat === c).length}</span></button></li>`).join("");
  $$("button", catList).forEach((b) => b.addEventListener("click", () => { active = b.dataset.cat; $$("button", catList).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); render(); }));

  const highlight = (html, q) => {
    if (!q) return html;
    const words = q.split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!words.length) return html;
    const re = new RegExp(`(${words.join("|")})(?![^<]*>)`, "gi");
    return html.replace(re, "<mark>$1</mark>");
  };
  function render() {
    const q = search.value.trim().toLowerCase();
    let items = KB.filter((k) => active === "All" || k.cat === active);
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      items = items.map((k) => {
        const hay = `${k.q} ${k.a} ${k.k.join(" ")}`.toLowerCase();
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) + (k.q.toLowerCase().includes(q) ? 2 : 0);
        return { k, score };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.k);
    }
    $("#kb-count").textContent = `${items.length} article${items.length === 1 ? "" : "s"}`;
    faqEl.innerHTML = items.length
      ? items.map((k) => `<details id="kb-${k.id}"><summary>${highlight(esc(k.q), q)}</summary><div class="answer"><p>${highlight(k.a, q)}</p><div class="helpful"><span>Was this helpful?</span><button type="button" class="chip" data-help="yes">Yes</button><button type="button" class="chip" data-help="no">No</button></div></div></details>`).join("")
      : `<div class="no-results"><p>No articles match “${esc(search.value)}”.</p><a class="btn btn--sm" href="#escalate">Ask a human (demo)</a></div>`;
    $$("[data-help]", faqEl).forEach((b) => b.addEventListener("click", () => {
      const box = b.closest(".helpful");
      if (b.dataset.help === "yes") box.innerHTML = `<span style="color:var(--sage)">Thanks for the feedback (demo — not recorded).</span>`;
      else box.innerHTML = `<span>Sorry about that. <a href="#escalate">Escalate to a person (demo)</a></span>`;
    }));
    // suggested answers (top 3 as you type)
    if (q.length >= 3 && items.length) {
      sugg.hidden = false;
      suggList.innerHTML = items.slice(0, 3).map((k) => `<button type="button" class="chip" data-open="${k.id}">${esc(k.q)}</button>`).join("");
      $$("[data-open]", suggList).forEach((b) => b.addEventListener("click", () => { const d = $(`#kb-${b.dataset.open}`); d.open = true; d.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" }); $("summary", d).focus(); }));
    } else sugg.hidden = true;
  }
  let deb;
  search.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(render, 120); });
  render();

  // escalation
  const esc_form = $("#escalate-form");
  $$("[data-validate]", esc_form).forEach((el) => el.addEventListener("blur", () => validateField(el)));
  esc_form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let ok = true;
    $$("[data-validate]", esc_form).forEach((el) => { if (!validateField(el)) ok = false; });
    if (!ok) { $(".field.invalid input, .field.invalid select, .field.invalid textarea", esc_form)?.focus(); return; }
    const btn = $("button[type='submit']", esc_form); btn.disabled = true;
    const data = Object.fromEntries(new FormData(esc_form));
    const ref = refId("TKT-DEMO");
    let sent = false;
    if (!isDemo(SITE_CONFIG.supportEndpoint)) {
      try { const r = await fetch(SITE_CONFIG.supportEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, searchedFor: search.value }) }); sent = r.ok; } catch { sent = false; }
    }
    const out = $("#ticket-status");
    out.hidden = false;
    const stepsTxt = sent
      ? ["Ticket created", "Conversation context attached", "Routed to support queue", "Team notified"]
      : ["Ticket drafted (demo)", "Context attached: category, search terms, page", "Would route to: human support queue", "Would notify: on-call team member (simulated — no one was contacted)"];
    out.innerHTML = `<div class="flex between"><h3 class="mb-0">Escalation ${sent ? "submitted" : "simulation"}</h3><span class="badge ${sent ? "badge--sage" : "badge--demo"}">${esc(ref)}</span></div><ol class="ticket-steps">${stepsTxt.map((s) => `<li><i>✓</i>${esc(s)}</li>`).join("")}</ol><p class="small muted mt-1 mb-0">${sent ? "A team member will reply by email." : "In production, the ticket would be created in a helpdesk such as Zendesk, Freshdesk or Help Scout by a server-side function."}</p>`;
    const lis = $$("li", out);
    for (const li of lis) { await sleep(prefersReduced ? 10 : 550); li.classList.add("done"); }
    btn.disabled = false;
    esc_form.reset();
  });
}

/* =========================================================================
   AUTOMATION PAGE: integration tiles + workflow simulator
   ========================================================================= */
function initAutomation() {
  const tiles = $$(".int-tile");
  tiles.forEach((t) => t.addEventListener("click", () => {
    const on = t.getAttribute("aria-pressed") !== "true";
    t.setAttribute("aria-pressed", String(on));
    $(".state", t).textContent = on ? "Included in plan" : "Not connected · demo";
    const n = $$(".int-tile[aria-pressed='true']").length;
    const out = $("#int-count"); if (out) out.textContent = n;
  }));

  const runBtn = $("#run-flow");
  if (!runBtn) return;
  const trig = $("#flow-trigger"), canvas = $("#flow-canvas"), log = $("#run-log");
  const ACTIONS = {
    qualify: { label: "Qualify with scoring rules", log: "Lead scored 74/100 → tier Warm" },
    crm: { label: "Create / update CRM contact", log: "CRM contact upserted · pipeline stage: New lead" },
    notify: { label: "Notify team in Slack / Teams", log: "Message posted to #new-leads with summary" },
    email: { label: "Send confirmation email", log: "Confirmation email queued to visitor" },
    task: { label: "Create follow-up task", log: "Follow-up task due next business day" },
    calendar: { label: "Hold calendar slot", log: "Tentative hold placed on team calendar" }
  };
  const TRIGGERS = { lead: "New website lead submitted", booking: "Appointment requested", escalation: "Chat escalated to a human" };
  function drawCanvas() {
    const chosen = $$("input[name='flow-action']:checked").map((i) => i.value);
    canvas.innerHTML = `<div class="flow-node trigger"><span class="k">Trigger</span>${esc(TRIGGERS[trig.value])}</div>` +
      chosen.map((a) => `<div class="flow-link" aria-hidden="true"></div><div class="flow-node" data-action="${a}"><span class="k">Action</span>${esc(ACTIONS[a].label)}</div>`).join("");
    runBtn.disabled = chosen.length === 0;
  }
  trig.addEventListener("change", drawCanvas);
  $$("input[name='flow-action']").forEach((i) => i.addEventListener("change", drawCanvas));
  drawCanvas();

  const line = (txt, cls = "") => { const d = document.createElement("div"); d.innerHTML = `<span class="ts">${new Date().toLocaleTimeString([], { hour12: false })}</span><span class="${cls}">${txt}</span>`; log.appendChild(d); log.scrollTop = log.scrollHeight; };
  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    log.innerHTML = "";
    $$(".flow-node", canvas).forEach((n) => n.classList.remove("running", "done"));
    line("SIMULATION — no external systems are contacted", "warn");
    line(`Trigger fired: ${esc(TRIGGERS[trig.value])}`);
    $(".flow-node.trigger", canvas).classList.add("done");
    for (const node of $$(".flow-node[data-action]", canvas)) {
      node.classList.add("running");
      await sleep(prefersReduced ? 30 : 700);
      node.classList.remove("running"); node.classList.add("done");
      line(`✓ ${esc(ACTIONS[node.dataset.action].log)}`, "ok");
    }
    line("Workflow complete · 0 errors · simulated run", "ok");
    runBtn.disabled = false;
  });
}

/* =========================================================================
   BOOT
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initGlobal();
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "chatbot") initChatbot();
  if (page === "receptionist") initReceptionist();
  if (page === "appointments") initAppointments();
  if (page === "contact") initContact();
  if (page === "automation") initAutomation();
});
