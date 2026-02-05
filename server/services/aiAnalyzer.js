import axios from "axios";

const KIMI_URL = "https://api.moonshot.ai/v1/chat/completions";
const MODEL = "kimi-k2-turbo-preview";

const ATS_PROMPT = `You are an ATS (Applicant Tracking System) and career expert. Compare the resume with the job description and provide concise, actionable feedback in plain text. Structure your response with these sections (use exactly these headers):

Grammar mistakes:
- Review the resume for grammar, spelling, and punctuation errors. List each mistake with the correction (e.g. "X" → "Y"). If there are none, say "None found."

Missing skills:
- List key skills/terms from the JD that are missing or weak in the resume.

Improvements:
- 2–4 concrete improvements to better align the resume with the role.

Bullet rewrite suggestions:
- Suggest 1–2 stronger bullet formulations (action verb + impact) for relevant experience.

ATS tips:
- 2–3 short tips to improve ATS compatibility (keywords, formatting, etc.).

Keep each section brief. Use bullet points. No markdown headers (no #). Plain text only.`;

/**
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Job description
 * @returns {Promise<string>} AI suggestions text
 */
export async function getATSSuggestions(resumeText, jobDescription) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY is not set");
  }

  const userContent = `Job description:\n${jobDescription.slice(0, 6000)}\n\nResume (excerpt):\n${resumeText.slice(0, 6000)}`;

  const response = await axios.post(
    KIMI_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: ATS_PROMPT },
        { role: "user", content: userContent }
      ],
      temperature: 0.5
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error("AI returned no content");
  }
  return content;
}
