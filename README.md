# MediCore HMS — Frontend

React + Vite + Tailwind CSS frontend for the Hospital Management System backend.

## Stack
Vite · React 19 · React Router · Tailwind CSS v4 · Axios · Recharts · lucide-react

## Setup

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your running backend
npm run dev                # http://localhost:5173
```

Build for production:
```bash
npm run build               # outputs to dist/
npm run preview             # preview the production build locally
```

Make sure the Flask backend is running (see the backend's own README) and that
its `CORS_ORIGINS` includes this app's URL (`http://localhost:5173` by default).

## How it's put together

```
src/
├── api/client.js         # axios instance: attaches JWT, auto-refreshes on 401
├── context/AuthContext.jsx  # login/register/logout + current user & role
├── config/nav.js         # sidebar nav, grouped, filtered by role
├── components/
│   ├── layout/            # Sidebar, Topbar, Layout
│   ├── ui/                 # Button, Input, Modal, DataTable, Badge, StatCard,
│   │                        # Pagination, Toast, ResourceForm, CrudPage...
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Login.jsx, Register.jsx, AuthLayout.jsx
│   ├── Dashboard.jsx      # stat cards + charts (admin only, matches backend RBAC)
│   └── modules/           # one file per backend module
└── App.jsx                 # all routes, wrapped in AuthProvider + ToastProvider
```

### The `CrudPage` pattern
Most modules (Departments, Patients, Users, Doctors, Notifications, Audit
Logs, and the medicine list inside Pharmacy) are just a **config object**
passed to `<CrudPage config={...} />` — it handles the list, search,
pagination, add/edit modal, and delete confirmation for you. See
`src/pages/modules/Departments.jsx` for the simplest example.

Modules with actions beyond plain CRUD (approve/reject/reschedule
appointments, file uploads for medical records & lab reports, multi-item
prescriptions and invoices, bed admit/discharge, emergency triage, reports
with date ranges) have their own hand-written page in `pages/modules/`, built
from the same shared UI components for a consistent look.

### Auth & roles
- JWTs are stored in `localStorage` and attached to every request automatically.
- If a request gets a `401`, the client silently uses the refresh token to get
  a new access token and retries — the user is only logged out if the refresh
  itself fails.
- The sidebar and each page's create/edit/delete buttons check `role` against
  the same role list your backend's `@role_required(...)` decorators expect,
  so the UI won't offer actions the API would reject anyway (the API is still
  the real enforcement point).

### Design
Clinical teal (`#0C6B67`) primary with a warm amber accent, on a cool
light-gray canvas — built for a data-dense admin tool: Sora for headings,
Inter for body/UI text, JetBrains Mono available for IDs/timestamps. Status
badges (appointment/invoice/stock/etc. status) share one color mapping in
`components/ui/Badge.jsx`.

## Login

There's no seeded user — register the first account from `/register` (pick
`Hospital Admin` or `Super Admin` as the role) against your running backend,
then sign in.
