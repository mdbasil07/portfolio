/**
 * Advanced ATS Scorer
 * 1. Keyword Matching (Content)
 * 2. Data Integrity (Contact Info, LinkedIn)
 * 3. Structural Analysis (Sections)
 * 4. Weighted Scoring Algorithm
 */

// --- CONFIGURATION ---
const WEIGHTS = {
  KEYWORDS: 0.50,   // 50% of score is matching skills
  INTEGRITY: 0.30,  // 30% is having contact info/links
  SECTIONS: 0.20    // 20% is having proper resume sections
};

// Critical items that heavily penalize if missing
const CRITICAL_PENALTY = 0.5; // Halve the score if email/phone is missing

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "her", "hers", "herself", "him", "himself", "his", "i", "if", "in", "into",
  "is", "it", "its", "me", "my", "myself", "no", "not", "of", "on", "or", "our",
  "ours", "ourselves", "out", "she", "so", "than", "that", "the", "their",
  "theirs", "them", "themselves", "then", "there", "these", "they", "this",
  "those", "to", "too", "us", "was", "we", "were", "what", "when", "where",
  "which", "while", "who", "whom", "why", "with", "you", "your", "yours",
  "yourself", "yourselves", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "only", "own", "same", "can", "will", "just", "should",
  "now", "also", "about", "after", "before", "between", "during", "above",
  "below", "through", "again", "further", "once", "here", "how", "all", "being",
  "have", "had", "do", "does", "did", "would", "could", "may", "might", "must",
  "shall", "been", "being", "having", "doing", "until", "against", "under",
  "over", "per", "via", "am", "did", "get", "got", "let", "put", "say", "see",
  "use", "used", "using", "want", "way", "well", "work", "year", "years",
  "experience", "experiences", "skilled", "skills", "development", "software",
  "project", "projects", "team", "teams", "ability", "abilities", "required",
  "prefer", "preferred", "communication", "communicate", "responsibilities",
  "responsibility", "role", "roles", "position", "positions", "candidate",
  "candidates", "strong", "excellent", "good", "best", "highly", "related",
  "including", "provide", "provides", "various", "multiple", "across", "within",
  "environment", "environments", "working", "knowledge", "understanding",
  "building", "support", "supporting", "based", "level", "levels",
  "new", "first", "great", "effective", "successful", "key", "part", "full",
  "time", "applicant", "applicants", "looking", "join", "joining", "help",
  "helping", "create", "creating", "design", "designing", "develop", "developing",
  "manage", "managing", "lead", "leading", "work", "collaborate", "collaboration"
]);

const MIN_WORD_LENGTH = 3;

// --- UTILS ---

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

// --- EXTRACTION LOGIC ---

/**
 * Checks for contact info and links
 */
function checkIntegrity(text) {
  // Email: standard format validation
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  // Phone: more strict - requires at least 10 digits, allows common separators
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  // LinkedIn: must have /in/ path (profile URL)
  const linkedInRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i; 
  // GitHub: profile URL
  const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/i;

  return {
    hasEmail: emailRegex.test(text),
    hasPhone: phoneRegex.test(text),
    hasLinkedIn: linkedInRegex.test(text),
    hasGithub: githubRegex.test(text) // Optional, bonus usually
  };
}

/**
 * Checks for standard resume sections
 */
function checkSections(text) {
  const normalized = text.toLowerCase();
  return {
    hasExperience: /experience|employment|work history/i.test(normalized),
    hasEducation: /education|university|college|degree/i.test(normalized),
    hasSkills: /skills|technologies|proficiencies|stack/i.test(normalized),
    hasProjects: /projects|portfolio/i.test(normalized)
  };
}

function extractKeywords(jobDescription) {
  const tokens = tokenize(jobDescription);
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
  const tokens = tokenize(resumeText || "");
  return new Set(tokens);
}

// --- MAIN SCORER ---

export function scoreResume(resumeText, jobDescription) {
  // Input validation
  if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: "CRITICAL: Resume text is empty or invalid.",
      totalKeywords: 0
    };
  }

  if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: "CRITICAL: Job description is empty or invalid.",
      totalKeywords: 0
    };
  }

  // 1. Keyword Match
  const keywords = extractKeywords(jobDescription);
  const resumeSet = resumeTokenSet(resumeText);
  const matchedSkills = keywords.filter((kw) => resumeSet.has(kw));
  const missingSkills = keywords.filter((kw) => !resumeSet.has(kw));
  
  const keywordCount = keywords.length;
  // If no JD keywords found, cannot score keyword match (set to 0)
  const keywordRawScore = keywordCount === 0 ? 0 : (matchedSkills.length / keywordCount);

  // 2. Integrity Check
  const integrity = checkIntegrity(resumeText);
  // Required: Email & Phone. LinkedIn is bonus (not counted in required score)
  const requiredItems = [integrity.hasEmail, integrity.hasPhone];
  const integrityScore = requiredItems.filter(Boolean).length / requiredItems.length;
  // LinkedIn is bonus - add small boost if present
  const linkedInBonus = integrity.hasLinkedIn ? 0.1 : 0;

  // 3. Section Check
  const sections = checkSections(resumeText);
  // Core sections: Experience, Education, Skills (Projects is bonus)
  const sectionItems = [sections.hasExperience, sections.hasEducation, sections.hasSkills];
  const sectionScore = sectionItems.filter(Boolean).length / sectionItems.length;
  // Projects section is bonus
  const projectsBonus = sections.hasProjects ? 0.05 : 0;

  // 4. Calculate Final Weighted Score
  let finalScore = (
    (keywordRawScore * WEIGHTS.KEYWORDS) +
    (integrityScore * WEIGHTS.INTEGRITY) +
    (sectionScore * WEIGHTS.SECTIONS)
  ) * 100;
  
  // Apply bonuses (capped at 100)
  finalScore = Math.min(100, finalScore + (linkedInBonus * 100) + (projectsBonus * 100));

  // 5. Critical Fail Penalties
  // If email or phone is missing, the resume is practically useless.
  if (!integrity.hasEmail || !integrity.hasPhone) {
    finalScore = finalScore * CRITICAL_PENALTY; 
  }

  // --- GENERATE SUGGESTIONS (for fallback if AI fails) ---
  let suggestionText = "";

  // Critical Failures
  if (!integrity.hasEmail) suggestionText += "CRITICAL: No email address found. Recruiters cannot contact you.\n";
  if (!integrity.hasPhone) suggestionText += "CRITICAL: No phone number found.\n";
  
  // Integrity Improvements
  if (!integrity.hasLinkedIn) suggestionText += "IMPROVEMENT: Add your LinkedIn profile URL for better visibility.\n";
  if (!integrity.hasGithub && keywordCount > 0 && /developer|engineer|programmer|coding/i.test(jobDescription)) {
    suggestionText += "TIP: Consider adding your GitHub profile for technical roles.\n";
  }
  
  // Section Improvements
  if (!sections.hasExperience) suggestionText += "STRUCTURE: 'Experience' or 'Work History' section not detected.\n";
  if (!sections.hasEducation) suggestionText += "STRUCTURE: 'Education' section not detected.\n";
  if (!sections.hasSkills) suggestionText += "STRUCTURE: 'Skills' section not detected.\n";
  if (!sections.hasProjects && keywordCount > 0 && /developer|engineer|portfolio/i.test(jobDescription)) {
    suggestionText += "TIP: Consider adding a 'Projects' section to showcase your work.\n";
  }

  // Skill Gaps (Top 10 most relevant)
  if (missingSkills.length > 0) {
    suggestionText += `\nMISSING KEYWORDS:\nConsider adding these terms from the job description:\n• ${missingSkills.slice(0, 10).join("\n• ")}`;
    if (missingSkills.length > 10) {
      suggestionText += `\n...and ${missingSkills.length - 10} more keywords.`;
    }
  } else if (keywordCount > 0) {
    suggestionText += "\n✓ Great keyword match! Your resume aligns well with the job description.";
  }

  return {
    score: Math.round(finalScore),
    matchedSkills,
    missingSkills,
    suggestions: suggestionText.trim(),
    totalKeywords: keywordCount
  };
}