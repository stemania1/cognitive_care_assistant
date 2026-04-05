# Cognitive Care Assistant - U.S. Copyright Registration Application

## Prepared for Filing with the U.S. Copyright Office (eCO Online System)

**Date Prepared**: April 5, 2026
**Application Type**: Literary Work (Computer Program)
**Filing Method**: Electronic Copyright Office (eCO) at https://eco.copyright.gov

---

## SECTION 1: TYPE OF WORK

- **Type of Work**: Literary Work
- **Subtype**: Computer Program

---

## SECTION 2: TITLE INFORMATION

### Title of This Work

- **Title**: Cognitive Care Assistant
- **Title Type**: Title of work being registered

### Previous or Alternative Title(s)

- CCA
- Cognitive Care Assistant Health Monitoring Platform
- Care Together (loading screen name)

---

## SECTION 3: COMPLETION / PUBLICATION

### Year of Completion

- **Year Completed**: 2025
- **Date of First Creation**: November 10, 2025

### Date of First Publication

- **Date of First Publication**: November 2025
- **Nation of First Publication**: United States of America
- **Published as**: Web application deployed at https://cognitive-care-assistant.vercel.app

---

## SECTION 4: AUTHOR(S)

### Author 1

- **Name**: Corbin Craig
- **Year of Birth**: (to be filled by applicant)
- **Citizenship / Domicile**: United States of America
- **Author's Contribution**: Computer program (source code), text, user interface design, data architecture, sensor integration code, algorithm design
- **Work Made for Hire**: No
- **Pseudonymous**: No
- **Anonymous**: No

### Author 2

- **Name**: Connor Craig
- **Year of Birth**: (to be filled by applicant)
- **Citizenship / Domicile**: United States of America
- **Author's Contribution**: Computer program (source code), text, user interface design, product design
- **Work Made for Hire**: No
- **Pseudonymous**: No
- **Anonymous**: No

---

## SECTION 5: CLAIMANT(S)

### Copyright Claimant 1

- **Name**: Corbin Craig
- **Address**: (to be filled by applicant)
- **City, State, ZIP**: (to be filled by applicant)

### Copyright Claimant 2

- **Name**: Connor Craig
- **Address**: (to be filled by applicant)
- **City, State, ZIP**: (to be filled by applicant)

### Transfer Statement

Not applicable (authors are the claimants).

---

## SECTION 6: LIMITATION OF CLAIM

### Material Excluded from This Claim

The following third-party and open-source components are **excluded** from this copyright claim:

| Component | License | Usage |
|-----------|---------|-------|
| Next.js (v16.1.1) | MIT License | Web application framework |
| React (v19.2.3) | MIT License | UI library |
| React DOM (v19.2.3) | MIT License | DOM rendering |
| Tailwind CSS (v4) | MIT License | CSS utility framework |
| TypeScript (v5) | Apache 2.0 | Programming language |
| Supabase JS Client (v2.58.0) | MIT License | Database client |
| Clerk/NextJS (v6.36.7) | MIT License | Authentication |
| Clerk/Localizations (v4.3.0) | MIT License | Localization support |
| Chart.js (v4.5.0) | MIT License | Charting library |
| react-chartjs-2 (v5.3.0) | MIT License | React Chart.js wrapper |
| Express (v5.1.0) | MIT License | HTTP server framework |
| Socket.IO (v4.8.1) | MIT License | Real-time communication |
| Socket.IO Client (v4.8.1) | MIT License | WebSocket client |
| serialport (v13.0.0) | MIT License | Serial port communication |
| @serialport/parser-readline (v13.0.0) | MIT License | Serial data parsing |
| node-fetch (v3.3.2) | MIT License | HTTP requests |
| cors (v2.8.5) | MIT License | CORS middleware |
| dotenv (v17.2.3) | BSD-2-Clause | Environment variables |
| concurrently (v9.2.1) | MIT License | Process runner |
| PDFKit (v0.17.2) | MIT License | PDF generation |
| @hcaptcha/react-hcaptcha (v1.14.0) | MIT License | CAPTCHA integration |
| Geist Font | SIL Open Font License | Typography |
| PostCSS | MIT License | CSS processing |

### New Material Included in This Claim

This claim covers the following **original authorship** by Corbin Craig and Connor Craig:

- **Computer program source code**: All original TypeScript, JavaScript, Python, Arduino (C++), PowerShell, and Bash source files (~30,893 lines across 111+ files)
- **Text content**: Daily assessment questions, health metric descriptions, workout instructions, application copy, user interface text, dementia stage educational content
- **User interface design**: Page layouts, component architecture, visual design, interaction patterns, responsive design system, dark/light theme system
- **Data architecture**: Database schema design (14 migrations), API endpoint design (20+ routes), data models, Row Level Security policies
- **Algorithms and processing logic**: EMG signal processing, thermal heatmap analysis, move detection, voltage calculation, pattern stability metrics, thermal event detection
- **Sensor integration architecture**: MyoWare 2.0 EMG Bluetooth/WiFi bridge, AMG8833 thermal camera communication protocol, multi-connection fallback system (WiFi/Bluetooth/USB), ESP32 firmware, Raspberry Pi sensor scripts
- **Configuration and build system**: Custom build configuration, deployment scripts, development environment tooling

---

## SECTION 7: DESCRIPTION OF THE WORK

### Descriptive Statement

Cognitive Care Assistant is an original computer program comprising a comprehensive health-monitoring web platform designed for individuals living with dementia and their caregivers. The software integrates real-time biometric sensor data collection, cognitive health assessments, daily care management, and memory-strengthening exercises into a unified web application.

### Detailed Description of Copyrightable Elements

**1. Web Application Source Code (TypeScript/React)**
A full-stack web application built with Next.js and React, containing 111+ original source files totaling approximately 24,746 lines of code in the `/src` directory. This includes:
- 22 page components implementing distinct application features
- 25+ reusable UI components with original design patterns
- 10 API route handlers managing data persistence and real-time communication
- 9 utility modules for data processing, chart rendering, and date manipulation
- 6 custom React hooks for state management and data fetching
- 5 type definition modules defining the application's data model
- 4 constants modules defining questions, workouts, and metrics

**2. Sensor Integration Code**
Original hardware integration code (~5,166 lines) implementing:
- EMG (electromyography) data acquisition from MyoWare 2.0 sensors via ESP32 microcontrollers, including Bluetooth SPP and WiFi communication protocols
- Thermal imaging data acquisition from AMG8833 infrared sensors via Raspberry Pi, including Bluetooth RFCOMM, USB serial, and WiFi streaming protocols
- Arduino/C++ firmware for ESP32 Bluetooth Low Energy EMG transmission
- Python server scripts for Raspberry Pi thermal sensor operation
- Node.js bridge services for serial port Bluetooth communication
- Real-time data streaming via Server-Sent Events and WebSocket

**3. Database Architecture**
Original database schema design with 14 sequential migration files defining:
- 5 PostgreSQL tables (daily_checks, daily_check_sessions, emg_sessions, thermal_sessions, user_id_mappings)
- Row Level Security (RLS) policies for data isolation
- Custom trigger functions for automatic timestamp management
- Indexing strategies for performance optimization
- Progressive schema evolution (photo support, JSONB migration, session numbering, move events)

**4. Signal Processing Algorithms**
Original data processing logic including:
- EMG voltage calculation and muscle activity percentage derivation from raw analog sensor values
- Move detection algorithm using voltage change thresholds with configurable sensitivity
- Thermal heatmap variance analysis for sleep behavior pattern detection
- Temperature baseline calculation and thermal event detection
- Pattern stability metrics computation
- Statistical aggregation (mean, max, min, range) for session analysis

**5. User Interface Design and Text**
Original visual design including:
- Responsive layout system with gradient-based visual theming
- Dark/light mode system with localStorage persistence
- Accessibility features (ARIA labels, screen reader announcements, keyboard navigation)
- Confetti animation system for game completion celebrations
- Real-time chart visualization configurations for EMG and thermal data
- Thermal heatmap canvas rendering with color gradient mapping
- 20 original daily cognitive assessment questions designed for dementia patients
- 6 guided workout exercise descriptions with sensor placement instructions

**6. Application Architecture**
Original architectural design including:
- Multi-authentication system (Clerk primary, Supabase legacy, guest mode) with user ID mapping migration strategy
- Multi-connection sensor architecture with automatic fallback (WiFi -> Bluetooth -> USB)
- Alert center system with severity levels, deduplication, and countdown timers
- Guest data management system with localStorage-based temporary accounts
- CSV data export system for clinical use
- Session recording and history system for both EMG and thermal data

---

## SECTION 8: SPECIAL HANDLING

- **Special Handling Request**: No
- **Basis for Special Handling**: Not applicable

---

## SECTION 9: CORRESPONDENCE CONTACT

- **Name**: (to be filled by applicant)
- **Email**: (to be filled by applicant)
- **Phone**: (to be filled by applicant)
- **Address**: (to be filled by applicant)

---

## SECTION 10: MAIL CERTIFICATE TO

- **Name**: Corbin Craig
- **Address**: (to be filled by applicant)
- **City, State, ZIP**: (to be filled by applicant)

---

## SECTION 11: CERTIFICATION

I, the undersigned, hereby certify that I am the **author/copyright claimant** of the work identified in this application and that the statements made by me in this application are correct to the best of my knowledge.

- **Certifying Party**: Author
- **Typed Name**: ____________________________
- **Date**: ____________________________

---

## SECTION 12: DEPOSIT MATERIALS

### Deposit Requirement

For computer programs, the Copyright Office requires one of the following deposit options:

### Option A: First 25 and Last 25 Pages (RECOMMENDED - ALREADY PREPARED)

A PDF containing the first 25 pages and last 25 pages of source code has already been generated:

- **File**: `codebase-copyright-deposit.pdf` (90 KB)
- **Generated by**: `scripts/generate-code-pdf.js`
- **Content**: First 25 pages and last 25 pages of all TypeScript/JavaScript source files in the `/src` directory, with line numbers and file path headers

**To regenerate**: `npm run code-pdf`

### Option B: First 25 and Last 25 Pages with Trade Secret Redaction

If portions of the code contain trade secrets, you may block out specific sections and submit with a cover letter explaining the redaction.

### Option C: Complete Source Code (50 pages or fewer)

Not applicable -- the source code exceeds 50 pages.

### Option D: Object Code Deposit with Identifying Material

Submit the compiled/built application with screenshots and a written description. This option provides a weaker presumption of copyrightability.

### Recommended Filing Approach

1. **Use Option A** (already prepared as `codebase-copyright-deposit.pdf`)
2. Upload the PDF as the deposit copy in the eCO system
3. Additionally consider uploading `codebase-overview.pdf` (93 KB) as supplementary material

---

## SECTION 13: FILING FEE

- **Standard Online Filing Fee (eCO)**: $65 (single author, single work) or $55 (single author)
- **Note**: Fee for a work with 2 authors (joint work) is $65 as of 2026; verify current fee at https://www.copyright.gov/about/fees.html

---

## FILING INSTRUCTIONS

### Step-by-Step eCO Filing Process

1. **Create an account** at https://eco.copyright.gov (if not already registered)
2. **Start a new claim**: Select "Register a New Claim"
3. **Type of Work**: Select "Literary Work"
4. **Fill in Sections 1-10** using the information above
5. **Upload deposit**: Upload `codebase-copyright-deposit.pdf`
6. **Pay filing fee**: $65 via credit card, debit card, or Copyright Office deposit account
7. **Submit**: Review and submit the application
8. **Processing time**: Typically 3-10 months for standard processing

### Fields Requiring Applicant Input

The following fields are marked "(to be filled by applicant)" and must be completed before filing:

- [ ] Author 1 (Corbin Craig) - Year of Birth
- [ ] Author 2 (Connor Craig) - Year of Birth
- [ ] Claimant 1 - Full mailing address
- [ ] Claimant 2 - Full mailing address
- [ ] Correspondence Contact - Name, email, phone, address
- [ ] Mail Certificate To - Full mailing address
- [ ] Certification - Typed signature and date

---

## ADDITIONAL NOTES

### Congressional App Challenge Recognition

This work was recognized as the winner of the 2025 Congressional App Challenge for Florida's 17th Congressional District. This recognition may be referenced in correspondence with the Copyright Office as evidence of the work's public dissemination and recognition.

### Prior Versions

This registration covers the work as of its current state (April 2026). If substantial new authorship is added in the future, a supplementary or new registration may be filed for subsequent versions.

### Joint Work

This is a joint work by Corbin Craig and Connor Craig. Under 17 U.S.C. Section 101, a "joint work" is a work prepared by two or more authors with the intention that their contributions be merged into inseparable or interdependent parts of a unitary whole. Both authors share equal, undivided copyright ownership unless otherwise agreed in writing.
