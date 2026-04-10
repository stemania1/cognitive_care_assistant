# Cognitive Care Assistant — Architecture

**Last updated:** April 2026

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  Next.js App (React 19, Tailwind v4, Chart.js)                  │
│  ├── Dashboard, Daily Checks, Sensors, EMG, Games, Album, AI   │
│  └── Clerk auth (client-side provider)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS (fetch / polling / WebSocket)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Production)                          │
│  Next.js 16 App Router — API Routes + SSR/RSC                   │
│  ├── /api/thermal/*     Thermal data ingest & query             │
│  ├── /api/emg/*         EMG data ingest, stream, commands       │
│  ├── /api/daily-checks  Daily check CRUD                        │
│  ├── /api/album-photos  Photo album CRUD                        │
│  ├── /api/auth/*        Password reset flows                    │
│  └── Clerk middleware    Auth enforcement on all routes          │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────┐          ┌────────────────────────┐
│   Supabase Cloud     │          │  In-Memory Data Store   │
│  ├── PostgreSQL      │          │  (thermal-data-store.ts)│
│  │   tables + RLS    │          │  Latest sensor frames   │
│  └── Storage buckets │          │  for real-time polling  │
│      (photos)        │          └────────────────────────┘
└─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 Local Machine (Caregiver's PC)                   │
│                                                                  │
│  Bridge Processes (Node.js / Python)                             │
│  ├── usb-serial-thermal-receiver.js  ← USB serial from MCU     │
│  ├── bluetooth-thermal-receiver.js   ← BT serial from Pi       │
│  ├── emg-server.js                   ← Express + Socket.IO     │
│  └── bluetooth-receiver.js           ← BT serial from ESP32    │
│                                                                  │
│  Hardware                                                        │
│  ├── ESP32 / Pi Pico + AMG8833 (thermal, USB or BT)            │
│  ├── Raspberry Pi + AMG8833 (thermal, WiFi TCP or BT)           │
│  └── ESP32 + MyoWare (EMG, Bluetooth)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack dev) | 16.1.x |
| **Language** | TypeScript (strict mode) | 5.x |
| **UI** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **Fonts** | Geist (via `next/font/google`) | — |
| **Auth** | Clerk (`@clerk/nextjs`) | latest |
| **Database** | Supabase (PostgreSQL + Storage) | — |
| **Charts** | Chart.js + react-chartjs-2 | — |
| **Real-time** | Socket.IO (server + client) | — |
| **HTTP server** | Express 5 (EMG bridge only) | 5.x |
| **Serial I/O** | serialport + @serialport/parser-readline | — |
| **Process mgmt** | concurrently (dev multi-process) | — |
| **Deployment** | Vercel (web app), local (bridge scripts) | — |

---

## 3. Directory Structure

```
cognitive_care_assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Root redirect → /signin
│   │   ├── layout.tsx          # Root layout (Clerk provider, sidebar, theme)
│   │   ├── dashboard/          # Main hub
│   │   ├── daily-questions/    # Daily health checks
│   │   ├── questions/history/  # Check history
│   │   ├── reminders/          # Medication & nutrition
│   │   ├── emg/                # Live EMG monitoring
│   │   ├── emg-history/        # EMG session history
│   │   ├── sensors/            # Thermal sensor UI
│   │   ├── sleepbehaviors/     # Sleep/thermal analysis
│   │   ├── thermal-history/    # Thermal session history
│   │   ├── memory-games/       # Cognitive exercises
│   │   ├── photo-album/        # Photo album
│   │   ├── ai-synopsis/        # AI dashboard
│   │   ├── about/              # Project info
│   │   ├── settings/           # User settings (placeholder)
│   │   ├── signin/             # Clerk sign-in
│   │   ├── signup/             # Clerk sign-up
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset completion
│   │   ├── signout/            # Sign-out
│   │   ├── clear-session/      # Session cleanup
│   │   ├── components/         # Shared React components
│   │   ├── config/             # App configuration (sensor-config.ts)
│   │   └── api/                # API route handlers
│   │       ├── thermal/        # bt/, ports/, ws/
│   │       ├── emg/            # command/, data/, stream/, ws/
│   │       ├── daily-checks/
│   │       ├── daily-check-sessions/
│   │       ├── thermal-sessions/
│   │       ├── emg-sessions/
│   │       ├── album-photos/
│   │       ├── photos/upload/
│   │       └── auth/
│   ├── lib/                    # Shared utilities
│   │   ├── supabase.ts         # Supabase client
│   │   ├── clerk-auth.ts       # Clerk server helpers
│   │   ├── user-id-mapping.ts  # Clerk ↔ legacy UUID
│   │   ├── thermal-data-store.ts
│   │   └── thermal-payload-normalize.ts
│   └── middleware.ts           # Clerk auth middleware
├── bridges/                    # Sensor bridge scripts (Node.js / Python)
├── scripts/                    # Dev/test utilities (.js, .ps1, .sh)
├── sensor code/                # Firmware & on-device scripts
│   ├── thermal_sensor/         # AMG8833 Pi/MCU code
│   └── myoware/                # MyoWare Arduino sketches
├── supabase/
│   └── migrations/             # SQL migration files (001–015)
├── docs/                       # Project documentation
├── public/                     # Static assets (images, videos)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── .env.local                  # Environment variables (not committed)
```

---

## 4. Authentication Flow

```
Browser                     Clerk                      Next.js API            Supabase
  │                           │                            │                     │
  ├── Sign in ───────────────►│                            │                     │
  │◄── Session token ─────────┤                            │                     │
  │                           │                            │                     │
  ├── API request + token ────┼───────────────────────────►│                     │
  │                           │  middleware validates ──────┤                     │
  │                           │                            ├── getClerkUserId()  │
  │                           │                            ├── mapToSupabaseId()─►│
  │                           │                            │◄── legacy UUID ─────┤
  │                           │                            ├── query with UUID ──►│
  │                           │                            │◄── data ────────────┤
  │◄── response ──────────────┼────────────────────────────┤                     │
```

**Key files:**
- `src/middleware.ts` — Clerk middleware applied to all page and API routes.
- `src/lib/clerk-auth.ts` — Server-side `getClerkUserId()` and `validateUserId()`.
- `src/lib/user-id-mapping.ts` — Maps Clerk user IDs to legacy Supabase UUIDs via the `user_id_mappings` table, maintaining backward compatibility after the auth migration.

---

## 5. Sensor Data Pipelines

### 5.1 Thermal Sensor (AMG8833)

Three supported transport modes, all converging on the same API endpoint:

| Mode | Bridge Script | Transport | Env Config |
|------|--------------|-----------|------------|
| **Pi TCP** | `bluetooth-thermal-receiver.js` | WiFi / USB RNDIS to Pi, serial read | `THERMAL_INPUT_MODE=bluetooth` |
| **Bluetooth Serial** | `bluetooth-thermal-receiver.js` | BT SPP from Pi, COM port | `THERMAL_INPUT_MODE=bluetooth` |
| **USB Serial** | `usb-serial-thermal-receiver.js` | USB CDC from ESP32/Pico | `THERMAL_INPUT_MODE=usb_serial` |

**Data flow:**

```
AMG8833 ──I2C──► MCU/Pi ──serial──► Bridge Script
                                        │
                         parseThermalSerialLine()
                         (JSON or 64-value CSV)
                                        │
                                POST /api/thermal/bt
                                        │
                            normalizeThermalPayload()
                                        │
                              storeThermalData()
                            (in-memory latest frame)
                                        │
                              GET /api/thermal ◄── Frontend polling
                                        │
                            ThermalVisualization.tsx
                              (8×8 heatmap render)
```

**Payload formats accepted:**
- JSON: `{ "pixels": [64 floats], "sensor": "AMG8833" }`
- CSV: `23.5, 24.0, ... (64 values)`
- Prefixed: `THERMAL: { ... }` or `THERMAL: 23.5, 24.0, ...`

**Auto-detection:** `usb-serial-thermal-receiver.js` probes all COM ports at multiple baud rates (115200, 9600, 57600) with configurable line endings, prioritizing ports with USB vendor IDs.

### 5.2 EMG Sensor (MyoWare)

```
MyoWare ──analog──► ESP32 ──BT serial──► bluetooth-receiver.js
                                              │
                                     HTTP POST to emg-server.js
                                              │
                                  Express + Socket.IO server
                                    ├── broadcasts to WS clients
                                    └── forwards to /api/emg/ws
                                              │
                                     Next.js API routes
                                    ├── /api/emg/data (store)
                                    ├── /api/emg/stream (poll)
                                    └── /api/emg/command (calibrate)
                                              │
                                  EMGChart.tsx + MyoWareClient.tsx
```

The EMG bridge runs as a standalone Express server (`bridges/emg-server.js`) on a configurable port, separate from the Next.js process.

---

## 6. Database Schema

### Tables

**`daily_checks`**
- `id` (UUID, PK)
- `user_id` (text — Clerk or legacy UUID)
- `session_id` (FK → daily_check_sessions)
- Question/answer fields, photo URL, timestamps

**`daily_check_sessions`**
- `id` (UUID, PK)
- `user_id` (text)
- `session_number` (integer)
- Completion status, timestamps

**`thermal_sessions`**
- `id` (UUID, PK)
- `user_id` (text)
- `samples` (JSONB — array of thermal frames)
- `session_number`, movement flags, timestamps

**`emg_sessions`**
- `id` (UUID, PK)
- `user_id` (text)
- `session_number`
- `move_markers` (JSONB)
- EMG data, timestamps

**`album_photos`**
- `id` (UUID, PK)
- `user_id` (text)
- Photo URL, metadata, timestamps

**`user_id_mappings`**
- `clerk_user_id` (text, PK)
- `supabase_user_id` (UUID)
- Created at timestamp

### Row-Level Security

All tables enforce RLS policies scoped to `user_id`. API routes authenticate via Clerk, resolve the Supabase UUID through `user_id_mappings`, and query with that UUID. Migration `013_update_rls_for_clerk.sql` updated policies for the Clerk auth model.

### Storage

- **Bucket:** `daily-check-photos` — Stores images attached to daily check sessions.
- Access controlled by Supabase Storage RLS policies.

---

## 7. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/thermal` | GET | Retrieve latest thermal frame from in-memory store |
| `/api/thermal/bt` | POST | Ingest thermal frame from bridge script |
| `/api/thermal/ports` | GET | List available serial ports |
| `/api/thermal/ws` | GET | WebSocket upgrade for real-time thermal |
| `/api/thermal-sessions` | GET, POST | CRUD for recorded thermal sessions |
| `/api/emg/data` | POST | Store EMG data point |
| `/api/emg/stream` | GET | Poll latest EMG data |
| `/api/emg/command` | POST | Send command to EMG bridge (calibrate, etc.) |
| `/api/emg/ws` | GET | WebSocket upgrade for real-time EMG |
| `/api/emg-sessions` | GET, POST | CRUD for EMG sessions |
| `/api/emg-sessions/verify` | GET | Verify session integrity |
| `/api/daily-checks` | GET, POST | Daily check CRUD |
| `/api/daily-check-sessions` | GET, POST | Session grouping CRUD |
| `/api/album-photos` | GET, POST | Photo album CRUD |
| `/api/photos/upload` | POST | Upload photo to Supabase Storage |
| `/api/auth/request-reset` | POST | Initiate password reset |
| `/api/auth/reset-password` | POST | Complete password reset |
| `/api/check-schema` | GET | Verify database schema |
| `/api/debug-data` | GET | Dev-only data inspection |
| `/api/test-config` | GET | Dev-only config check |

---

## 8. Frontend Architecture

### Layout & Navigation

The root layout (`src/app/layout.tsx`) wraps all pages with:
1. **ClerkProviderWithPathLocalization** — Auth context with custom appearance.
2. **DementiaCareSidebar** — Persistent sidebar navigation across all authenticated pages.
3. **Geist font** loading via `next/font/google`.
4. **Tailwind CSS v4** via PostCSS.

### Key Components

| Component | Responsibility |
|-----------|---------------|
| `DementiaCareSidebar` | Main navigation; links to all feature pages |
| `HomeCards` | Dashboard quick-access cards |
| `ThermalVisualization` | 8×8 heatmap rendering with color scale |
| `EMGChart` | Real-time EMG line chart (Chart.js) |
| `MyoWareClient` | EMG connection management and calibration |
| `CalibrationChart` | EMG calibration visualization |
| `AlertCenter` / `GlobalAlertButton` | Notification system |
| `InsightReviewsCarousel` | Rotating health insights |
| `AiSynopsisDashboard` | AI-generated health overview |
| `GameStatsChart` | Memory game performance tracking |
| `ThemeToggle` | Light/dark mode switch |
| `GuestIndicator` | Shows when in guest/demo mode |
| `UserProfileTopLeft` | Clerk user avatar and name |

### Data Fetching

- **Sensor data:** Frontend polls `/api/thermal` and `/api/emg/stream` at ~1s intervals. WebSocket connections available via `/ws` routes for lower latency.
- **CRUD data:** Standard `fetch()` calls to API routes from client components.
- **Auth-gated:** All API calls include Clerk session tokens via middleware.

---

## 9. Deployment Architecture

```
┌──────────────────────────────────────┐
│           Vercel Platform             │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  Next.js Application            │ │
│  │  ├── SSR / RSC pages            │ │
│  │  ├── API routes (serverless)    │ │
│  │  └── Static assets              │ │
│  └─────────────┬───────────────────┘ │
│                │                      │
└────────────────┼──────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│ Clerk  │ │Supabase │ │ Local PC │
│ (Auth) │ │(DB +    │ │(Bridges) │
│        │ │Storage) │ │          │
└────────┘ └─────────┘ └──────────┘
```

**Vercel exclusions** (`.vercelignore`): `node_modules`, `.next`, `public/videos`, `sensor code`, `scripts`, `*.sql`, `*.md` — keeps the deployment bundle lean.

**Local bridge requirement:** Sensor bridge scripts (`bridges/`) must run on the caregiver's local machine where USB/Bluetooth hardware is physically connected. These scripts POST data to the Vercel-hosted API (or `localhost:3000` during development).

**Development mode:** `npm run dev` starts Next.js + a thermal bridge concurrently via `concurrently`. Alternative scripts: `npm run dev:thermal-usb` for USB serial mode, `npm run start:emg` for EMG.

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **Authentication** | Clerk middleware on all routes; no unauthenticated access to patient data |
| **Authorization** | Supabase RLS policies enforce `user_id` scoping on every table |
| **API abuse** | Bridge endpoints (`/api/thermal/bt`, `/api/emg/*`) accept data from local scripts; production should restrict by origin or API key |
| **Secrets** | Environment variables for all keys (Clerk, Supabase); `.env.local` not committed |
| **Data in transit** | HTTPS enforced on Vercel; local bridge traffic is `localhost` only in dev |
| **PHI handling** | No raw PHI logged in production; debug env vars control verbose logging |
| **Dependencies** | Standard npm audit; `serialport` native addon requires trusted build chain |

---

## 11. Key Design Decisions

1. **App Router over Pages Router** — Leverages React Server Components and the latest Next.js patterns for cleaner data fetching and layout composition.

2. **Bridge scripts as separate processes** — Serial port access requires native Node.js addons (`serialport`) that cannot run in Vercel's serverless environment. Keeping bridges as standalone scripts avoids polluting the Next.js build and allows them to run on any OS where the hardware is connected.

3. **In-memory thermal store** — The latest thermal frame is held in a Node.js module-level variable rather than a database for sub-second polling latency. Full sessions are optionally persisted to Supabase for historical review.

4. **Clerk over Supabase Auth** — Clerk provides a richer auth UI, multi-domain support, and simpler integration with Next.js middleware. The `user_id_mappings` table bridges the migration gap.

5. **Multiple thermal transport modes** — Supporting Pi TCP, Bluetooth, and USB serial accommodates different hardware setups without requiring users to standardize on a single approach.

6. **Tailwind v4 with PostCSS** — Chosen for rapid UI development and dark mode support with minimal custom CSS.
