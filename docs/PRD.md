# Cognitive Care Assistant — Product Requirements Document

**Version:** 1.0  
**Last updated:** April 2026  
**Authors:** Corbin Craig, Connor Craig  
**Status:** Active development

---

## 1. Overview

Cognitive Care Assistant (CCA) is a web-based health-monitoring platform designed for **dementia patients** and their **caregivers**. It combines real-time biosensor data (EMG muscle activity, thermal imaging), structured daily assessments, medication/nutrition reminders, memory exercises, and an AI-driven synopsis dashboard into a single, accessible interface.

CCA won the **2025 Congressional App Challenge** (Florida District 17) and is deployed at `cognitive-care-assistant.vercel.app`.

---

## 2. Problem Statement

Dementia caregiving is fragmented across disconnected tools — paper journals, generic reminder apps, and occasional clinical visits. Caregivers lack a centralized way to:

- Track day-to-day cognitive and physical changes objectively.
- Collect and review biosensor data without clinical-grade equipment.
- Maintain a longitudinal record that clinicians can reference.

Patients, in turn, benefit from structured cognitive stimulation and consistent daily routines that a purpose-built application can provide.

---

## 3. Target Users

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Patient** | Individual living with mild-to-moderate cognitive decline | Complete daily check-ins, play memory games, view photo albums, follow medication/nutrition reminders |
| **Caregiver** | Family member or professional aide | Monitor sensor data, review daily assessment trends, manage reminders, view AI synopsis |
| **Clinician / Researcher** | Healthcare professional reviewing longitudinal data | Access aggregated metrics, thermal/EMG session history, risk scores |
| **Guest / Demo User** | Evaluator or student exploring CCA without an account | Browse features in a sandboxed read-only mode |

---

## 4. Core Features

### 4.1 Authentication & User Management

- **Clerk-based auth** with sign-in, sign-up, password reset, and sign-out flows.
- **Guest mode** for anonymous exploration (local storage fallback, optional Supabase anonymous auth).
- **User ID mapping** between Clerk IDs and legacy Supabase UUIDs for backward compatibility.

### 4.2 Dashboard

- Central hub with navigation sidebar and quick-access cards.
- Theme toggle (light/dark).
- Global alert center with insight reviews carousel.
- User profile chip and status indicator.

### 4.3 Daily Health Checks

- Structured daily questionnaire covering cognitive, physical, and emotional state.
- Session-based grouping with history view and completion charts.
- Photo attachment support for visual documentation.

### 4.4 Medication & Nutrition Reminders

- Configurable reminders for hydration, meals, and medicine schedules.
- Accessible from the dashboard and dedicated reminders page.

### 4.5 EMG Muscle Monitoring

- Real-time EMG data from MyoWare sensors via Bluetooth or WiFi.
- Live chart visualization with calibration support.
- Session recording, playback, and historical comparison.
- Local Express + Socket.IO bridge server for data transport.

### 4.6 Thermal Imaging (AMG8833)

- 8x8 thermal grid visualization from AMG8833 sensor.
- Multiple input paths: Raspberry Pi TCP, Bluetooth serial, USB serial (ESP32/MCU bridge).
- Auto-detection of serial ports with multi-baud probing.
- Session recording with historical review.
- Sleep/behavior analysis page for overnight thermal patterns.

### 4.11 Sensor Connectivity (All Modes)

Both the thermal sensor (AMG8833) and the EMG sensor (MyoWare) must be able to connect to CCA whether the app is running **locally** (`localhost:3000`) or **online** (production Vercel deployment). The same sensor hardware should work in either scenario without firmware changes — only the target API URL differs.

**Supported transports:**

| Transport | How it works | Localhost | Production |
|-----------|-------------|-----------|------------|
| **WiFi** | Sensor device (Pi or ESP32) connects to the same LAN and sends data over TCP/HTTP to the bridge script or directly to the API. | Bridge POSTs to `localhost:3000` | Bridge POSTs to `https://<app>.vercel.app`, or sensor firmware POSTs directly if on the internet |
| **Bluetooth** | Sensor device pairs with the local machine over BT SPP (virtual COM port). Bridge script reads the COM port and forwards to the API. | Bridge POSTs to `localhost:3000` | Bridge POSTs to production URL |
| **USB** | Sensor device (ESP32, Pi Pico, or Raspberry Pi) is physically plugged into the local machine via USB cable. Bridge script reads the USB serial port and forwards to the API. | Bridge POSTs to `localhost:3000` | Bridge POSTs to production URL |

**Requirements:**

- The `NEXTJS_API_URL` environment variable controls where bridge scripts send data, making the switch between localhost and production a single config change.
- Sensor firmware should accept a configurable target URL (for devices that POST directly over WiFi) so the same firmware image works in both environments.
- The app UI must clearly indicate which connection mode and target are active.

**WiFi configuration via USB — Raspberry Pi (thermal sensor):**

When a Raspberry Pi is connected to the local machine via USB (USB OTG / RNDIS), the app must provide a way to configure the Pi's WiFi settings so the Pi can subsequently connect to the local network independently. This enables a setup workflow where:

1. User plugs the Pi into their computer via USB.
2. CCA (or a companion setup script) detects the Pi over USB and opens a configuration interface.
3. User enters the local WiFi SSID and password.
4. The configuration is sent to the Pi, which saves it and connects to WiFi.
5. The Pi can then operate wirelessly, streaming sensor data over WiFi or Bluetooth without remaining tethered by USB.

This USB-based WiFi provisioning eliminates the need for users to SSH into the Pi or manually edit `wpa_supplicant.conf`, making first-time setup accessible to non-technical caregivers. The Pi-side configuration server (`sensor code/thermal_sensor/pi-config-server.py`) handles receiving and applying WiFi credentials.

**WiFi configuration via USB — ESP32 (EMG sensor):**

The same provisioning pattern applies to the ESP32 running the MyoWare EMG firmware. When the ESP32 is connected to the local machine via USB, the app must provide a way to configure the ESP32's WiFi credentials so it can transmit EMG data over the network without staying tethered. The workflow mirrors the Pi setup:

1. User plugs the ESP32 into their computer via USB.
2. CCA (or a companion setup script) detects the ESP32 on its serial port.
3. User enters the local WiFi SSID and password through the CCA interface.
4. The credentials are sent to the ESP32 over the USB serial connection.
5. The ESP32 stores the credentials (e.g., in NVS / EEPROM), connects to WiFi, and begins streaming EMG data wirelessly.

This requires the ESP32 firmware to support a serial command interface for WiFi provisioning (e.g., a simple JSON command like `{"cmd":"wifi_config","ssid":"...","password":"..."}`) alongside its normal EMG data output. Once configured, the ESP32 can operate untethered — connected to the same LAN and POSTing data to the bridge or directly to the CCA API.

### 4.7 Memory Games

- Interactive cognitive exercises with difficulty progression.
- Game statistics tracking and charting.

### 4.8 Photo Album

- Upload and browse photos tied to daily check sessions.
- Supabase Storage backend with RLS-protected access.

### 4.9 AI Synopsis Dashboard

- Aggregated risk scoring across sensor modalities.
- 90-day multimodal metric trends.
- Designed for caregiver/clinician review.

### 4.10 Content & Education

- About page with project background and Congressional App Challenge context.
- Dementia stages information.
- Workout/exercise video content.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Dashboard loads in < 2s on broadband; sensor data renders at >= 1 fps |
| **Accessibility** | WCAG 2.1 AA minimum; large touch targets for patients with motor difficulties |
| **Security** | Clerk-managed auth; Supabase RLS on all tables; no PHI in client logs |
| **Reliability** | Sensor bridges auto-reconnect on disconnect; graceful degradation when sensors unavailable |
| **Compatibility** | Chrome, Edge, Safari (latest 2 versions); responsive down to 768px; Windows/macOS/Linux for bridge scripts |
| **Deployment** | Vercel for frontend + API routes; local bridge processes for sensor hardware |

---

## 6. Data Model (Supabase)

| Table | Purpose |
|-------|---------|
| `daily_checks` | Individual question responses |
| `daily_check_sessions` | Grouped check-in sessions |
| `thermal_sessions` | Recorded AMG8833 thermal sessions (JSONB samples) |
| `emg_sessions` | Recorded MyoWare EMG sessions with move markers |
| `album_photos` | User photo album entries |
| `user_id_mappings` | Clerk ↔ legacy UUID bridge |

**Storage buckets:** `daily-check-photos`

---

## 7. Sensor Data Flow

```
Hardware Sensor (AMG8833 / MyoWare)
        │
        ▼
MCU / Raspberry Pi (reads I2C/analog, sends over USB / Bluetooth / WiFi)
        │
        ▼
Bridge Script (Node.js / Python on local machine)
  ├── Parses frames (JSON or CSV)
  └── POSTs to Next.js API  ──►  localhost:3000  (dev)
                              └─► production URL  (deployed)
        │
        ▼
Next.js API Route → In-memory store / Supabase
        │
        ▼
Frontend (polling or WebSocket) → Visualization components
```

The bridge scripts target `NEXTJS_API_URL`, which defaults to `http://127.0.0.1:3000/api/thermal/bt` for local development. For production, set it to the Vercel deployment URL. Devices that POST directly over WiFi (without a bridge) use the same URL scheme.

---

## 8. Environment Configuration

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend auth |
| `CLERK_SECRET_KEY` | Clerk server auth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SERIAL_PORT` | Manual serial port override (default: auto) |
| `BAUD_RATE` | Serial baud rate (default: 115200) |
| `THERMAL_INPUT_MODE` | `usb` / `usb_serial` / `bluetooth` |
| `NEXT_PUBLIC_THERMAL_CONNECTION_MODE` | Frontend-visible connection mode |
| `DEBUG_THERMAL` | Enable verbose thermal logging |

See `docs/production/REQUIRED_API_KEYS.md` for full key inventory.

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Daily check completion rate | > 80% of active patients complete daily checks |
| Sensor session success rate | > 90% of initiated sensor sessions produce valid data |
| Caregiver engagement | Caregiver reviews synopsis dashboard >= 3x/week |
| System uptime | 99.5% availability for web application |
| Data latency | Sensor data visible in frontend within 2s of capture |

---

## 10. Constraints & Assumptions

- Sensor hardware is user-provided; CCA does not ship physical devices.
- Bridge scripts require a local machine with USB/Bluetooth access — they cannot run on Vercel. However, the bridge can forward data to either localhost or the production Vercel URL, so the web app itself does not need to run locally for sensors to work.
- WiFi-connected sensors (Pi or ESP32 posting directly) can reach the production URL without a local bridge, provided they have internet access.
- USB-based Raspberry Pi WiFi provisioning assumes the Pi is running the config server (`pi-config-server.py`) and is reachable over USB RNDIS networking.
- The AI synopsis feature depends on sufficient longitudinal data (minimum ~7 days of daily checks).
- Guest mode provides limited functionality; full features require Clerk authentication.
- Video content in `public/videos` is excluded from Vercel deployment (`.vercelignore`) to stay within bundle limits.
