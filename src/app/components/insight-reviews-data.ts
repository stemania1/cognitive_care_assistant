export const BORDER = {
  blue: "border-blue-500/80 dark:border-sky-400/90",
  sky: "border-sky-500/80 dark:border-sky-400/90",
  indigo: "border-indigo-500/80 dark:border-indigo-400/90",
} as const;

export type BorderKey = keyof typeof BORDER;

export type InsightReview = {
  id: string;
  border: BorderKey;
  quote: string;
  name: string;
  lines: string[];
};

export const INSIGHT_REVIEWS: InsightReview[] = [
  {
    id: "lodeiro-polinsky",
    border: "blue",
    quote:
      "Families I work with do better when everyday rhythms—hydration, rest, movement, and emotional safety—are supported with clarity and patience. Technology that makes those patterns easier to see, without replacing human connection, can meaningfully protect dignity at home.",
    name: "Dr. Gabriela C Lodeiro-Polinsky, PsyD",
    lines: [
      "Clinical Psychologist · Sarasota, Florida",
      "Clinical Psychology Professional Center LLC",
      "Collaborates with physicians and multidisciplinary medical groups",
      "PsyD · 18+ years of diverse clinical experience",
    ],
  },
  {
    id: "van-passel",
    border: "sky",
    quote:
      "In neurology clinic, clearer data on sleep, routines, and day-to-day function helps families prepare for visits and makes shared decision-making more concrete. Tools that organize that picture—without adding burden—support the kind of longitudinal care we aim for in memory and brain health.",
    name: "Dr. Leonie M. Van Passel, MD",
    lines: [
      "Neurologist · Sarasota Memorial Hospital",
      "Subspecialties: Epilepsy, Neurophysiology, Sleep Medicine",
      "MD, Utrecht University Faculty of Medicine",
      "20+ years in practice · Neurology",
    ],
  },
  {
    id: "travelute",
    border: "blue",
    quote:
      "Meaningful support for dementia rarely lives only in a curriculum—it shows up in how teams learn, iterate, and stay accountable to the people they serve. I value tools that pair client-centered design with clear feedback loops, so programs improve over time in community and home settings, not just on paper.",
    name: "Catherine Travelute, PhD",
    lines: [
      "Learning-focused program implementation & management",
      "20+ years in education · Continuous quality improvement",
      "Mercer University",
      "Sarasota, Florida · She/Her",
    ],
  },
  {
    id: "caregiver-husband",
    border: "indigo",
    quote:
      "I am with my wife all day, every day. Having one place for meds, rest, and little wins keeps me from spiraling when she is confused or sundowning. I still have hard days—but I am not guessing alone at three in the morning anymore.",
    name: "— At-home caregiver",
    lines: ["Caring for his wife · Living at home", "Florida"],
  },
  {
    id: "caregiver-daughter",
    border: "sky",
    quote:
      "Coordinating two parents with different needs felt like a second job. Shared reminders and a simple record of how their days go help my sibling and I stay aligned, and Mom and Dad feel less nagged because the plan is visible to everyone.",
    name: "— Family caregiver",
    lines: ["Caring for her parents · Shared care with siblings", "United States"],
  },
  {
    id: "physician-cna",
    border: "blue",
    quote:
      "I have done bedside turns and vitals as a CNA and now see patients as a physician. Tools that respect how care actually happens at home—and still surface what matters in clinic—bridge a gap I used to see every week. Families should not have to translate chaos into bullet points on their own.",
    name: "— Physician & CNA",
    lines: [
      "Licensed physician · Certified Nursing Assistant background",
      "Clinical and home-based care experience",
    ],
  },
];
