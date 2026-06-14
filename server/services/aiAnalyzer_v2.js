import axios from "axios";
import crypto from "crypto";
import {
  buildGeminiPayload,
  extractGeminiError,
  extractGeminiText,
  GEMINI_MODEL,
  getGeminiApiKey,
  getGeminiEndpoint,
  logGeminiRequest
} from "./geminiClient.js";

const GEMINI_URL = getGeminiEndpoint(GEMINI_MODEL, "generateContent");

const ATS_PROMPT = `
You are a professional resume reviewer and technical recruiter.

Your job is to analyze the resume and return structured, practical feedback.

You MUST follow this exact format:

1. Grammar Mistakes:
- List ALL grammar mistakes found in the resume.
- If none, write: "No major grammar mistakes found."
- Be specific (quote the incorrect phrase and suggest correction).

2. Missing Skills:
- Compare the resume against the job description.
- List important skills from the job description that are not clearly mentioned in the resume.
- If none are missing, say: "All major required skills are present."

3. Improvements:
- Suggest specific improvements to bullet points or sections.
- Focus on clarity, impact, measurable results, and professional tone.
- Do NOT mention ATS scoring or points.

4. Missing Sections:
- Identify missing important resume sections (e.g., Experience, Skills, Projects, Summary, Certifications).
- If all core sections exist, say: "All essential sections are present."

5. Missing Details:
- Identify missing personal/professional details (LinkedIn, GitHub, phone number, location, portfolio link, etc.).
- If complete, say: "All important contact details are present."

6. AI Recommendations:
- Provide 2–3 high-level professional recommendations.
- Comment on positioning, strengths, and how the candidate can stand out.
- Keep it practical and recruiter-focused.
- Do NOT mention ATS scoring mechanics.

Be clear, professional, and structured.
Do not add extra sections.
Do not mention scoring system.
`;

const responseCache = new Map();

function hashPayload(...parts) {
  const h = crypto.createHash("sha256");
  for (const p of parts) h.update(String(p || ""));
  return h.digest("hex");
}

function simpleDeterministic(weakSignals = {}, missingSkills = [], resumeText = "") {
  // Build a human-centric structured fallback following the required sections
  const grammar = [];
  // Very simple grammar checks (common mistakes)
  if (/\bA\s+application\b/i.test(resumeText)) {
    grammar.push(`"A application" → should be "An application"`);
  }
  if (grammar.length === 0) grammar.push("No major grammar mistakes found.");

  const missing = Array.isArray(missingSkills) && missingSkills.length
    ? missingSkills
    : [];
  const missingSkillsResp = missing.length ? missing.join(", ") : "All major required skills are present.";

  const improvements = [];
  if ((weakSignals?.values?.quantified_metrics || 0) < 0.4) {
    improvements.push("- Add measurable outcomes to 1–2 bullets per recent role (%, users, revenue).");
  }
  if ((weakSignals?.values?.impact_verbs || 0) < 0.4) {
    improvements.push("- Start bullets with stronger action verbs and quantify ownership.");
  }
  if (improvements.length === 0) improvements.push("- Improve clarity and add measurable results where possible.");

  const sections = [];
  if (!(resumeText || "").toLowerCase().includes("experience")) sections.push("Experience");
  if (!(resumeText || "").toLowerCase().includes("skills")) sections.push("Skills");
  if (!(resumeText || "").toLowerCase().includes("projects")) sections.push("Projects");
  const missingSections = sections.length ? sections.join(", ") : "All essential sections are present.";

  const details = [];
  if (!/(linkedin\.com|github\.com)/i.test(resumeText)) {
    details.push("LinkedIn or GitHub not included.");
  }
  if (!/\b@\w+\.\w+/i.test(resumeText) || !/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText)) {
    // crude check
    details.push("Contact email or phone may be missing.");
  }
  const missingDetails = details.length ? details.join(" ") : "All important contact details are present.";

  const aiRecommendations = [];
  aiRecommendations.push("- Lead with the most relevant recent experience and technologies for this role.");
  aiRecommendations.push("- Highlight 1–2 measurable impacts (users, revenue, performance) in each recent role.");

  return [
    "1. Grammar Mistakes:",
    ...grammar.map(g => `- ${g}`),
    "",
    "2. Missing Skills:",
    `- ${missingSkillsResp}`,
    "",
    "3. Improvements:",
    ...improvements.map(i => `${i}`),
    "",
    "4. Missing Sections:",
    `- ${missingSections}`,
    "",
    "5. Missing Details:",
    `- ${missingDetails}`,
    "",
    "6. AI Recommendations:",
    ...aiRecommendations.map(r => `- ${r}`)
  ].join("\n");
}

export async function getATSSuggestions({
  resumeText,
  jobDescription,
  score,
  weakSignals = {},
  missingSkills = [],
  riskFlags = []
} = {}) {
  const apiKey = getGeminiApiKey();
  const jdSnippet = jobDescription.slice(0, 4000);
  const resumeSnippet = resumeText.slice(0, 4000);

  const contextSummary = `
Job Description:
${jdSnippet}

Resume:
${resumeSnippet}

Known Missing Skills (from system analysis):
${missingSkills.length ? missingSkills.join(", ") : "None detected"}

Known Risk Signals:
${riskFlags.length ? riskFlags.join(", ") : "None"}
`;

  const cacheKey = hashPayload(contextSummary);
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  if (!apiKey) {
    const fallback = simpleDeterministic(weakSignals, missingSkills, resumeText);
    responseCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    logGeminiRequest({ label: "ATS suggestions v2", endpoint: GEMINI_URL, model: GEMINI_MODEL, apiKey });
    const resp = await axios.post(
      GEMINI_URL,
      buildGeminiPayload({
        systemInstruction: ATS_PROMPT,
        contents: [{ role: "user", parts: [{ text: contextSummary }] }],
        temperature: 0.5
      }),
      {
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const content = extractGeminiText(resp.data);
    if (!content) throw new Error("AI returned no content");
    responseCache.set(cacheKey, content);
    return content;
  } catch (err) {
    console.error("getATSSuggestions_v2 Gemini error:", {
      status: err?.response?.status,
      endpoint: GEMINI_URL,
      model: GEMINI_MODEL,
      error: err?.response?.data || err.message || err,
      message: extractGeminiError(err?.response?.data)
    });
    const fallback = simpleDeterministic(weakSignals, missingSkills, resumeText);
    responseCache.set(cacheKey, fallback);
    return fallback;
  }
}
