export type DementiaStage = {
  id: number;
  title: string;
  summary: string;
  bulletins: string[];
};

export const DEMENTIA_STAGES: DementiaStage[] = [
  {
    id: 1,
    title: "Stage 1 – No Cognitive Decline",
    summary: "Healthy baseline; no noticeable memory issues.",
    bulletins: [
      "Set up profiles and gather baseline data from EMG workouts, sleep behaviors, and daily reminders.",
      "Invite caregivers to explore the dashboard tabs together to build routine familiarity early.",
    ],
  },
  {
    id: 2,
    title: "Stage 2 – Very Mild Cognitive Decline",
    summary: "Occasional forgetfulness that is within normal limits.",
    bulletins: [
      "Use the Reminders hub to schedule hydration, meals, and medicine prompts before lapses increase.",
      "Capture caregiver notes in the assessment modules so trends are easy to spot later.",
    ],
  },
  {
    id: 3,
    title: "Stage 3 – Mild Cognitive Decline",
    summary: "Memory lapses become more noticeable to close friends and family.",
    bulletins: [
      "Turn on smart reminders for repetitive tasks—switch to visual countdown mode for clarity.",
      "Pair EMG exercise videos with guided instructions to reinforce movement patterns through muscle memory.",
      "Log sleep behaviors nightly to ensure restlessness or wandering is flagged early.",
    ],
  },
  {
    id: 4,
    title: "Stage 4 – Moderate Cognitive Decline",
    summary: "Clear challenges with complex tasks and recent events.",
    bulletins: [
      "Use the Sleep Behaviors thermal alerts to notify caregivers when the participant leaves bed.",
      "Enable caregiver summaries so the app emails or exports alerts after each session.",
      "Simplify dashboards by starring the three most-used tiles (Sleep, Reminders, EMG).",
    ],
  },
  {
    id: 5,
    title: "Stage 5 – Moderately Severe Cognitive Decline",
    summary: "Assistance needed with daily activities; noticeable gaps in memory.",
    bulletins: [
      "Leverage routine-based reminder packs (hygiene, meals, meds) to maintain independence cues.",
      "Record personalized audio prompts in the Reminders module for comforting guidance.",
      "Share EMG session summaries with clinicians to adjust mobility plans.",
    ],
  },
  {
    id: 6,
    title: "Stage 6 – Severe Cognitive Decline",
    summary: "Personality changes, disrupted sleep, and increased caregiver load.",
    bulletins: [
      "Activate automated alert routing via the mail icon so every high-temp, restlessness, or motion warning reaches caregivers instantly.",
      "Use the Sleep Behaviors dashboard to document wandering patterns for safety planning.",
      "Export daily recap PDFs for care teams to synchronize interventions.",
    ],
  },
  {
    id: 7,
    title: "Stage 7 – Very Severe Cognitive Decline",
    summary: "Loss of verbal abilities and motor control; extensive care required.",
    bulletins: [
      "Track EMG activity for passive range-of-motion exercises to reduce muscle stiffness.",
      "Log every alert event to inform hospice or long-term care teams of comfort needs.",
      "Focus on sensory cues—use calm music and thermal monitoring to maintain comfort.",
    ],
  },
];

export type MedicationEducation = {
  category: string;
  examples: string;
  role: string;
  notes: string[];
};

/** General educational overview only — not medical advice. */
export const DEMENTIA_MEDICATION_EDUCATION: MedicationEducation[] = [
  {
    category: "Cholinesterase inhibitors",
    examples: "Donepezil, rivastigmine, galantamine",
    role: "Often prescribed for mild to moderate Alzheimer’s disease symptoms; may temporarily help memory or thinking for some people.",
    notes: [
      "Common side effects can include nausea, diarrhea, or loss of appetite.",
      "Does not stop disease progression; benefits vary by person.",
    ],
  },
  {
    category: "NMDA receptor antagonist",
    examples: "Memantine",
    role: "Sometimes used for moderate to severe Alzheimer’s disease; works on a different brain pathway than cholinesterase inhibitors.",
    notes: [
      "Side effects may include dizziness, headache, or constipation.",
      "Dosing is adjusted carefully, especially if kidney function changes.",
    ],
  },
  {
    category: "Anti-amyloid monoclonal antibodies",
    examples: "Prescription products used under strict protocols (e.g., lecanemab, donanemab)",
    role: "Designed to reduce amyloid plaques in certain patients with early Alzheimer’s disease who meet specific criteria.",
    notes: [
      "Requires MRI monitoring and specialist oversight; not appropriate for everyone.",
      "Benefits and risks must be discussed with a neurologist or memory clinic.",
    ],
  },
  {
    category: "Symptom-focused medications",
    examples: "Antidepressants, anxiolytics, sleep medicines (as prescribed)",
    role: "Sometimes used short-term or carefully for mood, sleep, or agitation when non-drug approaches are not enough.",
    notes: [
      "Older adults may be more sensitive to sedation and fall risk.",
      "Never start, stop, or change these without the prescribing clinician.",
    ],
  },
];

export const DEMENTIA_EDUCATION_DISCLAIMER =
  "This app provides general education only, not medical advice. Diagnosis, treatment, and medication decisions belong to licensed clinicians who know the patient’s full history. Call emergency services for urgent symptoms.";
