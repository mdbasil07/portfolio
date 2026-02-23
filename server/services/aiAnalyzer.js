import axios from "axios";
import crypto from "crypto";

const KIMI_URL = "https://api.moonshot.ai/v1/chat/completions";
const MODEL = "kimi-k2-turbo-preview";

const ATS_PROMPT = `
You are a senior technical recruiter and resume strategist.

Your job is NOT to optimize for score.
Your job is to improve clarity, positioning, and impact of the resume.

Guidelines:
- Avoid mentioning score or "+X points".
- Avoid talking about ATS flags.
- Do not sound technical or robotic.
- Focus on what a hiring manager would think while reading.
- Explain WHY a change matters.
- Give concrete rewrite suggestions.
- Make suggestions practical and understandable.

Structure your output exactly like this:

1. What is unclear or weak in this resume?
Explain in simple language.

2. What should be changed?
Be specific (which section, which bullet, what to remove, what to rewrite).

3. Example rewrites (2–3 short examples)
Rewrite existing bullets to show stronger clarity and impact.

4. Overall positioning advice
Explain how the candidate should present themselves for THIS job.

Keep tone professional, clear, and direct.
Do not mention scoring mechanics.
`;

// Simple in-memory cache for AI responses
const responseCache = new Map(); // Map<hash, string>

function hashPayload(...parts) {
  const h = crypto.createHash("sha256");
  for (const p of parts) h.update(String(p || ""));
  return h.digest("hex");
}

function prioritizeSections(text, max = 4000) {
  if (!text || text.length <= max) return text.slice(0, max);
  const expMatch = text.match(/(experience|work history|employment)[\s\S]{0,2000}/i);
  const skillsMatch = text.match(/(skills|technologies|technical skills)[\s\S]{0,1000}/i);
  const parts = [];
  if (expMatch) parts.push(expMatch[0]);
  if (skillsMatch) parts.push(skillsMatch[0]);
  parts.push(text);
  const combined = parts.join("\n\n");
  return combined.slice(0, max);
}

function generateDeterministicSuggestions(weakSignals = {}, missingSkills = []) {
  // Build a human-centric suggestions string matching the new recruiter prompt
  const weakList = Array.isArray(weakSignals?.weakList)
    ? weakSignals.weakList
    : Object.keys(weakSignals || {}).filter(k => {
      const v = weakSignals[k];
      return typeof v === "number" && v < 0.5;
    });

  const linesWhat = [];
  const linesChange = [];
  const rewrites = [];
  const positioning = [];

  if (!weakSignals?.values?.email_present && !weakSignals?.values?.phone_present) {
    linesWhat.push("Contact information is missing or incomplete; recruiters may be unable to reach you.");
    linesChange.push("Add a clear email and phone line near the top of your resume (same line as location is fine).");
  }

  if ((weakSignals?.values?.hard_skill_match || 0) < 0.5 && Array.isArray(missingSkills) && missingSkills.length > 0) {
    linesWhat.push("Key technical terms from the job are missing or under-emphasized.");
    linesChange.push(`Include the most relevant skills in your Skills section and weave them into the bullets for the roles where you used them (start with: ${missingSkills.slice(0,6).join(", ")}).`);
    rewrites.push("Instead of: 'Worked on full stack development.'");
    rewrites.push("Write: 'Built Node.js REST APIs and integrated them with PostgreSQL to support payment flows.'");
  }

  if ((weakSignals?.values?.quantified_metrics || weakSignals?.values?.metrics_present || 0) < 0.4) {
    linesWhat.push("Impact and metrics are scarce, making achievements feel vague.");
    linesChange.push("Add short measurable outcomes to 1–2 bullets per recent role (percentages, time saved, users, revenue).");
    rewrites.push("Instead of: 'Improved performance.'");
    rewrites.push("Write: 'Reduced page load time by 35% for the customer portal, improving retention.'");
  }

  if ((weakSignals?.values?.impact_verbs || 0) < 0.4) {
    linesWhat.push("Bullets use weak or generic verbs and lack clear ownership.");
    linesChange.push("Start bullets with stronger action verbs and quantify scope (team size, traffic, dollars).");
  }

  if (weakList.length === 0) {
    linesWhat.push("Overall the resume reads clearly for initial screening.");
    linesChange.push("Polish a couple of bullets to include more specific outcomes and technologies.");
    rewrites.push("Example: 'Designed and shipped a scalable API used by 10K+ customers.'");
    positioning.push("Position as a results-oriented engineer who delivers measurable improvements.");
  } else {
    positioning.push("Focus your positioning on strengths that match the JD; lead with the most relevant experience and technologies.");
  }

  // Compose final structured output
  const out = [
    "1. What is unclear or weak in this resume?",
    ...(linesWhat.length ? linesWhat.map(l => `- ${l}`) : ["- None obvious."]),
    "",
    "2. What should be changed?",
    ...(linesChange.length ? linesChange.map(l => `- ${l}`) : ["- Minor wording and metrics improvements."]),
    "",
    "3. Example rewrites (2–3 short examples)",
    ...(rewrites.length ? rewrites.map(r => `- ${r}`) : ["- Example: 'Led migration to cloud infrastructure, improving uptime and reducing costs.'"]),
    "",
    "4. Overall positioning advice",
    ...(positioning.length ? positioning.map(p => `- ${p}`) : ["- Present yourself with clear role focus and measurable impact."]),
  ].join("\n");

  return out;
}

/**
 * New feature-aware getATSSuggestions.
 *
 * @param {Object} params
 * @param {string} params.resumeText
 * @param {string} params.jobDescription
 * @param {number} params.score
 * @param {Object} params.weakSignals
 * @param {string[]} params.missingSkills
 * @param {string[]} params.riskFlags
 */
export async function getATSSuggestions({
  resumeText,
  jobDescription,
  score,
  weakSignals = {},
  missingSkills = [],
  riskFlags = []
} = {}) {
  const apiKey = process.env.KIMI_API_KEY;
  // Build a short prioritized context (experience + skills first)
  const resumeSnippet = resumeText.slice(0, 4000);
  const jdSnippet = jobDescription.slice(0, 4000);

  const contextSummary = `
This resume scored ${score}/100.

Identified weaknesses:
- ${Array.isArray(weakSignals?.weakList) ? weakSignals.weakList.join("\n- ") : ""}

Missing skills:
- ${Array.isArray(missingSkills) ? missingSkills.join(", ") : String(missingSkills)}

Risk signals:
- ${Array.isArray(riskFlags) ? riskFlags.join(", ") : String(riskFlags)}

Use this information only to guide improvement,
but do NOT mention score mechanics in your response.
`;

  const userContent = `
Job Description:
${jdSnippet}

Resume:
${resumeSnippet}

Analysis Context:
${contextSummary}
`;

  const cacheKey = hashPayload(resumeSnippet, jdSnippet, JSON.stringify(weakSignals));
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  if (!apiKey) {
    // No API key — return deterministic suggestions
    const fallback = generateDeterministicSuggestions(weakSignals, missingSkills);
    responseCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const response = await axios.post(
      KIMI_URL,
      {
        model: MODEL,
        messages: [
          { role: "system", content: ATS_PROMPT },
          { role: "user", content: userContent }
        ],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned no content");
    responseCache.set(cacheKey, content);
    return content;
  } catch (err) {
    console.error("getATSSuggestions error:", err.message || err);
    const fallback = generateDeterministicSuggestions(weakSignals, missingSkills);
    responseCache.set(cacheKey, fallback);
    return fallback;
  }
}
