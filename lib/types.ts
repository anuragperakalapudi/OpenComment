export type Topic =
  | "Healthcare"
  | "Housing"
  | "Labor"
  | "Disability"
  | "Immigration"
  | "Environment"
  | "Education"
  | "Veterans"
  | "Small Business"
  | "Civil Rights"
  | "Tax & Finance"
  | "Public Safety"
  | "Consumer Protection";

export const ALL_TOPICS: Topic[] = [
  "Healthcare",
  "Housing",
  "Labor",
  "Disability",
  "Immigration",
  "Environment",
  "Education",
  "Veterans",
  "Small Business",
  "Civil Rights",
  "Tax & Finance",
  "Public Safety",
  "Consumer Protection",
];

export type AgeRange = "18–24" | "25–34" | "35–44" | "45–54" | "55–64" | "65+";
export const AGE_RANGES: AgeRange[] = [
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
];

export type IncomeBracket =
  | "Under $25k"
  | "$25k–$50k"
  | "$50k–$100k"
  | "$100k–$200k"
  | "$200k+"
  | "Prefer not to say";

export const INCOME_BRACKETS: IncomeBracket[] = [
  "Under $25k",
  "$25k–$50k",
  "$50k–$100k",
  "$100k–$200k",
  "$200k+",
  "Prefer not to say",
];

export type HouseholdStatus =
  | "Single"
  | "Married, no kids"
  | "Married with kids"
  | "Single parent"
  | "Living with family"
  | "Other";

export const HOUSEHOLD_STATUSES: HouseholdStatus[] = [
  "Single",
  "Married, no kids",
  "Married with kids",
  "Single parent",
  "Living with family",
  "Other",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "the District of Columbia",
};

export type ProfileFlag =
  | "chronic_illness"
  | "caregiver"
  | "immigrant"
  | "veteran"
  | "environmental_job";

export const ALL_PROFILE_FLAGS: ProfileFlag[] = [
  "chronic_illness",
  "caregiver",
  "immigrant",
  "veteran",
  "environmental_job",
];

export const PROFILE_FLAG_LABELS: Record<ProfileFlag, string> = {
  chronic_illness: "Living with a chronic illness",
  caregiver: "Caregiver (child, elder, or family member)",
  immigrant: "Immigrant or navigating immigration",
  veteran: "Veteran or active-duty family member",
  environmental_job: "Work in an environment-dependent job",
};

export interface UserProfile {
  displayName?: string;
  ageRange: AgeRange;
  occupation: string;
  state: string;
  income: IncomeBracket;
  household: HouseholdStatus;
  topics: Topic[];
  freeTextContext?: string;
  additionalStates?: string[];
  profileFlags?: ProfileFlag[];
  trackingKeywords?: string[];
  followedAgencies?: string[];
  situations?: Situation[];
  createdAt: string;
}

export const FREE_TEXT_CONTEXT_LIMIT = 500;

export type SituationType = "livelihood" | "health" | "family" | "community";

export interface Situation {
  id: string;
  type: SituationType;
  text: string;
}

export const MAX_SITUATIONS = 4;
export const SITUATION_CHAR_LIMIT = 300;

export const SITUATION_PROMPTS: Record<SituationType, { label: string; placeholder: string }> = {
  livelihood: {
    label: "My livelihood",
    placeholder: "I work as a home health aide and care for 3 patients daily. Changes to Medicaid reimbursement rates would cut my income.",
  },
  health: {
    label: "My health",
    placeholder: "I have Type 2 diabetes and rely on insulin. My medication costs $400/month without insurance.",
  },
  family: {
    label: "My family",
    placeholder: "I'm a single parent with two kids. We live in rural Texas, 45 minutes from the nearest hospital.",
  },
  community: {
    label: "My community",
    placeholder: "My neighborhood has high asthma rates due to a nearby facility. We've pushed for cleaner air for years.",
  },
};

export const COMMON_AGENCIES: { id: string; name: string }[] = [
  { id: "EPA", name: "EPA — Environmental Protection" },
  { id: "HHS", name: "HHS — Health & Human Services" },
  { id: "DOL", name: "DOL — Labor" },
  { id: "CFPB", name: "CFPB — Consumer Finance" },
  { id: "ED", name: "ED — Education" },
  { id: "VA", name: "VA — Veterans Affairs" },
  { id: "USCIS", name: "USCIS — Immigration" },
  { id: "SBA", name: "SBA — Small Business" },
  { id: "HUD", name: "HUD — Housing" },
  { id: "DOT", name: "DOT — Transportation" },
  { id: "FDA", name: "FDA — Food & Drug" },
  { id: "CMS", name: "CMS — Medicare & Medicaid" },
  { id: "FTC", name: "FTC — Trade Commission" },
  { id: "DOJ", name: "DOJ — Justice" },
  { id: "IRS", name: "IRS — Internal Revenue" },
  { id: "OSHA", name: "OSHA — Occupational Safety" },
  { id: "USDA", name: "USDA — Agriculture" },
  { id: "ATF", name: "ATF — Alcohol Tobacco Firearms" },
];

export const MAX_STORIES = 5;

export interface Story {
  id: string;
  userId: string;
  title: string;
  body: string;
  tags: Topic[];
  createdAt: string;
  updatedAt: string;
}

export type RankingSignal = "more_like" | "less_like";

export interface Regulation {
  id: string;
  docketId?: string;
  agencyId: string;
  agencyName: string;
  title: string;
  summary: string;
  documentType: string;
  postedDate: string;
  commentEndDate: string;
  topics: Topic[];
  excerpt?: string;
  provisions?: string[];
  semanticScore?: number;
  regulationsGovUrl: string;
  source: "api" | "mock";
}

export interface ScoredRegulation extends Regulation {
  baseScore: number;
  score: number;
  matchedTopics: Topic[];
}
