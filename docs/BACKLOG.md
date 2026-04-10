# Cognitive Care Assistant — Product Backlog

**Last updated:** April 2026

Items are grouped by priority tier. Within each tier, items are roughly ordered by impact.

---

## Legend

| Label | Meaning |
|-------|---------|
| **P0** | Critical — blocks core usage or production stability |
| **P1** | High — significant user value or required for next milestone |
| **P2** | Medium — improves experience but not blocking |
| **P3** | Low — nice-to-have, exploratory, or long-term |
| Status markers: `[ ]` not started, `[~]` in progress, `[x]` done |

---

## P0 — Critical

- [x] **Clerk authentication integration** — Sign-in, sign-up, password reset, sign-out flows with RLS enforcement on all Supabase tables.
- [x] **Daily health check questionnaire** — Structured daily check-ins with session grouping, photo attachments, and history view.
- [x] **Thermal sensor pipeline (AMG8833)** — End-to-end data flow from sensor through bridge script to frontend visualization. Supports Pi TCP, Bluetooth serial, and USB serial input modes.
- [x] **EMG sensor pipeline (MyoWare)** — Real-time EMG data via Socket.IO bridge with live charting, calibration, and session recording.
- [x] **User ID migration** — Clerk-to-legacy UUID mapping so existing Supabase data remains accessible after auth migration.
- [x] **Settings page implementation** — Display preferences (theme, temp unit), sensor configuration (connection mode, port scanning, connectivity test), and WiFi provisioning (Pi + ESP32).
- [ ] **Error handling on sensor disconnect** — Thermal and EMG pages should show clear, actionable messages when the bridge process is not running or the sensor is disconnected, instead of silently showing no data.

---

## P1 — High

- [ ] **Offline / PWA support** — Cache critical pages and daily check form so patients can complete checks without internet, syncing when connectivity returns.
- [ ] **Push notification reminders** — Medication, hydration, and daily check reminders via browser push notifications (or native if PWA).
- [ ] **Caregiver multi-patient dashboard** — Allow a single caregiver account to monitor multiple patients, switching between profiles.
- [ ] **AI synopsis — real implementation** — Wire the AI synopsis dashboard to actual aggregation logic over daily checks, sensor sessions, and game performance. Currently UI scaffolding.
- [ ] **Assessments page buildout** — Replace the thin placeholder with structured cognitive assessments (e.g., Mini-Cog, clock drawing digital adaptation).
- [~] **Guest mode refinement** — Ensure guest flows gracefully degrade all features, with clear upgrade prompts. Verify local storage fallback works consistently.
- [ ] **Thermal session recording to Supabase** — Save full thermal sessions (not just latest frame) to `thermal_sessions` with playback support on the history page.
- [ ] **EMG session data export** — Allow caregivers/clinicians to export EMG session data as CSV or PDF reports.
- [ ] **Daily check trend analysis** — Charts showing week-over-week and month-over-month trends in daily check responses, surfacing decline or improvement patterns.
- [ ] **Medication schedule CRUD** — Full create/read/update/delete for medication schedules stored in Supabase, replacing any hardcoded or placeholder reminder data.

---

## P2 — Medium

- [ ] **Memory games expansion** — Add more game types (word recall, pattern matching, spatial memory) beyond the current implementation. Track difficulty progression.
- [ ] **Photo album enhancements** — Tagging, captions, date grouping, and slideshow mode for the photo album. Useful for reminiscence therapy.
- [ ] **Sensor configuration UI** — In-app settings panel to select connection mode (WiFi / Bluetooth / USB), set serial port, baud rate, and test connectivity without touching `.env` files.
- [ ] **Dark mode polish** — Audit all pages for dark mode consistency; several components may have hard-coded light backgrounds.
- [ ] **Responsive mobile layout** — Optimize sidebar navigation and sensor visualizations for phone-sized screens (< 768px).
- [ ] **Thermal heatmap color scales** — Let users choose between color scales (rainbow, grayscale, high-contrast) for accessibility.
- [ ] **Role-based access control** — Distinguish patient vs. caregiver vs. admin roles in Clerk metadata, gating features accordingly.
- [ ] **Localization / i18n** — Extend Clerk path localization to full app-wide i18n (at minimum English + Spanish).
- [ ] **Audit logging** — Record who accessed what data and when, stored in Supabase, for compliance and caregiver accountability.
- [ ] **Automated test suite** — Unit tests for data normalization utilities, integration tests for API routes, and E2E tests for critical flows (sign-in → daily check → review).

---

## P3 — Low / Exploratory

- [ ] **Voice-guided daily checks** — Text-to-speech reads questions aloud; speech-to-text captures patient responses for those with limited dexterity.
- [ ] **Wearable integration** — Accept data from consumer wearables (Fitbit, Apple Watch) for sleep, heart rate, and activity metrics alongside custom sensors.
- [ ] **Telehealth video call** — Embedded video call between caregiver and patient or clinician, with session context displayed alongside.
- [ ] **Anomaly detection alerts** — ML-based detection of unusual sensor patterns (e.g., nighttime thermal spikes, EMG tremor signatures) with proactive caregiver notifications.
- [ ] **Supabase Edge Functions** — Migrate heavy API route logic (session aggregation, synopsis computation) to Supabase Edge Functions for reduced latency.
- [ ] **Native mobile app** — React Native or Capacitor wrapper for iOS/Android with native push notifications and Bluetooth access.
- [ ] **FHIR data export** — Export patient data in FHIR format for interoperability with electronic health record systems.
- [ ] **Multi-language firmware templates** — Provide pre-built firmware sketches (Arduino, MicroPython, CircuitPython) for common MCU boards to simplify sensor setup.
- [ ] **Gamification & streaks** — Daily check streaks, memory game leaderboards, and achievement badges to motivate consistent engagement.
- [ ] **Caregiver journal** — Free-text journaling feature for caregivers to log observations, mood, and incidents alongside structured data.

---

## Technical Debt

- [ ] **Remove placeholder pages** — `assessments` is still a stub; either implement or remove from navigation.
- [ ] **Consolidate bridge scripts** — `bluetooth-thermal-receiver.js` and `usb-serial-thermal-receiver.js` share significant logic; extract common transport-agnostic layer.
- [ ] **API route test page cleanup** — `src/app/api/emg/test/page.tsx` is a page nested under `api/`; relocate to a dev-tools route.
- [ ] **Type safety on API routes** — Several API routes cast request bodies to `Record<string, unknown>`; add Zod or similar validation schemas.
- [ ] **Environment variable documentation** — Centralize all env vars into a single `.env.example` file with inline comments; current docs are scattered across multiple markdown files.
- [ ] **Supabase client singleton** — Verify a single Supabase client instance is reused across server-side API routes rather than re-created per request.
- [ ] **Image optimization** — Review remote image patterns in `next.config.ts`; add `placeholder="blur"` where appropriate.
- [ ] **Dead code removal** — Audit `sensor code/thermal_sensor/old/` and unused bridge variants; archive or delete.

---

## Completed Milestones

| Date | Milestone |
|------|-----------|
| 2025 | Congressional App Challenge submission and win (FL-17) |
| 2025 | Clerk auth migration from legacy Supabase auth |
| 2026 Q1 | USB serial thermal sensor support added |
| 2026 Q1 | Project file organization (docs/, bridges/, scripts/, sensor code/) |
