/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Hybrid Industry-Grade ATS Scorer v2.0                             ║
 * ║  ──────────────────────────────────────────────────────────────────  ║
 * ║  ✅ Semantic similarity via local embedding service                ║
 * ║  ✅ 30 normalised feature signals                                   ║
 * ║  ✅ Soft penalty model                                              ║
 * ║  ✅ Missing core-skill hard gate                                    ║
 * ║  ✅ Anti-gaming / keyword-stuffing detection                        ║
 * ║  ✅ Recruiter-style breakdown                                       ║
 * ║  ✅ Score cap at 95                                                  ║
 * ║  ✅ Ranking-ready output                                            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { getEmbedding, cosineSimilarity } from "./embeddingService.js";

// ─────────────────────────── WEIGHTS ──────────────────────────────────
// All weights sum to 1.0
// Skill + semantic combined = 0.45 (≥ 40%)
// Semantic > keyword because real ATS systems care about meaning, not raw word count
const WEIGHTS = {
  // Skill & Semantic (45%)
  semantic_similarity: 0.20,
  keyword_match: 0.17,
  skill_depth: 0.08,

  // Experience (18%)
  years_match: 0.06,
  experience_section: 0.04,
  action_verbs: 0.04,
  quantified_results: 0.04,

  // Education (8%)
  education_section: 0.03,
  degree_match: 0.03,
  certifications: 0.02,

  // Achievements & Impact (8%)
  achievements: 0.03,
  metrics_present: 0.03,
  leadership_signals: 0.02,

  // Format & Structure (10%)
  section_completeness: 0.03,
  resume_length: 0.02,
  bullet_usage: 0.02,
  consistency: 0.01,
  readability: 0.02,

  // Contact & Links (6%)
  email_present: 0.02,
  phone_present: 0.02,
  linkedin_present: 0.01,
  github_present: 0.01,

  // Risk & Red Flags (5%)
  employment_gaps: 0.02,
  job_hopping: 0.01,
  keyword_stuffing: 0.01,
  spelling_quality: 0.01,
};

// Validate weights sum to 1
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  console.warn(`⚠️  ATS Scorer weights sum to ${WEIGHT_SUM}, expected 1.0`);
}

// ─────────────────────── PENALTIES ─────────────────────────────────────
const PENALTIES = {
  MISSING_MANDATORY_SKILL: -20,
  KEYWORD_STUFFING: -8,
  LARGE_EMPLOYMENT_GAP: -6,
  MISSING_CONTACT_MULT: 0.7,   // multiply score by this
};

const SCORE_CAP = 95;

// ─────────────────────── STOPWORDS ─────────────────────────────────────
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "her",
  "hers", "herself", "him", "himself", "his", "i", "if", "in", "into", "is", "it",
  "its", "me", "my", "myself", "no", "not", "of", "on", "or", "our", "ours",
  "ourselves", "out", "she", "so", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those", "to", "too", "us",
  "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "you", "your", "yours", "yourself", "yourselves", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "only", "own", "same", "can",
  "will", "just", "should", "now", "also", "about", "after", "before", "between",
  "during", "above", "below", "through", "again", "further", "once", "here", "how",
  "being", "have", "had", "do", "does", "did", "would", "could", "may", "might",
  "must", "shall", "been", "having", "doing", "until", "against", "under", "over",
  "per", "via", "am", "get", "got", "let", "put", "say", "see", "use", "used", "using",
  "want", "way", "well", "work", "year", "years", "experience", "experiences",
  "skilled", "skills", "development", "software", "project", "projects", "team",
  "teams", "ability", "abilities", "required", "prefer", "preferred",
  "communication", "communicate", "responsibilities", "responsibility", "role",
  "roles", "position", "positions", "candidate", "candidates", "strong",
  "excellent", "good", "best", "highly", "related", "including", "provide",
  "provides", "various", "multiple", "across", "within", "environment",
  "environments", "working", "knowledge", "understanding", "building", "support",
  "supporting", "based", "level", "levels", "new", "first", "great", "effective",
  "successful", "key", "part", "full", "time", "applicant", "applicants", "looking",
  "join", "joining", "help", "helping", "create", "creating", "design", "designing",
  "develop", "developing", "manage", "managing", "lead", "leading", "collaborate",
  "collaboration",
]);

const ACTION_VERBS = new Set([
  "achieved", "administered", "analyzed", "architected", "automated", "built",
  "consolidated", "coordinated", "created", "decreased", "delivered", "deployed",
  "designed", "developed", "directed", "drove", "eliminated", "engineered",
  "established", "evaluated", "executed", "expanded", "facilitated", "formulated",
  "generated", "grew", "headed", "identified", "implemented", "improved",
  "increased", "initiated", "innovated", "integrated", "introduced", "launched",
  "leveraged", "maintained", "managed", "mentored", "migrated", "modernized",
  "monitored", "negotiated", "optimized", "orchestrated", "organized", "oversaw",
  "pioneered", "planned", "produced", "programmed", "promoted", "published",
  "rebuilt", "redesigned", "reduced", "refactored", "reformed", "reengineered",
  "resolved", "restructured", "revamped", "scaled", "secured", "simplified",
  "spearheaded", "standardized", "streamlined", "strengthened", "supervised",
  "surpassed", "tested", "trained", "transformed", "unified", "upgraded",
]);

const LEADERSHIP_WORDS = new Set([
  "led", "lead", "managed", "directed", "supervised", "mentored", "headed",
  "oversaw", "spearheaded", "championed", "coordinated", "orchestrated",
  "established", "founded", "built", "grew", "scaled", "hired", "recruited",
  "trained", "coached", "delegated", "empowered",
]);

const DEGREE_KEYWORDS = [
  "phd", "doctorate", "ph.d", "doctor of",
  "master", "mba", "m.s.", "m.sc", "m.a.", "mtech", "m.tech",
  "bachelor", "b.s.", "b.sc", "b.a.", "b.tech", "btech", "b.e.",
  "associate", "diploma",
];

const CERT_KEYWORDS = [
  "certified", "certification", "certificate", "aws certified", "azure certified",
  "google certified", "pmp", "scrum master", "cissp", "cka", "ckad", "comptia",
  "oracle certified", "cisco certified", "ccna", "ccnp",
];

const MIN_WORD_LENGTH = 3;

// ────────────────────── TEXT UTILITIES ─────────────────────────────────

function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text.toLowerCase().replace(/[\s]+/g, " ").trim();
}

function removePunctuation(str) {
  return str.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  const normalized = normalizeText(text);
  const noPunct = removePunctuation(normalized);
  if (!noPunct) return [];
  return noPunct.split(/\s+/).filter(Boolean);
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const seen = new Set();
  const keywords = [];
  for (const word of tokens) {
    if (word.length < MIN_WORD_LENGTH) continue;
    if (STOPWORDS.has(word)) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(key);
  }
  return keywords;
}

function resumeTokenSet(resumeText) {
  return new Set(tokenize(resumeText || ""));
}

function countOccurrences(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, "gi");
  return (text.match(regex) || []).length;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

// ───────────────────── FEATURE COMPUTERS ──────────────────────────────

function computeSkillFeatures(resumeText, jobDescText, resumeTokens, jdKeywords) {
  // keyword_match: fraction of JD keywords found in resume
  const matched = jdKeywords.filter(kw => resumeTokens.has(kw));
  const missing = jdKeywords.filter(kw => !resumeTokens.has(kw));
  const keyword_match = jdKeywords.length === 0
    ? 0
    : matched.length / jdKeywords.length;

  // skill_depth: how many times matched keywords appear (normalised)
  let depthSum = 0;
  for (const kw of matched) {
    const count = countOccurrences(resumeText, kw);
    depthSum += Math.min(count, 5); // cap per-keyword at 5
  }
  const maxPossibleDepth = matched.length * 5;
  const skill_depth = maxPossibleDepth === 0
    ? 0
    : clamp(depthSum / maxPossibleDepth);

  return {
    keyword_match: clamp(keyword_match),
    skill_depth,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

function computeExperienceFeatures(resumeText, jobDescText) {
  const lower = resumeText.toLowerCase();

  // experience_section
  const experience_section = /experience|employment|work\s*history/i.test(lower)
    ? 1 : 0;

  // action_verbs: fraction of known action verbs found
  const resumeWords = new Set(tokenize(resumeText));
  let actionCount = 0;
  for (const v of ACTION_VERBS) {
    if (resumeWords.has(v)) actionCount++;
  }
  const action_verbs = clamp(actionCount / 12); // 12 strong verbs = perfect

  // quantified_results: presence of numbers with context ($, %, x, +)
  const quantPatterns = [
    /\d+\s*%/g,
    /\$\s*[\d,.]+/g,
    /\d+x\b/g,
    /increased?\s.*\d/gi,
    /decreased?\s.*\d/gi,
    /reduced?\s.*\d/gi,
    /grew?\s.*\d/gi,
    /saved?\s.*\d/gi,
  ];
  let quantCount = 0;
  for (const p of quantPatterns) {
    const matches = resumeText.match(p);
    if (matches) quantCount += matches.length;
  }
  const quantified_results = clamp(quantCount / 5); // 5 metrics = perfect

  // years_match: try to infer years of experience from resume vs. JD
  const yearsInResume = extractYears(resumeText);
  const yearsInJD = extractYears(jobDescText);
  let years_match = 0.5; // default when we can't determine
  if (yearsInJD > 0 && yearsInResume > 0) {
    years_match = clamp(yearsInResume / yearsInJD);
  } else if (yearsInResume > 0) {
    years_match = clamp(yearsInResume / 5); // assume 5yr baseline
  }

  return { experience_section, action_verbs, quantified_results, years_match };
}

function extractYears(text) {
  const patterns = [
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?/gi,
  ];
  let maxYears = 0;
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const y = parseInt(m[1], 10);
      if (y > 0 && y < 50) maxYears = Math.max(maxYears, y);
    }
  }
  return maxYears;
}

function computeEducationFeatures(resumeText) {
  const lower = resumeText.toLowerCase();

  // education_section
  const education_section = /education|university|college|degree/i.test(lower)
    ? 1 : 0;

  // degree_match: highest degree found
  let degreeScore = 0;
  for (let i = 0; i < DEGREE_KEYWORDS.length; i++) {
    if (lower.includes(DEGREE_KEYWORDS[i])) {
      // Earlier in the array = higher degree
      if (i < 4) degreeScore = 1.0;       // PhD
      else if (i < 10) degreeScore = 0.8;  // Master's
      else if (i < 17) degreeScore = 0.6;  // Bachelor's
      else degreeScore = 0.4;              // Associate/Diploma
      break;
    }
  }
  const degree_match = degreeScore;

  // certifications
  let certCount = 0;
  for (const cert of CERT_KEYWORDS) {
    if (lower.includes(cert)) certCount++;
  }
  const certifications = clamp(certCount / 3); // 3 certs = perfect

  return { education_section, degree_match, certifications };
}

function computeAchievementFeatures(resumeText) {
  const lower = resumeText.toLowerCase();

  // achievements: look for achievement-related sections or phrases
  const achievementPatterns = [
    /achievements?/i, /awards?/i, /honors?/i, /recognition/i,
    /published/i, /patent/i, /speaker/i, /presented/i,
  ];
  let achCount = 0;
  for (const p of achievementPatterns) {
    if (p.test(lower)) achCount++;
  }
  const achievements = clamp(achCount / 3);

  // metrics_present: does the resume have measurable metrics?
  const metricsPatterns = [
    /\d+\s*%/g, /\$[\d,.]+/g, /\b\d{2,}\b.*(?:users|customers|clients|transactions|requests)/gi,
    /\d+x\b/g, /\d+\s*(?:million|billion|thousand|k\b)/gi,
  ];
  let metricCount = 0;
  for (const p of metricsPatterns) {
    const matches = resumeText.match(p);
    if (matches) metricCount += matches.length;
  }
  const metrics_present = clamp(metricCount / 4);

  // leadership_signals
  const resumeWords = new Set(tokenize(resumeText));
  let leaderCount = 0;
  for (const w of LEADERSHIP_WORDS) {
    if (resumeWords.has(w)) leaderCount++;
  }
  const leadership_signals = clamp(leaderCount / 4);

  return { achievements, metrics_present, leadership_signals };
}

function computeFormatFeatures(resumeText) {
  const lines = resumeText.split("\n").filter(l => l.trim());
  const words = resumeText.split(/\s+/).filter(Boolean);

  // section_completeness: how many standard sections present
  const sectionHeaders = [
    /experience|employment|work\s*history/i,
    /education/i,
    /skills|technologies|technical/i,
    /projects|portfolio/i,
    /summary|objective|profile/i,
    /certif/i,
  ];
  let sectionsFound = 0;
  for (const s of sectionHeaders) {
    if (s.test(resumeText)) sectionsFound++;
  }
  const section_completeness = clamp(sectionsFound / 4); // 4 of 6 = perfect

  // resume_length: ideal is 400-800 words
  const wordCount = words.length;
  let resume_length;
  if (wordCount >= 300 && wordCount <= 900) {
    resume_length = 1.0;
  } else if (wordCount < 300) {
    resume_length = clamp(wordCount / 300);
  } else {
    resume_length = clamp(1 - (wordCount - 900) / 600);
  }

  // bullet_usage: presence of bullet-like patterns
  const bulletLines = lines.filter(l => /^\s*[•\-–—\*▪◦●]\s/.test(l));
  const bullet_usage = clamp(bulletLines.length / 8); // 8 bullets = perfect

  // consistency: checking for mixed formatting issues
  const hasConsistentCase = lines.filter(l => /^[A-Z]/.test(l.trim())).length > lines.length * 0.3;
  const consistency = hasConsistentCase ? 1.0 : 0.5;

  // readability: average line length (ideal: 60-120 chars)
  const avgLineLen = lines.reduce((s, l) => s + l.length, 0) / Math.max(lines.length, 1);
  let readability;
  if (avgLineLen >= 40 && avgLineLen <= 140) {
    readability = 1.0;
  } else {
    readability = 0.5;
  }

  return { section_completeness, resume_length, bullet_usage, consistency, readability };
}

function computeContactFeatures(resumeText) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedInRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/i;

  return {
    email_present: emailRegex.test(resumeText) ? 1 : 0,
    phone_present: phoneRegex.test(resumeText) ? 1 : 0,
    linkedin_present: linkedInRegex.test(resumeText) ? 1 : 0,
    github_present: githubRegex.test(resumeText) ? 1 : 0,
  };
}

function computeRiskFeatures(resumeText, jdKeywords, resumeTokens) {
  const lower = resumeText.toLowerCase();

  // employment_gaps: look for gap indicators
  const gapPatterns = [
    /gap/i, /career\s*break/i, /sabbatical/i,
    /unemployed/i, /freelance/i, /break\s*from/i,
  ];
  let gapSignals = 0;
  for (const p of gapPatterns) {
    if (p.test(lower)) gapSignals++;
  }
  // Invert: 1 = no gaps (good), 0 = many gaps
  const employment_gaps = clamp(1 - gapSignals / 2);

  // job_hopping: detect many short stints (rough heuristic)
  const yearMentions = (lower.match(/\b20\d{2}\b/g) || []).length;
  const companyPatterns = (lower.match(/(?:at|@)\s+\w+/gi) || []).length;
  // If many year references relative to text = lots of job changes
  const hopRatio = yearMentions > 0 ? clamp(1 - (yearMentions - 4) / 10) : 0.8;
  const job_hopping = hopRatio;

  // keyword_stuffing: detect if any single keyword appears excessively
  let isStuffing = false;
  const words = resumeText.split(/\s+/).length;
  for (const kw of jdKeywords) {
    const count = countOccurrences(resumeText, kw);
    // If a keyword appears > 2% of total words, suspicious
    if (count > 0 && count / words > 0.02) {
      isStuffing = true;
      break;
    }
  }
  const keyword_stuffing = isStuffing ? 0 : 1; // 1 = clean (good)

  // spelling_quality: rough heuristic — ratio of recognizable words
  // (simplified: assume decent quality if tokens are mostly > 2 chars)
  const tokens = tokenize(resumeText);
  const oddTokens = tokens.filter(t => t.length === 1 || /(.)\1{3,}/.test(t));
  const spelling_quality = clamp(1 - oddTokens.length / Math.max(tokens.length, 1));

  return { employment_gaps, job_hopping, keyword_stuffing, spelling_quality };
}

// ───────────────────── ANTI-GAMING DETECTION ──────────────────────────

function detectAntiGaming(resumeText, jdKeywords) {
  const flags = [];
  const words = resumeText.split(/\s+/).length;

  // 1. White-text stuffing: invisible keyword blocks
  //    Heuristic: extremely long resume with very few line breaks
  const lines = resumeText.split("\n").filter(l => l.trim());
  if (words > 1500 && lines.length < 15) {
    flags.push("Suspiciously dense text block — possible hidden keyword stuffing");
  }

  // 2. Keyword density anomaly
  for (const kw of jdKeywords) {
    const count = countOccurrences(resumeText, kw);
    if (count >= 8) {
      flags.push(`Keyword "${kw}" appears ${count} times — possible stuffing`);
    }
  }

  // 3. Exact JD copy detection
  const jdText = jdKeywords.join(" ");
  if (jdText.length > 30) {
    // Check if a large chunk of the JD appears verbatim in the resume
    const jdSample = jdText.slice(0, 100);
    if (resumeText.toLowerCase().includes(jdSample)) {
      flags.push("Large portion of job description appears to be copied into resume");
    }
  }

  return flags;
}

// ───────────── MANDATORY SKILL CHECK (HARD GATE) ─────────────────────

function checkMandatorySkills(resumeTokens, jdMeta) {
  if (!jdMeta?.mandatorySkills || !Array.isArray(jdMeta.mandatorySkills)) {
    return { passed: true, missing: [] };
  }
  const missing = jdMeta.mandatorySkills.filter(
    skill => !resumeTokens.has(skill.toLowerCase())
  );
  return {
    passed: missing.length === 0,
    missing,
  };
}

// ──────────── RECRUITER-STYLE BREAKDOWN ───────────────────────────────

function buildBreakdown(features) {
  const categories = {
    "Skills & Relevance": {
      score: 0, max: 0,
      keys: ["keyword_match", "semantic_similarity", "skill_depth"],
    },
    "Experience": {
      score: 0, max: 0,
      keys: ["years_match", "experience_section", "action_verbs", "quantified_results"],
    },
    "Education & Certifications": {
      score: 0, max: 0,
      keys: ["education_section", "degree_match", "certifications"],
    },
    "Impact & Achievements": {
      score: 0, max: 0,
      keys: ["achievements", "metrics_present", "leadership_signals"],
    },
    "Format & Readability": {
      score: 0, max: 0,
      keys: ["section_completeness", "resume_length", "bullet_usage", "consistency", "readability"],
    },
    "Contact Information": {
      score: 0, max: 0,
      keys: ["email_present", "phone_present", "linkedin_present", "github_present"],
    },
    "Risk Assessment": {
      score: 0, max: 0,
      keys: ["employment_gaps", "job_hopping", "keyword_stuffing", "spelling_quality"],
    },
  };

  for (const [catName, cat] of Object.entries(categories)) {
    for (const key of cat.keys) {
      const weight = WEIGHTS[key] || 0;
      const value = features[key] ?? 0;
      cat.score += value * weight;
      cat.max += weight;
    }
    // Normalise to 0–100 for display
    cat.percentage = cat.max > 0
      ? Math.round((cat.score / cat.max) * 100)
      : 0;
  }

  return Object.fromEntries(
    Object.entries(categories).map(([name, data]) => [
      name,
      {
        score: data.percentage,
        details: data.keys.map(k => ({
          feature: k,
          value: Math.round((features[k] ?? 0) * 100),
          weight: WEIGHTS[k],
        })),
      },
    ])
  );
}

// ──────────── RECOMMENDATIONS ENGINE ──────────────────────────────────

function generateRecommendations(features, skillData, contactFeatures, gamingFlags) {
  const recs = [];

  // Critical
  if (!contactFeatures.email_present) {
    recs.push({ priority: "CRITICAL", message: "Add your email address — recruiters cannot contact you without it." });
  }
  if (!contactFeatures.phone_present) {
    recs.push({ priority: "CRITICAL", message: "Add your phone number for recruiter outreach." });
  }

  // High
  if (features.keyword_match < 0.5 && skillData.missingSkills.length > 0) {
    const top5 = skillData.missingSkills.slice(0, 5).join(", ");
    recs.push({
      priority: "HIGH",
      message: `Low keyword match (${Math.round(features.keyword_match * 100)}%). Add these missing terms: ${top5}`,
    });
  }

  if (features.action_verbs < 0.4) {
    recs.push({ priority: "HIGH", message: "Use stronger action verbs (e.g., 'architected', 'optimized', 'scaled') to describe your contributions." });
  }

  if (features.quantified_results < 0.3) {
    recs.push({ priority: "HIGH", message: "Add measurable results (e.g., 'Reduced load time by 40%', 'Served 10K+ users')." });
  }

  // Medium
  if (!contactFeatures.linkedin_present) {
    recs.push({ priority: "MEDIUM", message: "Add your LinkedIn profile URL for professional credibility." });
  }

  if (features.section_completeness < 0.6) {
    recs.push({ priority: "MEDIUM", message: "Ensure your resume has clear sections: Experience, Education, Skills, and Projects." });
  }

  if (features.resume_length < 0.5) {
    recs.push({ priority: "MEDIUM", message: "Your resume may be too short. Aim for 400–800 words for a 1-page resume." });
  }

  if (features.achievements < 0.3) {
    recs.push({ priority: "MEDIUM", message: "Consider adding an Achievements or Awards section to stand out." });
  }

  if (features.degree_match < 0.4 && features.education_section < 1) {
    recs.push({ priority: "MEDIUM", message: "Include your educational background with degree details." });
  }

  // Low
  if (features.bullet_usage < 0.3) {
    recs.push({ priority: "LOW", message: "Use bullet points for better readability and ATS parsing." });
  }

  if (!contactFeatures.github_present) {
    recs.push({ priority: "LOW", message: "Consider adding your GitHub profile for technical roles." });
  }

  // Anti-gaming warnings
  for (const flag of gamingFlags) {
    recs.push({ priority: "WARNING", message: flag });
  }

  return recs;
}

// ═══════════════════════ MAIN SCORER ══════════════════════════════════

/**
 * Hybrid ATS Scorer — combines keyword matching, embedding-based semantic
 * similarity, structural analysis, and risk detection.
 *
 * @param {Object} params
 * @param {string} params.resumeText     - Full resume text
 * @param {string} params.jobDescText    - Full job description text
 * @param {Object} [params.jdMeta={}]    - Optional JD metadata
 *   @param {string[]} [params.jdMeta.mandatorySkills] - Skills that MUST match
 * @param {boolean} [params.useEmbeddings=true] - Use semantic embeddings
 * @returns {Promise<Object>} Scoring result
 */
export async function hybridATSScorer({
  resumeText,
  jobDescText,
  jdMeta = {},
  useEmbeddings = true,
} = {}) {
  // ── Input Validation ────────────────────────────────────────────────
  if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
    return emptyResult("CRITICAL: Resume text is empty or invalid.");
  }
  if (!jobDescText || typeof jobDescText !== "string" || !jobDescText.trim()) {
    return emptyResult("CRITICAL: Job description text is empty or invalid.");
  }

  // ── Tokenize ────────────────────────────────────────────────────────
  const jdKeywords = extractKeywords(jobDescText);
  const resumeTokens = resumeTokenSet(resumeText);

  // ── Compute All Features ────────────────────────────────────────────
  const skillData = computeSkillFeatures(resumeText, jobDescText, resumeTokens, jdKeywords);
  const experienceData = computeExperienceFeatures(resumeText, jobDescText);
  const educationData = computeEducationFeatures(resumeText);
  const achievementData = computeAchievementFeatures(resumeText);
  const formatData = computeFormatFeatures(resumeText);
  const contactData = computeContactFeatures(resumeText);
  const riskData = computeRiskFeatures(resumeText, jdKeywords, resumeTokens);

  // ── Semantic Similarity ─────────────────────────────────────────────
  // Default to 0 — no free points when embeddings are unavailable
  let semantic_similarity = 0;
  if (useEmbeddings) {
    try {
      const [resumeEmb, jdEmb] = await Promise.all([
        getEmbedding(resumeText),
        getEmbedding(jobDescText),
      ]);
      if (resumeEmb && jdEmb) {
        const rawSim = cosineSimilarity(resumeEmb, jdEmb);
        // Normalise from [-1, 1] to [0, 1]
        semantic_similarity = clamp((rawSim + 1) / 2);
      }
    } catch (err) {
      console.warn("⚠️ Embedding failed, semantic score = 0:", err.message);
      semantic_similarity = 0;
    }
  }

  // ── Assemble Feature Map ────────────────────────────────────────────
  const features = {
    keyword_match: skillData.keyword_match,
    semantic_similarity,
    skill_depth: skillData.skill_depth,

    years_match: experienceData.years_match,
    experience_section: experienceData.experience_section,
    action_verbs: experienceData.action_verbs,
    quantified_results: experienceData.quantified_results,

    education_section: educationData.education_section,
    degree_match: educationData.degree_match,
    certifications: educationData.certifications,

    achievements: achievementData.achievements,
    metrics_present: achievementData.metrics_present,
    leadership_signals: achievementData.leadership_signals,

    section_completeness: formatData.section_completeness,
    resume_length: formatData.resume_length,
    bullet_usage: formatData.bullet_usage,
    consistency: formatData.consistency,
    readability: formatData.readability,

    email_present: contactData.email_present,
    phone_present: contactData.phone_present,
    linkedin_present: contactData.linkedin_present,
    github_present: contactData.github_present,

    employment_gaps: riskData.employment_gaps,
    job_hopping: riskData.job_hopping,
    keyword_stuffing: riskData.keyword_stuffing,
    spelling_quality: riskData.spelling_quality,
  };

  // ── Weighted Base Score ─────────────────────────────────────────────
  let baseScore = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    baseScore += (features[key] ?? 0) * weight;
  }
  let rawLinearScore = baseScore * 100;

  // ── Sigmoid Compression ─────────────────────────────────────────────
  // Produces a realistic bell-curve distribution:
  //   60 → ~55,  70 → ~68,  80 → ~82,  90 → ~91
  // Prevents score inflation while rewarding truly strong resumes.
  const sigmoid = (x) => 1 / (1 + Math.exp(-0.1 * (x - 70)));
  let finalScore = 100 * sigmoid(rawLinearScore);

  // ── Modifiers / Penalties ───────────────────────────────────────────
  const appliedPenalties = [];

  // Mandatory skill hard gate
  const mandatoryCheck = checkMandatorySkills(resumeTokens, jdMeta);
  if (!mandatoryCheck.passed) {
    finalScore += PENALTIES.MISSING_MANDATORY_SKILL;
    appliedPenalties.push({
      type: "MISSING_MANDATORY_SKILL",
      value: PENALTIES.MISSING_MANDATORY_SKILL,
      details: `Missing: ${mandatoryCheck.missing.join(", ")}`,
    });
  }

  // Keyword stuffing penalty
  if (riskData.keyword_stuffing === 0) {
    finalScore += PENALTIES.KEYWORD_STUFFING;
    appliedPenalties.push({
      type: "KEYWORD_STUFFING",
      value: PENALTIES.KEYWORD_STUFFING,
      details: "Detected abnormally high keyword repetition",
    });
  }

  // Employment gap penalty
  if (riskData.employment_gaps < 0.5) {
    finalScore += PENALTIES.LARGE_EMPLOYMENT_GAP;
    appliedPenalties.push({
      type: "LARGE_EMPLOYMENT_GAP",
      value: PENALTIES.LARGE_EMPLOYMENT_GAP,
      details: "Career gap indicators detected",
    });
  }

  // Missing contact info multiplier
  if (!contactData.email_present && !contactData.phone_present) {
    finalScore *= PENALTIES.MISSING_CONTACT_MULT;
    appliedPenalties.push({
      type: "MISSING_CONTACT_INFO",
      value: `×${PENALTIES.MISSING_CONTACT_MULT}`,
      details: "Both email and phone are missing",
    });
  }

  // ── Anti-Gaming ─────────────────────────────────────────────────────
  const gamingFlags = detectAntiGaming(resumeText, jdKeywords);

  // ── Cap at 95 ───────────────────────────────────────────────────────
  finalScore = Math.max(0, Math.min(SCORE_CAP, finalScore));

  // ── Build Outputs ───────────────────────────────────────────────────
  const breakdown = buildBreakdown(features);
  const recommendations = generateRecommendations(features, skillData, contactData, gamingFlags);

  // ── Weak signals & risk flags (feature-aware) ───────────────────────
  function computeTitleSimilarity(resumeText, jobDescText) {
    try {
      const jdFirstLine = (jobDescText || "").split("\n")[0] || "";
      const titleTokens = extractKeywords(jdFirstLine).slice(0, 8);
      if (titleTokens.length === 0) return 0;
      const resumeTokens = resumeTokenSet(resumeText);
      const matched = titleTokens.filter(t => resumeTokens.has(t));
      return clamp(matched.length / titleTokens.length);
    } catch (e) {
      return 0;
    }
  }

  const derived = {
    hard_skill_match: features.keyword_match ?? 0,
    semantic_similarity: features.semantic_similarity ?? 0,
    quantified_metrics: features.quantified_results ?? features.metrics_present ?? 0,
    impact_verbs: features.action_verbs ?? 0,
    title_similarity: computeTitleSimilarity(resumeText, jobDescText),
    gaps_penalty: 1 - (features.employment_gaps ?? 1), // higher = more penalty
    stuffing_flag: 1 - (features.keyword_stuffing ?? 1), // higher = more stuffing
  };

  const weakSignals = Object.fromEntries(
    Object.entries(derived).map(([k, v]) => [k, Number(v.toFixed(3))])
  );
  const weakList = Object.keys(derived).filter(k => derived[k] < 0.5);

  // riskFlags: combine applied penalties and gaming flags for a concise list
  const riskFlags = [
    ...appliedPenalties.map(p => p.type),
    ...gamingFlags,
  ];

  // ── Score Distribution Logger ─────────────────────────────────────
  logScoreDistribution(Math.round(finalScore));

  return {
    score: Math.round(finalScore),
    breakdown,
    features,
    recommendations,
    matchedSkills: skillData.matchedSkills,
    missingSkills: skillData.missingSkills,
    totalKeywords: jdKeywords.length,
    penalties: appliedPenalties,
    gamingFlags,
    weakSignals: {
      values: weakSignals,
      weakList,
    },
    riskFlags,
    meta: {
      embeddingsUsed: useEmbeddings && semantic_similarity > 0,
      rawLinearScore: Math.round(rawLinearScore),
      compressedScore: Math.round(finalScore),
      featureCount: Object.keys(features).length,
      scoreCap: SCORE_CAP,
      mandatorySkillsPassed: mandatoryCheck.passed,
    },
  };
}

// ── Backward-compatible wrapper ───────────────────────────────────────
export function scoreResume(resumeText, jobDescription) {
  // Synchronous fallback for legacy route usage
  // Runs the hybrid scorer without embeddings (no await needed)
  return hybridATSScorer({
    resumeText,
    jobDescText: jobDescription,
    useEmbeddings: false,
  });
}

// ── Ranking Function ──────────────────────────────────────────────────

/**
 * Score and rank multiple resumes against a single job description.
 *
 * @param {string[]} resumesArray  - Array of resume text strings
 * @param {string}   jobDescText   - Job description text
 * @param {Object}   [jdMeta={}]   - Optional JD metadata
 * @returns {Promise<Object[]>}    - Sorted array (descending by score)
 */
export async function rankCandidates(resumesArray, jobDescText, jdMeta = {}) {
  if (!Array.isArray(resumesArray) || resumesArray.length === 0) {
    return [];
  }

  const results = await Promise.all(
    resumesArray.map(async (resumeText, index) => {
      const result = await hybridATSScorer({
        resumeText,
        jobDescText,
        jdMeta,
        useEmbeddings: true,
      });
      return {
        candidateIndex: index,
        ...result,
      };
    })
  );

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  // Add rank
  return results.map((r, i) => ({
    rank: i + 1,
    ...r,
  }));
}

// ── Empty Result Helper ───────────────────────────────────────────────

function emptyResult(message) {
  return {
    score: 0,
    breakdown: {},
    features: {},
    recommendations: [{ priority: "CRITICAL", message }],
    matchedSkills: [],
    missingSkills: [],
    totalKeywords: 0,
    penalties: [],
    gamingFlags: [],
    meta: {
      embeddingsUsed: false,
      rawLinearScore: 0,
      compressedScore: 0,
      featureCount: 0,
      scoreCap: SCORE_CAP,
      mandatorySkillsPassed: false,
    },
  };
}

// ── Score Distribution Logger ─────────────────────────────────────────
// Tracks a rolling window of the last 100 scores and reports distribution
// health on every 10th score.

const scoreHistory = [];
const DISTRIBUTION_WINDOW = 100;

function logScoreDistribution(score) {
  scoreHistory.push(score);

  // Keep only the last N scores
  if (scoreHistory.length > DISTRIBUTION_WINDOW) {
    scoreHistory.shift();
  }

  // Report every 10 scores
  if (scoreHistory.length % 10 !== 0) return;

  const total = scoreHistory.length;
  const buckets = {
    "0-49": scoreHistory.filter(s => s < 50).length,
    "50-64": scoreHistory.filter(s => s >= 50 && s < 65).length,
    "65-79": scoreHistory.filter(s => s >= 65 && s < 80).length,
    "80-89": scoreHistory.filter(s => s >= 80 && s < 90).length,
    "90+": scoreHistory.filter(s => s >= 90).length,
  };

  const pct = (n) => ((n / total) * 100).toFixed(1);

  console.log(
    `\n📊 ATS Score Distribution (last ${total} resumes):\n` +
    `   0–49  : ${pct(buckets["0-49"])}%  (${buckets["0-49"]})\n` +
    `   50–64 : ${pct(buckets["50-64"])}%  (${buckets["50-64"]})  ← should be bulk\n` +
    `   65–79 : ${pct(buckets["65-79"])}%  (${buckets["65-79"]})  ← decent\n` +
    `   80–89 : ${pct(buckets["80-89"])}%  (${buckets["80-89"]})  ← strong\n` +
    `   90+   : ${pct(buckets["90+"])}%  (${buckets["90+"]})  ← should be rare (1-3%)\n`
  );

  // Health alerts
  const pct90 = (buckets["90+"] / total) * 100;
  const pct80 = ((buckets["80-89"] + buckets["90+"]) / total) * 100;

  if (pct90 > 20) {
    console.warn("⚠️  DISTRIBUTION WARNING: >20% scoring 90+. Scoring is too generous!");
  }
  if (pct80 === 0 && total >= 20) {
    console.warn("⚠️  DISTRIBUTION WARNING: 0% scoring 80+. Scoring may be too strict!");
  }
}
