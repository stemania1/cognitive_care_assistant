# Cognitive Care Assistant - Business Plan

## Executive Summary

Cognitive Care Assistant is a comprehensive health-monitoring web platform designed to improve daily life for individuals living with dementia and their caregivers. Created by Corbin Craig and Connor Craig, the application won the 2025 Congressional App Challenge for Florida's District 17. The platform integrates real-time biometric sensor data (EMG and thermal), daily cognitive assessments, medication/nutrition reminders, memory-strengthening games, and a photo album -- all within a secure, accessible web interface.

The dementia care market represents a massive and growing opportunity: nearly 7 million Americans are living with Alzheimer's disease today, with projections reaching 13 million by 2050. Annual care costs exceed $360 billion. Cognitive Care Assistant is positioned to become a category-defining digital health platform that bridges the gap between clinical monitoring and daily at-home care.

---

## 1. Problem Statement

### The Challenge

- **1 in 10 people over age 65** live with some form of dementia, and the number is rising annually.
- Dementia is the **fifth leading cause of death** -- not from the disease itself, but because patients lose the ability to manage vital daily functions.
- **Caregivers are overwhelmed**: 83% of care is provided by family members, with 35% reporting declining health themselves.
- **Clinical monitoring is episodic**: patients are seen periodically, but daily functional decline goes untracked between visits.
- **No unified platform** currently combines real-time biometric monitoring, cognitive assessment, daily care management, and caregiver support in a single accessible tool.

### Who We Serve

| Persona | Needs |
|---------|-------|
| **Patients (early-to-mid stage dementia)** | Maintain independence, daily routines, cognitive engagement, dignity |
| **Family Caregivers** | Peace of mind, real-time health visibility, reduced burden |
| **Professional Caregivers (CNAs, home health aides)** | Efficient tracking, standardized assessments, reporting |
| **Healthcare Professionals (neurologists, neuropsychologists)** | Longitudinal data, trend analysis, early intervention signals |
| **Memory Care / Assisted Living Facilities** | Scalable monitoring, compliance documentation, staff efficiency |

---

## 2. Solution Overview

### Current Platform Capabilities

| Module | Description | Technology |
|--------|-------------|------------|
| **Daily Checks** | Rotating questionnaires that assess cognition, personal memory, and daily experience; photo upload support | Next.js, Supabase, Clerk auth |
| **EMG Muscle Monitoring** | Real-time electromyography via MyoWare 2.0 sensors; workout guidance with video; session recording and history | MyoWare 2.0, ESP32 Bluetooth, Socket.IO, Chart.js |
| **Thermal Sleep Monitoring** | AMG8833 thermal camera on Raspberry Pi; real-time 8x8 heatmap visualization; sleep behavior analysis | AMG8833, Raspberry Pi, Bluetooth/USB, SSE streaming |
| **Medication & Nutrition Reminders** | Configurable medication dosage/timing, hydration reminders, meal tracking with countdown timers and alert notifications | Client-side with alert system |
| **Memory Games** | Memory card matching and jigsaw puzzle games with performance tracking (time, accuracy, completion history) | React, localStorage, Chart.js |
| **Photo Album** | Photo diary from daily questions; chronological gallery with lightbox viewer | Supabase Storage, Clerk auth |
| **Alert Center** | Global notification system for reminders, sensor alerts, and health warnings with severity levels | React Context |
| **Guest Mode** | Anonymous access without account creation for demos and evaluation | Client-side guest ID management |

### Technology Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API routes, Express.js (EMG server), Socket.IO (real-time data)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Clerk (with Supabase integration)
- **Sensors**: MyoWare 2.0 EMG (ESP32 BLE), AMG8833 thermal (Raspberry Pi)
- **Deployment**: Vercel
- **Charts**: Chart.js / react-chartjs-2

---

## 3. Market Analysis

### Total Addressable Market (TAM)

- **Global dementia care market**: $12.2 billion (2024), projected to reach $25.3 billion by 2032 (CAGR 9.5%)
- **Digital health for elderly care**: $18.4 billion (2024), projected $58.6 billion by 2030
- **Remote patient monitoring**: $71.9 billion by 2030

### Serviceable Addressable Market (SAM)

- **U.S. dementia patients**: ~7 million individuals
- **U.S. dementia caregivers**: ~11 million family caregivers
- **Memory care facilities in the U.S.**: ~30,000+
- **Estimated SAM**: $3.2 billion (digital tools for dementia care in the U.S.)

### Serviceable Obtainable Market (SOM)

- **Year 1 target**: 5,000 individual users + 50 care facility pilots
- **Year 3 target**: 100,000 users + 500 facility contracts
- **Estimated SOM**: $15M ARR by Year 3

### Competitive Landscape

| Competitor | Focus | Gap We Fill |
|-----------|-------|-------------|
| CarePredict | Wearable + AI for senior living | No cognitive assessment, no EMG, facility-only |
| MindMate | Cognitive games app | No biometric sensors, no caregiver dashboard |
| Carely | Caregiver coordination | No health monitoring, no cognitive tracking |
| GreatCall/Lively | Emergency response device | Reactive not proactive, no daily monitoring |
| Lumosity | Brain training games | Not designed for dementia, no health integration |

**Our differentiation**: Only platform combining real-time biometric sensors (EMG + thermal), cognitive assessments, daily care management, memory games, and photo-based reminiscence therapy in one unified application.

---

## 4. Business Model

### Revenue Streams

#### B2C: Individual / Family Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | Daily questions (3/day), 1 memory game, basic reminders |
| **Care+ (Family)** | $14.99/mo | Unlimited questions, all games, photo album, caregiver dashboard, email reports |
| **Care+ Pro (Medical)** | $29.99/mo | Everything in Care+, EMG integration, thermal monitoring, data export (CSV), API access, priority support |

#### B2B: Facility / Healthcare Plans

| Plan | Price | Features |
|------|-------|----------|
| **Facility Starter** | $499/mo | Up to 25 residents, staff dashboard, reporting |
| **Facility Professional** | $1,499/mo | Up to 100 residents, sensor integration, API, compliance exports, dedicated support |
| **Enterprise** | Custom | Unlimited residents, white-label, EHR integration, SLA |

#### Additional Revenue

- **Sensor hardware bundles**: MyoWare + Raspberry Pi kits ($149-$299)
- **Professional training / certification**: Caregiver training modules ($99/course)
- **Data insights (anonymized, aggregated)**: Research partnerships with pharmaceutical companies and universities

### Unit Economics (Projected Year 2)

- **Average Revenue Per User (ARPU)**: $18/month (blended B2C)
- **Customer Acquisition Cost (CAC)**: $45 (organic + referral-heavy)
- **Lifetime Value (LTV)**: $648 (36-month average retention)
- **LTV:CAC Ratio**: 14.4x
- **Gross Margin**: 82% (SaaS model, low marginal cost)

---

## 5. Go-to-Market Strategy

### Phase 1: Foundation (Months 1-6)

- **Launch freemium model** with current feature set
- **Congressional App Challenge PR** -- leverage award for media coverage and credibility
- **Caregiver community partnerships**: Alzheimer's Association, AARP, local memory care facilities
- **Content marketing**: Blog, YouTube (sensor setup tutorials, caregiver tips)
- **SEO optimization**: Already implemented (structured data, meta tags, sitemap)

### Phase 2: Growth (Months 6-18)

- **Facility pilot program**: Partner with 10-20 assisted living / memory care facilities
- **Healthcare provider referrals**: Neurologist and PCP partnerships
- **Insurance / Medicare advocacy**: Work toward CPT code coverage for remote monitoring
- **App store launch**: React Native mobile companion app
- **Sensor partnerships**: OEM deals with sensor manufacturers

### Phase 3: Scale (Months 18-36)

- **Enterprise sales team**: Target hospital systems and large facility chains
- **International expansion**: UK, Canada, Australia (English-speaking, aging populations)
- **EHR integration**: Epic, Cerner, Athena Health connectors
- **AI-powered insights**: Predictive decline modeling, automated care recommendations
- **Clinical validation studies**: Partner with academic medical centers

### Distribution Channels

1. **Direct-to-consumer** (website, app stores)
2. **Healthcare provider referral** (neurologists, geriatricians, PCPs)
3. **Facility partnerships** (assisted living, memory care, home health agencies)
4. **Insurance channels** (Medicare Advantage supplemental benefits)
5. **Nonprofit partnerships** (Alzheimer's Association, Area Agencies on Aging)

---

## 6. Financial Projections

### Revenue Forecast

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| B2C Users | 5,000 | 35,000 | 100,000 |
| B2C Revenue | $360K | $3.8M | $10.8M |
| B2B Facilities | 50 | 200 | 500 |
| B2B Revenue | $240K | $1.8M | $4.5M |
| **Total Revenue** | **$600K** | **$5.6M** | **$15.3M** |
| **Gross Margin** | 78% | 82% | 85% |

### Expense Forecast

| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| Engineering | $400K | $1.2M | $2.5M |
| Sales & Marketing | $200K | $1.0M | $2.0M |
| Operations / Support | $100K | $400K | $800K |
| Infrastructure (Vercel, Supabase, etc.) | $50K | $200K | $500K |
| General & Administrative | $100K | $300K | $600K |
| **Total Expenses** | **$850K** | **$3.1M** | **$6.4M** |
| **Net Income** | **-$250K** | **$2.5M** | **$8.9M** |

### Funding Requirements

- **Seed Round**: $1.5M (product development, initial hiring, facility pilots)
- **Series A** (Month 18): $8M (sales team, mobile app, AI features, clinical trials)
- Use of funds: 50% engineering, 25% sales/marketing, 15% operations, 10% reserve

---

## 7. Team & Hiring Plan

### Current Team

- **Corbin Craig** - Co-founder, Lead Developer
- **Connor Craig** - Co-founder, Product Design

### Key Hires (Year 1)

| Role | Priority | Rationale |
|------|----------|-----------|
| CTO / Senior Full-Stack Engineer | Critical | Scale architecture, security hardening |
| Clinical Advisor (Neuropsychologist) | Critical | Validate assessments, guide clinical features |
| Product Designer (UX/Accessibility) | High | Optimize for elderly/impaired users |
| Mobile Developer (React Native) | High | iOS/Android companion app |
| Sales Lead (Healthcare) | High | Facility partnerships, insurance channels |
| Data Scientist / ML Engineer | Medium | AI features, predictive analytics |
| Customer Success Manager | Medium | User onboarding, facility support |

---

## 8. Regulatory & Compliance Roadmap

| Milestone | Timeline | Details |
|-----------|----------|---------|
| HIPAA compliance | Months 1-3 | BAA with Supabase/Vercel, encryption at rest/transit, audit logging |
| SOC 2 Type I | Months 6-9 | Security controls documentation and audit |
| FDA Class I (wellness device) | Months 6-12 | Classify as general wellness product, not diagnostic |
| IRB-approved clinical study | Months 12-18 | Partner with university medical center |
| FDA 510(k) consideration | Months 18-24 | If pursuing diagnostic claims |
| CE marking (EU) | Months 24-30 | European market entry |

---

## 9. Key Metrics & Milestones

### Year 1 KPIs

- 5,000 registered users
- 50 facility pilot deployments
- Daily active user rate > 40%
- Net Promoter Score > 50
- $600K ARR
- HIPAA compliance achieved
- Mobile app launched

### Year 2 KPIs

- 35,000 registered users
- 200 facility contracts
- $5.6M ARR
- 3 clinical partnership agreements
- AI-powered insights feature launched
- SOC 2 certification

### Year 3 KPIs

- 100,000 registered users
- 500 facility contracts
- $15.3M ARR
- FDA regulatory pathway established
- International expansion initiated
- Series A+ or profitability

---

## 10. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Regulatory (HIPAA/FDA) | High | Early legal counsel, compliance-first architecture |
| User adoption (elderly users) | High | Caregiver-mediated onboarding, accessibility-first design |
| Data privacy breach | Critical | End-to-end encryption, RLS, SOC 2, penetration testing |
| Sensor reliability | Medium | Hardware QA, graceful degradation, demo mode fallbacks |
| Competitive entry by big tech | Medium | First-mover in integrated niche, clinical validation moat |
| Reimbursement uncertainty | Medium | Diverse revenue streams, don't depend on insurance alone |
| Founder experience gap | Medium | Advisory board of healthcare executives, clinical experts |

---

## Appendix: Congressional App Challenge Recognition

Cognitive Care Assistant was selected as the winner of the 2025 Congressional App Challenge for Florida's 17th District. This recognition validates the platform's social impact and provides:
- National visibility among policymakers
- Credibility with healthcare institutions
- Media coverage opportunities
- Network access to technology and healthcare leaders
