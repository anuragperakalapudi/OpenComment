import {
  PROFILE_FLAG_LABELS,
  US_STATE_NAMES,
  type ProfileFlag,
  type RankingSignal,
  type Regulation,
  type ScoredRegulation,
  type Story,
  type Topic,
  type UserProfile,
} from "./types";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  Healthcare: [
    "health", "medicare", "medicaid", "telehealth", "drug", "prescription",
    "hospital", "clinic", "patient", "insurance", "parity", "mental health",
  ],
  Housing: [
    "housing", "voucher", "tenant", "landlord", "rent", "homeless", "section 8",
    "hud", "fair housing", "evict", "mortgage",
  ],
  Labor: [
    "labor", "worker", "wage", "overtime", "employer", "employee", "contractor",
    "gig", "union", "osha", "workforce", "workplace",
  ],
  Disability: [
    "disability", "ada", "accessib", "caregiver", "home health", "long-term care",
    "wheelchair", "ssi", "ssdi", "service animal",
  ],
  Immigration: [
    "immigration", "visa", "h-1b", "h1b", "asylum", "refugee", "uscis",
    "green card", "naturalization", "border",
  ],
  Environment: [
    "environment", "epa", "air quality", "water", "pfas", "pollution",
    "emission", "climate", "drinking water", "wildlife", "wetland",
  ],
  Education: [
    "education", "student", "loan", "school", "college", "university",
    "title i", "title ix", "fafsa", "borrower", "tuition",
  ],
  Veterans: [
    "veteran", "va", "service member", "gi bill", "military", "tricare",
    "post-9/11", "vbA", "vha",
  ],
  "Small Business": [
    "small business", "sba", "microloan", "entrepreneur", "self-employed",
    "lender", "minority business", "8(a)",
  ],
  "Civil Rights": [
    "civil rights", "discrimination", "voting", "fair housing", "title vi",
    "title vii", "ada", "equal protection", "harassment", "hate crime",
  ],
  "Tax & Finance": [
    "tax", "irs", "treasury", "banking", "credit union", "consumer credit",
    "interest rate", "tax credit", "deduction", "withholding", "1099",
  ],
  "Public Safety": [
    "police", "firearm", "atf", "transportation safety", "emergency",
    "fire safety", "first responder", "9-1-1", "criminal justice", "prison",
  ],
  "Consumer Protection": [
    "consumer", "ftc", "fraud", "deceptive", "unfair practice", "warranty",
    "recall", "data privacy", "robocall", "scam", "product safety",
  ],
};

const FLAG_TOPICS: Record<ProfileFlag, Topic[]> = {
  chronic_illness: ["Healthcare", "Disability"],
  caregiver: ["Healthcare", "Disability"],
  immigrant: ["Immigration"],
  veteran: ["Veterans"],
  environmental_job: ["Environment"],
};

export interface FeedbackWeights {
  agency: Map<string, number>;
  topic: Map<Topic, number>;
}

export interface WhyReason {
  key: string;
  text: string;
}

export function deriveWeights(
  feedback: Array<{ documentId: string; signal: RankingSignal }>,
  rulesById: Map<string, Regulation>,
): FeedbackWeights {
  const agency = new Map<string, number>();
  const topic = new Map<Topic, number>();

  for (const item of feedback) {
    const reg = rulesById.get(item.documentId);
    if (!reg) continue;
    const delta = item.signal === "more_like" ? 1 : -1;
    agency.set(reg.agencyId, (agency.get(reg.agencyId) ?? 0) + delta);
    for (const t of reg.topics) {
      topic.set(t, (topic.get(t) ?? 0) + delta);
    }
  }

  return { agency, topic };
}

function textMentionsState(text: string, stateCode: string): boolean {
  if (!stateCode) return false;
  const name = US_STATE_NAMES[stateCode];
  const lower = text.toLowerCase();
  const hasFullName = !!name && lower.includes(name.toLowerCase());
  const hasCode = new RegExp(`\\b${stateCode}\\b`).test(text);
  return hasFullName || hasCode;
}

function additionalStateBoost(reg: Regulation, profile: UserProfile): number {
  const states = (profile.additionalStates ?? []).filter(
    (s) => s && s !== profile.state,
  );
  if (states.length === 0) return 0;
  const text = `${reg.title} ${reg.summary}`;
  return states.some((s) => textMentionsState(text, s)) ? 1 : 0;
}

function feedbackScore(reg: Regulation, weights?: FeedbackWeights): number {
  if (!weights) return 0;
  const agencyWeight = weights.agency.get(reg.agencyId) ?? 0;
  const topicWeight = reg.topics.reduce(
    (sum, t) => sum + (weights.topic.get(t) ?? 0),
    0,
  );
  return agencyWeight + topicWeight;
}

function semanticPoints(cosine: number | undefined): number {
  if (cosine === undefined || !Number.isFinite(cosine)) return 0;
  return Math.max(0, Math.min(6, ((cosine - 0.72) / 0.18) * 6));
}

function urgencyPoints(daysToClose: number): number {
  if (daysToClose <= 0) return 0;
  if (daysToClose <= 1) return 3;
  if (daysToClose <= 3) return 2;
  if (daysToClose <= 7) return 1.5;
  if (daysToClose <= 14) return 1;
  return 0;
}

function textTopicHits(text: string, topics: Topic[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const topic of topics) {
    const hits = (TOPIC_KEYWORDS[topic] ?? []).filter((k) => lower.includes(k)).length;
    score += Math.min(hits, 2);
  }
  return score;
}

function trackingKeywordBoost(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let boost = 0;
  for (const kw of keywords) {
    const trimmed = kw.trim();
    if (trimmed && lower.includes(trimmed.toLowerCase())) boost += 3;
  }
  return Math.min(boost, 9);
}

function followedAgencyBoost(reg: Regulation, agencies: string[]): number {
  return agencies.includes(reg.agencyId) ? 5 : 0;
}

function storyTagBoost(matchedTopics: Topic[], stories: Story[]): number {
  let boost = 0;
  for (const story of stories) {
    for (const tag of story.tags) {
      if (matchedTopics.includes(tag)) {
        boost += 2;
        break;
      }
    }
  }
  return Math.min(boost, 4);
}

export function scoreRegulation(
  reg: Regulation,
  profile: UserProfile,
  weights?: FeedbackWeights,
  stories?: Story[],
): ScoredRegulation {
  const text = `${reg.title} ${reg.summary} ${reg.documentType}`.toLowerCase();
  const matchedTopics: Topic[] = [];
  let baseScore = 0;

  // Explicit topic matching
  for (const topic of profile.topics) {
    const keywords = TOPIC_KEYWORDS[topic] ?? [];
    const hits = keywords.filter((k) => text.includes(k)).length;
    if (hits > 0) {
      matchedTopics.push(topic);
      baseScore += Math.min(hits, 4);
    }
    if (reg.topics.includes(topic)) {
      baseScore += 4;
      if (!matchedTopics.includes(topic)) matchedTopics.push(topic);
    }
  }

  // Occupation keyword scoring (capped at +2 per topic)
  if (profile.occupation) {
    baseScore += textTopicHits(profile.occupation, profile.topics);
  }

  // Free-text context keyword scoring (capped at +2 per topic)
  if (profile.freeTextContext) {
    baseScore += textTopicHits(profile.freeTextContext, profile.topics);
  }

  // Profile flag implied topic scoring
  for (const flag of profile.profileFlags ?? []) {
    const impliedTopics = FLAG_TOPICS[flag] ?? [];
    for (const impliedTopic of impliedTopics) {
      if (profile.topics.includes(impliedTopic)) continue; // already counted above
      const keywords = TOPIC_KEYWORDS[impliedTopic] ?? [];
      const hits = keywords.filter((k) => text.includes(k)).length;
      if (hits > 0) {
        if (!matchedTopics.includes(impliedTopic)) matchedTopics.push(impliedTopic);
        baseScore += Math.min(hits, 2);
      }
      if (reg.topics.includes(impliedTopic)) {
        baseScore += 2;
        if (!matchedTopics.includes(impliedTopic)) matchedTopics.push(impliedTopic);
      }
    }
  }

  // Recency bump
  const days =
    (Date.now() - new Date(reg.postedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) baseScore += 1;

  // Graduated urgency
  const daysToClose =
    (new Date(reg.commentEndDate).getTime() - Date.now()) /
    (1000 * 60 * 60 * 24);
  baseScore += urgencyPoints(daysToClose);

  baseScore += additionalStateBoost(reg, profile);
  baseScore += trackingKeywordBoost(text, profile.trackingKeywords ?? []);
  baseScore += followedAgencyBoost(reg, profile.followedAgencies ?? []);
  baseScore += storyTagBoost(matchedTopics, stories ?? []);
  baseScore += semanticPoints(reg.semanticScore);
  const score = baseScore + feedbackScore(reg, weights);

  return { ...reg, baseScore, score, matchedTopics };
}

export function rankRegulations(
  regs: Regulation[],
  profile: UserProfile,
  weights?: FeedbackWeights,
  stories?: Story[],
): ScoredRegulation[] {
  return regs
    .map((r) => scoreRegulation(r, profile, weights, stories))
    .sort((a, b) => b.score - a.score);
}

export function matchPercent(score: number, profileTopicCount: number): number {
  if (score <= 0) return 0;
  const maxScore = Math.max(profileTopicCount * 5, 5) + 2;
  const pct = Math.min(99, Math.round((score / maxScore) * 100));
  return Math.max(40, pct);
}

export function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatDeadline(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 30) return `Closes in ${days} days`;
  const d = new Date(dateStr);
  return `Closes ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function buildWhyReasons(
  reg: ScoredRegulation,
  profile: UserProfile,
  stories: Story[],
  weights?: FeedbackWeights,
): WhyReason[] {
  const reasons: WhyReason[] = [];
  const text = `${reg.title} ${reg.summary}`;

  // Most specific: primary state mention
  if (profile.state && textMentionsState(text, profile.state)) {
    const stateName = US_STATE_NAMES[profile.state] ?? profile.state;
    reasons.push({ key: "state", text: `Mentions ${stateName}` });
  }

  // Tracking keyword matches (high specificity)
  const textLower = text.toLowerCase();
  for (const kw of profile.trackingKeywords ?? []) {
    const trimmed = kw.trim();
    if (trimmed && textLower.includes(trimmed.toLowerCase())) {
      reasons.push({ key: `kw-${trimmed}`, text: `Mentions "${trimmed}"` });
    }
  }

  // Followed agency
  if ((profile.followedAgencies ?? []).includes(reg.agencyId)) {
    reasons.push({ key: "agency-follow", text: `You follow ${reg.agencyName}` });
  }

  // Story tag matches
  for (const story of stories) {
    for (const tag of story.tags) {
      if (reg.matchedTopics.includes(tag)) {
        reasons.push({
          key: `story-${story.id}`,
          text: `Your story "${story.title}" covers ${tag}`,
        });
        break;
      }
    }
  }

  // Feedback: agency thumbs up
  if (weights) {
    const agencyWeight = weights.agency.get(reg.agencyId) ?? 0;
    if (agencyWeight > 0) {
      reasons.push({
        key: "feedback-agency",
        text: `You've liked rules from ${reg.agencyName} before`,
      });
    }
  }

  // Occupation keyword match
  if (profile.occupation) {
    const occLower = profile.occupation.toLowerCase();
    const hasOccMatch = reg.matchedTopics.some((t) =>
      (TOPIC_KEYWORDS[t] ?? []).some((k) => occLower.includes(k)),
    );
    if (hasOccMatch) {
      reasons.push({
        key: "occupation",
        text: `Relevant to ${profile.occupation}`,
      });
    }
  }

  // Profile flag matches
  for (const flag of profile.profileFlags ?? []) {
    const impliedTopics = FLAG_TOPICS[flag] ?? [];
    if (impliedTopics.some((t) => reg.matchedTopics.includes(t))) {
      reasons.push({
        key: `flag-${flag}`,
        text: PROFILE_FLAG_LABELS[flag],
      });
    }
  }

  // Topic interest matches
  for (const topic of reg.matchedTopics) {
    if (profile.topics.includes(topic)) {
      reasons.push({ key: `topic-${topic}`, text: `Matches your ${topic} interest` });
    }
  }

  // Urgency (only if closing very soon — otherwise it's noise)
  const daysToClose =
    (new Date(reg.commentEndDate).getTime() - Date.now()) /
    (1000 * 60 * 60 * 24);
  if (daysToClose > 0 && daysToClose <= 7) {
    const d = Math.ceil(daysToClose);
    reasons.push({
      key: "urgency",
      text: d === 1 ? "Closes tomorrow" : `Closes in ${d} days`,
    });
  }

  // Recency
  const daysSincePosted =
    (Date.now() - new Date(reg.postedDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePosted < 7) {
    reasons.push({ key: "recency", text: "Posted this week" });
  }

  // Deduplicate by key and return top 3
  const seen = new Set<string>();
  return reasons
    .filter((r) => {
      if (seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    })
    .slice(0, 3);
}
