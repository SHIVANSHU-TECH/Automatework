# AI Proposal Generator — Automation-Only

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Playwright-1.46-45ba4b?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

> **An end-to-end AI-powered platform that crawls any client website, deeply analyzes it for technology, SEO, accessibility, and performance, then auto-generates a professional sales proposal exportable as PDF, DOCX, HTML, or Markdown — all in minutes.**

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Purpose](#purpose)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Full Data Flow Diagram](#full-data-flow-diagram)
- [Database Schema](#database-schema)
- [Firebase Integration](#firebase-integration)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Known Issues & Notes](#known-issues--notes)

---

## Problem Statement

Sales and development agencies spend **hours manually researching a prospective client's website** before they can write a proposal. This involves:

- Checking what technologies the site uses
- Identifying SEO gaps, accessibility violations, and performance bottlenecks
- Manually writing executive summaries, scope, timeline, and pricing sections
- Formatting and exporting the document in the client's preferred format

This process is slow, inconsistent across team members, and rarely data-driven.

---

## Solution

**AI Proposal Generator** automates the entire research-to-proposal workflow:

1. **Enter a URL** — the analyzer crawls the site, extracts all meaningful data using Cheerio and Playwright
2. **AI Analysis** — Groq (via API key) generates strategic recommendations covering UX, SEO, security, performance, automation opportunities, and estimated costs
3. **Proposal Assembly** — all sections (executive summary, scope, timeline, pricing, maintenance plan, case studies, terms) are populated and stored
4. **Export** — one-click export to PDF, DOCX, HTML, or Markdown

The platform also includes a lightweight **CRM** to track clients and link analyses to proposals, plus a **Screenshot Engine** for visual documentation of client sites.

---

## Purpose

This project is purpose-built for **web/software agencies and freelancers** who want to:

- Drastically cut down the time between "prospect found" and "proposal sent"
- Produce consistent, professional, data-backed proposals every time
- Keep all client data, analyses, and proposals in one place
- Export polished documents without any manual formatting

---

## Key Features

| Feature | Description |
|---|---|
| 🌐 **Website Analyzer** | Crawls any URL and extracts tech stack, CMS, hosting, analytics, social links, contact info, SEO issues, accessibility violations, broken links, content sections |
| 🤖 **AI Analysis (Groq)** | Generates 20-field AI report: strengths, weaknesses, recommendations for UI/UX/SEO/performance/security/accessibility, automation opportunities, cost estimates |
| 📄 **Proposal Generator** | Full CRUD for proposals with 19 content sections — auto-populated from analysis data |
| 📸 **Screenshot Engine** | Playwright-powered multi-viewport screenshots (desktop / tablet / mobile) |
| 📦 **Multi-format Export** | Export proposals to PDF (A4), DOCX, HTML, or Markdown |
| 👥 **CRM** | Manage clients, link websites to proposals, track status |
| 📊 **Dashboard** | Overview of total clients, proposals, pending reviews, and exports |
| 🔐 **Authentication** | JWT-based register/login with bcrypt password hashing |
| 📝 **Structured Logging** | JSON log entries with levels DEBUG/INFO/WARN/ERROR/SECURITY |
| 🔥 **Firebase Realtime DB** | Cloud persistence for synced data across sessions |


---

## Tech Stack

### Backend — `apps/api`

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js + TypeScript | TS 5.7 | Server runtime |
| Framework | Express.js | 4.18 | HTTP server & routing |
| Database | SQLite via better-sqlite3 | 8.4 | Local relational storage (WAL mode) |
| Cloud DB | Firebase Realtime Database | — | Synced/cloud data persistence |
| AI | Groq API | — | LLM-powered analysis & recommendations |
| Auth | bcrypt + jsonwebtoken | — | Password hashing + JWT (8h expiry) |
| Browser | Playwright (Chromium) | 1.46 | Headless screenshots |
| Scraping | Axios + Cheerio | — | HTTP crawling + HTML parsing |
| Reports | docx + html-pdf-node | — | Word and PDF generation |
| Validation | Zod | 3.22 | Schema validation |
| Logging | Custom file logger | — | JSON logs to `logs/application.log` |

### Frontend — `apps/web`

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 15.2 | App Router, SSR/CSR |
| UI | React | 19.0 | Component model |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Icons | lucide-react | 0.450 | SVG icon set |
| Charts | chart.js | 4.4 | Dashboard visualizations |
| Utilities | clsx + tailwind-merge | — | Class merging |

### Shared Packages

| Package | Alias | Contents |
|---|---|---|
| `packages/shared` | `@shared` | `UUID`, `DateString`, `ProposalStatus`, `ExportFormat` types |
| `packages/domain` | `@domain` | Entity types (`Client`, `Proposal`, `WebsiteAnalysis`, `AiAnalysis`), repository interfaces |
| `packages/ui` | `@ui` | `Button`, `Card`, `Heading` components + `cn()` utility |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser / Client                   │
│              Next.js 15 (App Router)                │
│   /  /dashboard  /website-analyzer  /proposals  /crm│
└─────────────────────┬───────────────────────────────┘
                      │  HTTP (fetchJson)
                      │  NEXT_PUBLIC_API_URL
                      ▼
┌─────────────────────────────────────────────────────┐
│              Express.js API  :4000                  │
│                                                     │
│  /api/auth          → auth.controller               │
│  /api/website-analyzer → website-analyzer.controller│
│  /api/proposals     → proposal.controller           │
│  /api/crm           → crm.controller                │
│  /api/reports       → report.controller             │
│  /api/ai            → ai.controller                 │
│  /api/screenshots   → screenshot.controller         │
│  /reports/files/*   → static (data/reports/)        │
│  /screenshots/files/* → static (data/screenshots/)  │
└──────┬──────┬──────┬──────┬──────┬──────────────────┘
       │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼
  SQLite  Firebase  Groq  Playwright  File System
  (local)  (cloud) (AI)  (browser)   (reports/
   .db                               screenshots)
```

---

## Full Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                                  │
└──────────────────────────────────────────────────────────────────────┘

 STEP 1: WEBSITE ANALYSIS
 ─────────────────────────
 User enters URL in /website-analyzer
         │
         ▼
 POST /api/website-analyzer/analyze
         │
         ├─► validateWebsiteUrl()
         │       └─ checks http:// or https://
         │
         ├─► fetchWebsiteHtml()  [Axios, 15s timeout, 5 redirects]
         │       └─ returns raw HTML + final URL + status code
         │
         └─► inspectWebsite()  [Cheerio + DNS + Axios HEAD]
                 │
                 ├─ detectFramework()    → React / Next.js / Vue / Angular / WordPress
                 ├─ detectCms()          → WordPress / Shopify / Drupal / Joomla
                 ├─ detectHosting()      → AWS / GCP / Azure (via DNS IP prefix)
                 ├─ detectTechnologies() → full tech list from script/link/meta tags
                 ├─ collectAnalytics()   → Google Analytics / Hotjar / Segment / Mixpanel
                 ├─ collectSocialLinks() → Facebook / Twitter / LinkedIn / Instagram / YouTube
                 ├─ collectContact()     → emails (regex) + phones (regex) + mailto/tel hrefs
                 ├─ detectSeoIssues()    → missing title / meta description / H1
                 ├─ detectA11yIssues()   → missing lang / alt text / form labels
                 ├─ gatherBrokenLinks()  → HEAD 10 internal links, flag 4xx/5xx
                 ├─ estimatePerformance()→ score from HTML size + asset count
                 ├─ detectSsl()          → url.startsWith('https://')
                 ├─ detectMobile()       → <meta name="viewport"> present?
                 ├─ detectCategory()     → E-commerce / SaaS / Healthcare / Finance / Education
                 │                          / Real Estate / Professional Services
                 └─► extractContent()  [Cheerio selectors]
                         ├─ headings (h1–h6)
                         ├─ paragraphs
                         ├─ services (class + keyword match)
                         ├─ testimonials (blockquote + class match)
                         ├─ pricing (class + keyword match)
                         ├─ forms (full form text)
                         ├─ CTAs (action-keyword links/buttons)
                         ├─ navigation items
                         ├─ footer items
                         └─ metadata (<head> meta tags + title)

         │
         ▼
  (optional) Save to SQLite: website_analyses table
         │
         ▼
  Return WebsiteAnalyzerResponse → frontend displays JSON


 STEP 2: ADD CLIENT TO CRM
 ──────────────────────────
 User fills CRM form → POST /api/crm/clients
         │
         ▼
  INSERT into SQLite: clients table
  (name, websiteUrl, businessCategory, contactEmail, phone, socialLinks)
         │
         ▼
  Return clientId → link to analyses + proposals


 STEP 3: AI ANALYSIS
 ────────────────────
 POST /api/ai  { prompt: "<full analysis data>", model?: "..." }
         │
         ▼
  Groq API → LLM inference
         │
         ▼
  Returns 20-field AI report:
    business summary, company overview, website strengths/weaknesses,
    technical / UI / UX / SEO / performance / security / accessibility
    recommendations, automation opportunities, suggested features,
    suggested tech stack, estimated timeline / team size / cost,
    upselling opportunities
         │
         ▼
  Save to SQLite: ai_analyses table (linked to proposal_id)


 STEP 4: PROPOSAL MANAGEMENT
 ─────────────────────────────
 POST /api/proposals  → create draft (19 content fields)
 PUT  /api/proposals/:id → update any field
 GET  /api/proposals  → list all proposals
 GET  /api/proposals/:id → single proposal
         │
         ▼
  SQLite: proposals table
  status lifecycle: draft → generated → reviewed → exported


 STEP 5: SCREENSHOT CAPTURE
 ───────────────────────────
 POST /api/screenshots  { url, mode: "desktop"|"tablet"|"mobile" }
         │
         ▼
  Playwright Chromium (headless)
  Viewport:  desktop=1280×800  tablet=768×1024  mobile=375×812
  Wait: networkidle (20s timeout)
         │
         ▼
  Save PNG → data/screenshots/<uuid>-<mode>.png
  Return downloadUrl: /screenshots/files/<filename>


 STEP 6: EXPORT REPORT
 ───────────────────────
 POST /api/reports/export  { proposalId, format }
         │
         ▼
  getProposalById() → fetch all 19 sections
         │
         ├─ format="html"     → styled HTML document → .html file
         ├─ format="markdown" → ## sections → .md file
         ├─ format="pdf"      → HTML → html-pdf-node (A4) → .pdf file
         └─ format="docx"     → docx library → structured Word doc → .docx file
         │
         ▼
  Save to data/reports/<proposalId>-<timestamp>.<format>
  Return { filename, downloadUrl } → user downloads file
```


---

## Database Schema

The app uses **SQLite** (via `better-sqlite3`) in WAL mode with foreign key enforcement for local persistence, and **Firebase Realtime Database** for cloud/synced storage.

### SQLite Tables

```sql
-- Users (auth)
CREATE TABLE users (
  user_id       TEXT PRIMARY KEY,   -- UUID v4
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,       -- bcrypt, 10 rounds
  created_at    TEXT NOT NULL        -- ISO 8601
);

-- CRM Clients
CREATE TABLE clients (
  client_id          TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  website_url        TEXT NOT NULL,
  business_category  TEXT,
  contact_email      TEXT,
  contact_phone      TEXT,
  social_links       TEXT,           -- JSON array
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- Website Analyses
CREATE TABLE website_analyses (
  analysis_id          TEXT PRIMARY KEY,
  client_id            TEXT NOT NULL,     -- FK → clients
  website_url          TEXT NOT NULL,
  framework            TEXT,
  cms                  TEXT,
  hosting              TEXT,
  analytics            TEXT,              -- JSON array
  performance_score    REAL,
  is_mobile_responsive INTEGER,           -- 0 or 1
  broken_links         TEXT,              -- JSON array
  accessibility_issues TEXT,              -- JSON array
  seo_issues           TEXT,              -- JSON array
  ssl_valid            INTEGER,
  contact_information  TEXT,              -- JSON array
  social_links         TEXT,              -- JSON array
  business_category    TEXT,
  detected_technologies TEXT,             -- JSON array
  headings             TEXT,              -- JSON array
  paragraphs           TEXT,              -- JSON array
  services             TEXT,              -- JSON array
  testimonials         TEXT,              -- JSON array
  pricing_items        TEXT,              -- JSON array
  forms                TEXT,              -- JSON array
  ctas                 TEXT,              -- JSON array
  navigation_items     TEXT,              -- JSON array
  footer_items         TEXT,              -- JSON array
  metadata             TEXT,              -- JSON object
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  FOREIGN KEY(client_id) REFERENCES clients(client_id)
);

-- Proposals
CREATE TABLE proposals (
  proposal_id       TEXT PRIMARY KEY,
  client_id         TEXT NOT NULL,      -- FK → clients
  title             TEXT NOT NULL,
  status            TEXT NOT NULL,      -- draft|generated|reviewed|exported
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  submitted_at      TEXT,
  version           INTEGER NOT NULL,
  executive_summary TEXT,
  scope             TEXT,
  timeline          TEXT,
  deliverables      TEXT,
  pricing           TEXT,
  maintenance_plan  TEXT,
  why_choose_us     TEXT,
  case_studies      TEXT,
  terms             TEXT,
  signature         TEXT,
  metadata          TEXT,               -- JSON object
  FOREIGN KEY(client_id) REFERENCES clients(client_id)
);

-- AI Analyses
CREATE TABLE ai_analyses (
  ai_analysis_id               TEXT PRIMARY KEY,
  proposal_id                  TEXT NOT NULL,   -- FK → proposals
  business_summary             TEXT,
  company_overview             TEXT,
  website_strengths            TEXT,
  website_weaknesses           TEXT,
  business_opportunities       TEXT,
  technical_recommendations    TEXT,
  ui_recommendations           TEXT,
  ux_recommendations           TEXT,
  seo_recommendations          TEXT,
  performance_recommendations  TEXT,
  security_recommendations     TEXT,
  accessibility_recommendations TEXT,
  automation_opportunities     TEXT,
  suggested_features           TEXT,
  suggested_tech_stack         TEXT,
  estimated_timeline           TEXT,
  estimated_team_size          TEXT,
  estimated_cost               TEXT,
  upselling_opportunities      TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY(proposal_id) REFERENCES proposals(proposal_id)
);

-- Audit Logs
CREATE TABLE audit_logs (
  log_id      TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  timestamp   TEXT NOT NULL,
  user_id     TEXT,
  details     TEXT
);
```

### Entity Relationship Diagram

```
users
  │
  └──(created_by)──► clients
                         │
                         ├──► website_analyses
                         │
                         └──► proposals
                                  │
                                  └──► ai_analyses

audit_logs (standalone — logs any event/entity)
```

---

## Firebase Integration

The project integrates **Firebase Realtime Database** for cloud-synced data alongside the local SQLite store.

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey:            "AIzaSyDYJdbz01UYSz3MNKG9G04UtQDkgWMWCYk",
  authDomain:        "trainerform-52f85.firebaseapp.com",
  databaseURL:       "https://trainerform-52f85-default-rtdb.firebaseio.com",
  projectId:         "trainerform-52f85",
  storageBucket:     "trainerform-52f85.firebasestorage.app",
  messagingSenderId: "226297252007",
  appId:             "1:226297252007:web:85ec7514b492547c373382"
};
```

**Firebase is used for:**
- Real-time syncing of client/proposal data across multiple sessions or devices
- Cloud persistence as a backup layer alongside the local SQLite database
- Potential multi-user access without requiring a hosted database server

**Setup:** Install the Firebase SDK and call `initializeApp(firebaseConfig)` in your database module. Use `getDatabase()` to read/write to the Realtime Database.

```bash
npm install firebase
```

---

## Project Structure

```
Automation-Only/
│
├── apps/
│   ├── api/                          # Express.js REST API
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point — registers all routes
│   │   │   ├── controllers/          # Route handlers (active)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── website-analyzer.controller.ts
│   │   │   │   ├── proposal.controller.ts
│   │   │   │   ├── crm.controller.ts
│   │   │   │   ├── report.controller.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   └── screenshot.controller.ts
│   │   │   └── modules/              # Feature modules (services + logic)
│   │   │       ├── ai/
│   │   │       │   └── ai.service.ts          # Groq API integration
│   │   │       ├── auth/
│   │   │       │   ├── auth.service.ts        # bcrypt + JWT
│   │   │       │   └── auth.controller.ts
│   │   │       ├── content-extraction/
│   │   │       │   └── content.service.ts     # Cheerio content parser
│   │   │       ├── crm/
│   │   │       │   ├── crm.service.ts
│   │   │       │   └── crm.controller.ts
│   │   │       ├── database/
│   │   │       │   └── database.ts            # SQLite init + schema
│   │   │       ├── logging/
│   │   │       │   └── logger.ts              # JSON file logger
│   │   │       ├── proposal-generator/
│   │   │       │   ├── proposal.service.ts    # Full CRUD for proposals
│   │   │       │   └── types.ts
│   │   │       ├── report-generator/
│   │   │       │   └── report.service.ts      # PDF/DOCX/HTML/MD export
│   │   │       ├── screenshot-engine/
│   │   │       │   └── screenshot.service.ts  # Playwright screenshots
│   │   │       └── website-analyzer/
│   │   │           ├── website-analyzer.service.ts  # Pipeline orchestrator
│   │   │           ├── types.ts
│   │   │           ├── analysis/
│   │   │           │   └── inspector.service.ts     # Deep HTML inspection
│   │   │           └── scraper/
│   │   │               ├── crawler.service.ts       # Axios HTTP fetcher
│   │   │               └── validation.service.ts    # URL validation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Next.js 15 frontend
│       ├── app/
│       │   ├── layout.tsx            # Root layout + metadata
│       │   ├── page.tsx              # Home / landing page
│       │   ├── dashboard/page.tsx    # Stats dashboard
│       │   ├── website-analyzer/page.tsx
│       │   ├── proposals/page.tsx
│       │   └── crm/page.tsx
│       ├── src/
│       │   ├── components/           # App-specific components
│       │   ├── features/             # Feature-scoped logic
│       │   ├── hooks/                # Custom React hooks
│       │   └── lib/
│       │       └── api.ts            # fetchJson() API client
│       ├── styles/
│       │   └── globals.css           # Tailwind base styles
│       ├── package.json
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── packages/
│   ├── domain/                       # @domain — entities + repository interfaces
│   │   └── src/
│   │       └── entities.ts
│   ├── shared/                       # @shared — primitive types
│   │   └── src/
│   │       └── types.ts
│   └── ui/                           # @ui — shared React component library
│       └── src/
│           └── components/
│               ├── button.tsx
│               └── card.tsx
│
├── data/                             # Runtime data (auto-created)
│   ├── app.db                        # SQLite database
│   ├── reports/                      # Generated proposal files
│   └── screenshots/                  # Captured site screenshots
│
├── logs/                             # Runtime logs (auto-created)
│   └── application.log
│
├── .env.example                      # Environment variable template
├── .gitignore
├── package.json                      # Monorepo root + npm workspaces
└── README.md
```


---

## API Reference

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ email, password }` | `{ token }` (JWT) |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ token }` (JWT) |

### Website Analyzer

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/website-analyzer/analyze` | `{ websiteUrl, clientId? }` | `WebsiteAnalyzerResponse` |

**WebsiteAnalyzerResponse fields:** `framework`, `cms`, `hosting`, `analytics[]`, `performanceScore`, `isMobileResponsive`, `brokenLinks[]`, `accessibilityIssues[]`, `seoIssues[]`, `sslValid`, `contactInformation[]`, `socialLinks[]`, `businessCategory`, `detectedTechnologies[]`, `contentExtraction{ headings, paragraphs, services, testimonials, pricing, forms, ctas, navigation, footer, metadata }`

### Proposals

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/proposals` | — | `{ proposals[] }` |
| `GET` | `/api/proposals/:id` | — | `{ proposal }` |
| `POST` | `/api/proposals` | `CreateProposalRequest` | `{ proposal }` |
| `PUT` | `/api/proposals/:id` | `Partial<Proposal>` | `{ proposal }` |

**Proposal status lifecycle:** `draft` → `generated` → `reviewed` → `exported`

### CRM

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/crm` | — | `{ clients[] }` |
| `POST` | `/api/crm/clients` | `{ name, websiteUrl, businessCategory, contactEmail, contactPhone, socialLinks }` | `{ clientId }` |
| `GET` | `/api/crm/proposals` | — | `{ proposals[] }` |

### Reports / Export

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/reports/export` | `{ proposalId, format }` | `{ filename, downloadUrl }` |

**Supported formats:** `pdf` · `docx` · `html` · `markdown`

### AI Analysis

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/ai` | `{ prompt, model? }` | `{ raw, sections: { aiAnalysis } }` |

### Screenshots

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/screenshots` | `{ url, mode? }` | `{ path, mode, downloadUrl }` |

**Modes:** `desktop` (1280×800) · `tablet` (768×1024) · `mobile` (375×812)

### Static Files

| Path | Serves |
|---|---|
| `GET /reports/files/:filename` | Generated proposal files |
| `GET /screenshots/files/:filename` | Captured screenshots |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Groq API key for AI analysis (LLM inference)
Groq_api_key=gsk_your_groq_api_key_here

# Local SQLite database file path
DATABASE_URL=sqlite:./data/app.db

# Application mode
NODE_ENV=development

# JWT signing secret — use a long random string in production
APP_AUTH_SECRET=replace-with-secure-value

# Frontend API base URL (used by Next.js to call the Express API)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Note:** The `OPENAI_API_KEY` line in `.env.example` is a leftover placeholder. This project uses the **Groq API** (`Groq_api_key`) for all AI inference. See [Known Issues](#known-issues--notes) for the code change needed.

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20.x |
| npm | 9.x |
| Playwright browsers | Chromium (see below) |

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Automation-Only
npm install
```

### 2. Install Playwright Chromium

The screenshot engine requires the Chromium binary:

```bash
npx playwright install chromium
```

### 3. Configure environment

```bash
copy .env.example .env
# Edit .env and set your Groq_api_key and APP_AUTH_SECRET
```

### 4. Start development servers

Run each in a separate terminal:

```bash
# Terminal 1 — API (hot reload, port 4000)
npm run dev:api

# Terminal 2 — Web (Next.js dev, port 3000)
npm run dev:web
```

The SQLite database and all required directories (`data/`, `logs/`) are created automatically on first run.

### 5. Open the app

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

---

## Development Workflow

```
npm run dev:api      # Start API with hot reload (ts-node-dev)
npm run dev:web      # Start Next.js dev server

npm run build        # Build both apps for production
npm run start        # Start both apps in production mode

npm run lint         # ESLint across all TS/TSX files
npm run format       # Prettier — formats all .ts/.tsx/.js/.json/.md

npm run test         # Run unit tests in both apps
npm run test:e2e     # Playwright end-to-end tests
```

### Adding a new feature

1. Add domain types to `packages/domain/src/entities.ts`
2. Add any new primitive types to `packages/shared/src/types.ts`
3. Create the service module under `apps/api/src/modules/<feature>/`
4. Create the Express router in `apps/api/src/controllers/<feature>.controller.ts`
5. Register the router in `apps/api/src/index.ts`
6. Add the frontend page under `apps/web/app/<feature>/page.tsx`
7. Add UI components to `packages/ui/src/components/` if reusable

---

## Known Issues & Notes

### 1. `ai.service.ts` references OpenAI SDK — needs update to Groq

The file `apps/api/src/modules/ai/ai.service.ts` currently imports from the `openai` package and uses `OPENAI_API_KEY`. Since this project uses **Groq**, this needs to be updated:

```typescript
// Replace the current implementation with Groq SDK
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.Groq_api_key });

export const generateAiAnalysis = async (request: AiRequest): Promise<AiResponse> => {
  const completion = await client.chat.completions.create({
    model: request.model ?? 'llama3-8b-8192',
    messages: [{ role: 'user', content: request.prompt }],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  return { raw: text, sections: { aiAnalysis: text } };
};
```

Install the Groq SDK:
```bash
npm install groq-sdk --workspace apps/api
```

### 2. JWT middleware is not applied

Auth tokens are issued at `/api/auth/register` and `/api/auth/login`, but no JWT verification middleware is applied to the other routes. All API endpoints are currently open. Add a middleware to verify the `Authorization: Bearer <token>` header on protected routes before deploying to production.

### 3. Duplicate controller files

There are controller files in both `apps/api/src/controllers/` and `apps/api/src/modules/*/`. Only the files in `src/controllers/` are imported by `src/index.ts`. The module-level controllers are not registered and are effectively dead code.

### 4. CRM service is a stub

`apps/api/src/modules/crm/crm.service.ts` returns empty arrays. All actual CRM database logic lives directly in `apps/api/src/controllers/crm.controller.ts`. The service file can be removed or properly implemented.

### 5. Playwright requires Chromium binary

Running `POST /api/screenshots` will fail if Chromium is not installed. Always run `npx playwright install chromium` after `npm install`.

### 6. `data/` and `logs/` directories

These are auto-created at runtime by the SQLite module and the logger. They are excluded from version control via `.gitignore`. Do not commit the `app.db` file or any generated reports/screenshots.

### 7. Performance score is an estimate

The `performanceScore` returned by the website analyzer is a rough heuristic based on HTML file size and asset count — not a real Lighthouse score. For production use, integrate the Google PageSpeed Insights API.

### 8. Package names are not valid npm scoped names

The internal packages are named `@domain`, `@shared`, and `@ui` in their `package.json` files. npm requires scoped packages to follow the `@scope/name` pattern. This causes `npm install` to fail at the workspace resolution step. The packages are still usable because they are resolved entirely via **TypeScript path aliases** in `tsconfig.base.json` and are never actually published to or fetched from npm.

**Workaround:** Run install with `--ignore-scripts` or rename the packages to valid names like `@app/domain`, `@app/shared`, `@app/ui` in their respective `package.json` files and update the root `package.json` `workspaces` array accordingly.

---

## License

This project is private. All rights reserved.

---

<p align="center">Built with TypeScript · Next.js · Express · SQLite · Firebase · Groq AI</p>
