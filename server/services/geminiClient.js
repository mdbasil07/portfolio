import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
export const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || "";
}

export function getGeminiEndpoint(model = GEMINI_MODEL, action = "generateContent") {
  return `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:${action}`;
}

function normalizeTextPart(part) {
  if (typeof part === "string") return { text: part };
  return part;
}

export function buildGeminiPayload({
  systemInstruction,
  contents,
  temperature = 0.6,
  maxOutputTokens
}) {
  const payload = {
    contents: contents.map((content) => ({
      role: content.role === "model" ? "model" : "user",
      parts: content.parts.map(normalizeTextPart)
    })),
    generationConfig: {
      temperature
    }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (maxOutputTokens) {
    payload.generationConfig.maxOutputTokens = maxOutputTokens;
  }

  return payload;
}

export function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();
}

export function extractGeminiError(data) {
  if (!data) return "Gemini request failed";
  if (typeof data === "string") return data;
  return data?.error?.message || data?.message || JSON.stringify(data);
}

export function logGeminiRequest({ label, endpoint, model, apiKey }) {
  console.log(`[Gemini] ${label}`);
  console.log(`[Gemini] endpoint: ${endpoint}`);
  console.log(`[Gemini] model: ${model}`);
  console.log(`[Gemini] API key exists: ${Boolean(apiKey)}`);
}

export async function generateGeminiContent({
  label = "generateContent",
  systemInstruction,
  userText,
  temperature = 0.6,
  timeout = 15000,
  maxOutputTokens
}) {
  const apiKey = getGeminiApiKey();
  const endpoint = getGeminiEndpoint(GEMINI_MODEL, "generateContent");
  logGeminiRequest({ label, endpoint, model: GEMINI_MODEL, apiKey });

  if (!apiKey) {
    throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 500 });
  }

  const response = await axios.post(
    endpoint,
    buildGeminiPayload({
      systemInstruction,
      contents: [{ role: "user", parts: [{ text: userText }] }],
      temperature,
      maxOutputTokens
    }),
    {
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      timeout
    }
  );

  const content = extractGeminiText(response.data);
  if (!content) {
    console.error("[Gemini] Empty response:", JSON.stringify(response.data, null, 2));
    throw new Error("Gemini returned no content");
  }

  return content;
}
