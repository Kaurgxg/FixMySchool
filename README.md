# FixMySchool — School Facility Condition Reporting & Repair Tracking Portal

A full-stack web app where **Students, Teachers and Parents** report school infrastructure
problems (broken furniture, electrical hazards, sanitation issues, etc.) and **Admins** track,
assign and resolve them with full transparency.

---

## ✨ What's built

| Feature | Status |
|---------|--------|
| Bus animation landing + Login/Signup | ✅ |
| **Separate Admin Login vs Student/Teacher/Parent Login portals** | ✅ |
| Role-based auth, server-enforced portal restriction | ✅ |
| JWT sessions, bcrypt passwords | ✅ |
| Issue reporting with photo (up to 5) and video (up to 2) upload | ✅ |
| Issue list with search + filters (status/category/priority) | ✅ |
| Issue detail with activity timeline, photos & video playback | ✅ |
| Admin: assign staff, update status, manage users (school-scoped) | ✅ |
| **Admin filters**: status, category, priority, location, reporter, keyword | ✅ |
| **Filter-aware CSV / PDF export** | ✅ |
| Dashboard: stats, donut chart, category bars, priority breakdown | ✅ |
| In-app notifications + pending-repair reminders | ✅ |
| **Distributed-safe reminder scheduling** (multi-instance safe) | ✅ |
| School-scoped authorization (no cross-school data access) | ✅ |
| **Media access via short-lived scoped tokens** (no long-lived JWT in URLs) | ✅ |
| **Magic-number MIME validation** (not just file extension) | ✅ |
| **Rate limiting** on login/registration | ✅ |
| **Orphaned-upload cleanup** on failed submissions | ✅ |
| Collision-safe issue codes (atomic counter) | ✅ |
| **DB indexes** for issue/user filtering | ✅ |
| **Optional pagination** on issue/user lists | ✅ |
| **Toast feedback** for all admin actions | ✅ |
| Mobile-responsive UI incl. **card layouts for admin tables** | ✅ |
| **Accessibility pass** (labels, focus rings, aria attributes) | ✅ |
| **60 automated backend tests** (all passing) | ✅ |
| Wood/parchment design theme | ✅ |
| **MongoDB connection** | ⬜ You do this (5 min, free) |

---

## 🔧 What changed in this pass (security, portals, admin UX, testing)

Building on the Phase 1 completion pass, this round addressed a second review's remaining gaps:

**Auth & portals**
- Split login into two clearly separated experiences — **Admin Login** and **Student/Teacher/Parent Login** — via a toggle on the login page. The restriction is enforced **server-side** (`portal` field on `POST /api/auth/login`), not just hidden in the UI, so it can't be bypassed by editing frontend JS.
- Removed the leftover "Admin" option from `Login.jsx`'s inline signup tab (a second, previously-unfixed signup surface distinct from the dead `/register` page).
- `ProtectedRoute` now takes `restrictTo="admin"|"user"` and redirects each role to its own dashboard, so admins can't land on user-only screens (e.g. Report an Issue) and vice versa.
- Fixed a real pre-existing React rules-of-hooks bug in `Login.jsx` (an early `return` before hooks were declared).

**Security hardening**
- **Media tokens**: uploaded photos/videos are now loaded via authenticated blob fetch (`ProtectedMedia` component) using the normal `Authorization` header — no token ever sits in a URL for in-page previews. "Open full size" links mint a separate, narrowly-scoped, **2-minute** token instead of reusing the 7-day session token.
- **MIME sniffing**: uploads are now validated by their actual file bytes (`file-type` magic-number detection), not just their extension — a text file renamed to `.jpg` is rejected.
- **Rate limiting**: `/api/auth/login` (10/15min) and `/api/auth/register` (20/hr) via `express-rate-limit`.
- **Error responses** no longer leak internal error messages or stack traces — unexpected (500) errors always return a generic message to the client.
- Confirmed passwords were already safe (`select:false` + `toSafeObject()`).

**Reliability**
- **Distributed cron lock** (`CronLock` model, unique index): if multiple backend instances run, only one sends the daily reminder sweep.
- **Orphaned-file cleanup**: uploaded files are deleted if the issue submission fails validation or the DB write fails.
- **DB indexes** added on `Issue` (schoolId+status/category/priority/reportedBy/createdAt) and `User` (schoolId+role).
- **Optional pagination** on `GET /api/issues` and `GET /api/admin/users` — additive, so omitting `page`/`limit` preserves the exact old behavior.

**Admin UX**
- Extended filters: category, priority, location, reporter (by name), and free-text search — all forwarded identically to the CSV/PDF export, so an export always matches exactly what's on screen.
- Toast notifications for every admin action (assign, status update, reminders, user activation, exports) via a new lightweight `ToastProvider`.
- Mobile card layouts for the Issues and Users tables (in addition to the existing responsive/scrollable table for larger screens).

**Accessibility**
- Associated `<label for>`/`id` pairs across all forms, `aria-pressed` on custom toggle buttons, `aria-busy` on loading buttons, `role="alert"` on error banners, a visible `:focus-visible` ring, and an `.sr-only` utility for icon-only controls.

**Testing**
- Added **60 automated backend tests** (`node --test tests/*.test.js`, uses Node's built-in test runner — no new test framework dependency) covering: registration role-downgrade safety, login, admin/user portal restriction, password safety, cross-school access denial on every issue/user endpoint, status/assignment updates, upload size/count/MIME validation (including a genuine magic-number rejection test), orphaned-file cleanup, the reminder sweep's staleness/cooldown logic, the distributed cron lock, and CSV/PDF export byte-level output and filter parity. All 60 pass. Also re-verified with live HTTP boot tests (mocked DB) that every protected route 401s without auth, the rate limiter returns 429 on the 11th rapid login attempt, and a simulated 500 error never leaks internal details to the client.
- Frontend: production build (`vite build`) and lint (`oxlint`) both pass with 0 errors.

**Not fully covered (explicitly out of scope, or needs infrastructure this environment can't provide)**
- Tests run against mocked Mongoose models, not a live MongoDB — this sandbox has no path to a real `mongod` binary (network egress is restricted and it's not in the default Ubuntu repos), so end-to-end database behavior (real duplicate-key races, actual index usage, real cross-instance cron locking) is exercised at the logic level, not integration-tested against a live database.
- No real browser/device manual QA was possible in this environment; layouts were verified by build/lint success and code review, not visual testing on physical devices.

---

Every gap from the original review has been addressed:

1. **Video uploads** — `upload.js` now accepts `images` (≤5MB each, jpg/png/webp/gif) and `videos`
   (≤50MB each, mp4/mov/webm/avi/mkv) as separate multipart fields. `Issue` model has a new
   `videos` array. `ReportIssue.jsx` has a video picker with previews; `IssueDetail.jsx` plays them back.

2. **Pending-repair reminders** — `utils/reminderJob.js` runs automatically once a day (`node-cron`,
   08:00 server time) and flags any Pending/In Progress issue that hasn't had a real status/assignment
   change in 3+ days, sending the reporter a `reminder` notification (max once every 3 days per issue
   so it never spams). Admins can also trigger it on demand from the Admin Panel ("🔔 Run Reminders"
   button → `POST /api/admin/reminders/run`).

3. **Report generation/export** — new `GET /api/admin/reports/csv` and `GET /api/admin/reports/pdf`
   endpoints generate a real downloadable file (optionally filtered by `status`/`category`/`priority`/
   `from`/`to`), scoped to the admin's own school. Buttons added to the Admin Panel toolbar.

4. **Cross-school admin access — fixed.** `issueController.js` now runs every issue lookup through a
   shared `loadAuthorizedIssue()` check that verifies `issue.schoolId === req.user.schoolId` *and*
   that the requester is either the reporter or an admin, before allowing view/status-update/assign.
   `adminController.js`'s `toggleUserActive` has the same school check, and now also refuses to let
   one admin (de)activate another admin account through that endpoint.

5. **Public file exposure — fixed.** `/uploads` is no longer served by `express.static`. It's now a
   protected route (`routes/uploadRoutes.js` + `controllers/fileController.js`) that requires a valid
   JWT (sent as a normal `Authorization` header, or as `?token=` for `<img>`/`<video>` tags which can't
   set headers) and checks the requesting user is from the same school and either the file's owner or
   an admin. Path traversal in filenames is also blocked.

6. **Register.jsx admin option — fixed.** The confusing "Admin" self-registration button has been
   replaced with "Parent" (a real role that already existed in the schema but was missing from the UI).
   The backend still independently blocks self-registered admin accounts as defense-in-depth.

7. **Issue code race condition — fixed.** `countDocuments() + 1` has been replaced with a new atomic
   `Counter` model (`models/Counter.js`) using MongoDB's atomic `findOneAndUpdate` + `$inc`, so two
   concurrent submissions can never receive the same issue code.

8. **Priority filtering on the dashboard** — added a clickable "Issues by Priority" panel on the
   Dashboard (matching the existing category panel), linking to a pre-filtered Issues page. Also fixed
   a related bug in `IssueList.jsx` where the page read `category` from the URL but never read
   `priority`, so a priority-filtered link wouldn't have pre-populated the filter correctly.

All of the above was verified with targeted unit-style tests against the real controller/middleware
code (mocking the database layer, since this sandbox couldn't provision a MongoDB instance) — 29
assertions covering cross-school access denial/approval, admin self-protection, reminder staleness
logic, file-access authorization (including path traversal and cross-school denial), CSV/PDF byte-level
output, and upload size validation, all passing. The frontend was also verified with a clean
production build (`vite build`) and lint pass.

**Not addressed (explicitly out of scope or requires infrastructure you'll configure):**
- Automated performance/load tests for the backend (would need a running MongoDB + load-testing setup)
- Browser/device matrix testing of the responsive UI (needs real devices/BrowserStack)
- The MongoDB connection itself, per your request

---

## 🚀 Setup (the only thing you need to do)

### Step 1 — MongoDB Atlas (free, 5 minutes)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up free
2. Create a free **M0** cluster (any region)
3. Create a database user (write down the password)
4. Under **Network Access** → Add IP → **Allow from anywhere** (`0.0.0.0/0`)
5. Click **Connect → Drivers** and copy your connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.XXXXX.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name before the `?`:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.XXXXX.mongodb.net/school_facility_portal?retryWrites=true&w=majority
   ```

### Step 2 — Run the backend

```bash
cd backend
cp .env.example .env
# Open .env and paste your connection string into MONGO_URI
# Change JWT_SECRET to any long random string
npm install
npm run seed        
npm run dev         
```

You'll see `MongoDB connected: ...` — leave this terminal running.

To run the automated backend test suite (60 tests, mocked DB layer — no MongoDB connection required):
```bash
npm test
```

### Step 3 — Run the frontend

```bash
cd frontend
npm install
npm run dev         # Opens at http://localhost:5173
```

### Demo accounts (after seeding)

| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| Admin   | admin@school.edu       | Admin@12345   |
| Teacher | teacher@school.edu     | Teacher@123   |
| Student | student@school.edu     | Student@123   |
| Parent  | parent@school.edu      | Parent@123    |

---

## 🌐 Deploying for a live link (free)

1. **Database** → MongoDB Atlas M0 (already done above)
2. **Backend** → [Render.com](https://render.com) free tier:
   - New Web Service → connect GitHub → root dir: `backend`
   - Build: `npm install` · Start: `npm start`
   - Environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT` (auto), `CLIENT_ORIGIN` (your Vercel URL)
3. **Frontend** → [Vercel.com](https://vercel.com) free tier:
   - Import project → root dir: `frontend`
   - Build: `npm run build` · Output: `dist`
   - Environment variable: `VITE_API_URL=https://YOUR-RENDER-APP.onrender.com/api`
4. After both are live, update Render's `CLIENT_ORIGIN` to your Vercel URL and redeploy

---

## 📁 Project structure

```
school-facility-portal/
├── backend/
│   ├── config/         MongoDB connection
│   ├── models/         User · Issue · Notification (Mongoose schemas)
│   ├── controllers/    Auth · Issue · Dashboard · Notification · Admin
│   ├── routes/         REST API routes
│   ├── middleware/      JWT auth · Multer upload · Error handler
│   ├── utils/          Token helper · Default admin · Seed script
│   └── server.js       Express entry point
├── frontend/
│   └── src/
│       ├── pages/      Login · Register · Dashboard · ReportIssue ·
│       │               IssueList · IssueDetail · Notifications · AdminPanel
│       ├── components/ Navbar · IssueTagCard · StatusBadge · PriorityPill · EmptyState
│       ├── context/    AuthContext (global session)
│       └── api/        Axios instance with JWT interceptor
├── PRD.md              Full product requirements document
└── README.md
```

## 🔌 API reference

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register (student/teacher/parent) |
| POST | `/api/auth/login` | Public (rate-limited) | Login → JWT token (accepts optional `portal: "admin"\|"user"`) |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/auth/media-token` | Auth | Mint a short-lived (2 min) token for loading protected media via a URL |
| POST | `/api/issues` | Auth | Report issue (multipart: `images[]`, `videos[]`) |
| GET | `/api/issues` | Auth | List issues (filters: status/category/priority/search) |
| GET | `/api/issues/:id` | Auth (school + owner/admin) | Issue detail + timeline |
| PATCH | `/api/issues/:id/status` | Admin (same school) | Update status + add note |
| PATCH | `/api/issues/:id/assign` | Admin (same school) | Assign staff + ETA |
| GET | `/uploads/:filename` | Auth (school + owner/admin) | Serve an uploaded photo/video (token via header or `?token=`) |
| GET | `/api/notifications` | Auth | My notifications |
| PATCH | `/api/notifications/:id/read` | Auth | Mark one read |
| PATCH | `/api/notifications/read-all` | Auth | Mark all read |
| GET | `/api/dashboard/summary` | Auth | Stats for dashboard (incl. `byPriority`) |
| GET | `/api/admin/users` | Admin | List all users (own school) |
| PATCH | `/api/admin/users/:id/toggle-active` | Admin (same school) | Activate/deactivate user |
| GET | `/api/admin/reports/csv` | Admin | Download issue report as CSV |
| GET | `/api/admin/reports/pdf` | Admin | Download issue report as PDF |
| POST | `/api/admin/reminders/run` | Admin | Manually trigger the pending-repair reminder sweep |
