# EstateVista — Real Estate CRM & Business Management Platform

Full-stack implementation of the EstateVista PRD: a lead-management CRM, property
inventory system, rule-based property-to-lead matching engine, activity/follow-up
tracker, role-based access control (Admin / Manager / Agent / Telecaller), and an
analytics dashboard — matching the EstateVista brand UI (purple `#6E56CF`, Manrope
typeface, sidebar + top bar dashboard layout).

## Stack

| Layer    | Tech                                             |
|----------|--------------------------------------------------|
| Frontend | React (Vite) + Tailwind CSS + Recharts + Axios    |
| Backend  | Node.js + Express + Mongoose (MongoDB)            |
| Auth     | JWT access + refresh tokens, RBAC middleware      |

## Project structure

```
estatevista/
├── backend/         Express API (auth, leads, properties, follow-ups, reports)
│   └── src/
│       ├── config/       MongoDB connection
│       ├── models/       User, Lead, Property, FollowUp (Mongoose schemas)
│       ├── controllers/  Route handlers
│       ├── middleware/   JWT auth guard, RBAC scoping, error handler
│       ├── routes/       Express routers
│       ├── utils/        JWT helpers, rule-based matching engine
│       └── seed/         Demo data seed script
└── frontend/         React (Vite) SPA
    └── src/
        ├── api/          Axios client with auto token-refresh
        ├── context/      Auth context/provider
        ├── components/   Sidebar, TopBar, Layout, cards, drawers, modals
        └── pages/         Login, Dashboard, Leads, Properties, Team, Calendar, Reports, Settings
```

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env     # edit MONGO_URI and JWT secrets as needed
npm install
npm run seed              # populates demo users, leads, and properties
npm run dev                # starts the API on http://localhost:5000
```

You'll need a running MongoDB instance. The default `.env.example` points at
`mongodb://127.0.0.1:27017/estatevista` — either run MongoDB locally or point
`MONGO_URI` at MongoDB Atlas.

Demo logins created by `npm run seed` (password for all: `Password123`):

| Role       | Email                      |
|------------|-----------------------------|
| Admin      | admin@estatevista.com       |
| Manager    | manager@estatevista.com     |
| Agent      | rohan@estatevista.com       |
| Agent      | sneha@estatevista.com       |
| Telecaller | karan@estatevista.com       |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so run
the backend first. Log in with any of the demo accounts above.

## What's implemented (Phase 1 — MVP, per the PRD roadmap)

- JWT auth with refresh-token rotation, RBAC enforced at the API layer (not just hidden in the UI)
- **Leads** — full CRUD: create, edit (all fields incl. requirement/notes), delete (Admin/Manager),
  Kanban + table views, drag-and-drop stage transitions with mandatory next-follow-up date, mandatory
  lost-reason capture, owner reassignment (Admin/Manager), de-duplication by phone
- **Properties** — full CRUD: create, edit (specs, pricing, location, ownership, status), soft-delete
  ("Withdraw Listing") plus permanent hard-delete (Admin), photo gallery add/remove
- **Team** — Admin can create members, edit any member's profile/role, deactivate/reactivate accounts
- **My Account** — every user can edit their own name/avatar and change their password from Settings
- Rule-based property-to-lead matching engine (budget, BHK, property type, locality) surfaced on
  both the lead drawer and the property detail page
- Activity/follow-up timeline per lead, site-visit scheduling + geo-check-in endpoints
- Dashboard, funnel, agent leaderboard, revenue forecast, and source-effectiveness reports
- Role-scoped Settings page (pipeline/SLA reference, profile, password)

## What's stubbed for later phases

Per the PRD roadmap, portal/Facebook Lead Ads webhooks (`/api/webhooks/leads/:source`), WhatsApp/SMS
integration, SLA breach automation, and AI-assisted scoring are Phase 2/3 items. The webhook route
and matching engine are structured so they can be extended without breaking the existing contract.
