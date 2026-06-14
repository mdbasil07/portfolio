import express from "express";
import axios from "axios";
import {
  buildGeminiPayload,
  extractGeminiError,
  extractGeminiText,
  GEMINI_MODEL,
  getGeminiApiKey,
  getGeminiEndpoint,
  logGeminiRequest
} from "../services/geminiClient.js";

const router = express.Router();

const SYSTEM_PROMPT = `You are Mikasa, Basil's portfolio assistant. When asked your name, say "Mikasa" (or "I'm Mikasa").

About Basil:
- Computer Science Engineering student
- Full-stack + DevOps developer

Projects & tools:
- EL-KAID → AI-driven billing & finance automation platform
- B1 → Electron desktop accounting app
- WedWise → Android wedding planning app
- AL-D → Real estate MERN platform
- TermTime → EdTech website
- ATS Resume Checker → /ats page that lets users upload a PDF resume and a job description, then:
  - Parses the resume text on the backend
  - Matches cleaned JD keywords against the resume (stopwords and common filler words removed)
  - Checks resume integrity (email, phone, LinkedIn) and structure (Experience, Education, Skills sections)
  - Combines these into a 0–100 score (roughly 50% keywords, 30% integrity, 20% sections)
  - Calls an AI model to highlight grammar mistakes, missing skills, improvements, bullet rewrites, and ATS tips.

Tech Stack:
React, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS, CI/CD, Electron, Android(Java)

Rules:
- Only answer using the above info (including the ATS Resume Checker details)
- You cannot see a user's actual resume or ATS score unless they paste it or tell you; in that case you can explain or interpret it.
- For ATS-related questions, explain clearly how the tool on this portfolio works and how users can improve their resumes for ATS.
- Never invent fake datasets or research
- Keep answers short and professional
- Keep answers under 4 sentences.
- Be concise and professional.
- Match the user's brevity: for simple greetings (hi, hello, hey), reply with one short line only—e.g. "👋 Hey! I'm Mikasa." Do not add extra pitch, taglines, or "here to help" style text unless the user asks what you can do.
- Use emojis naturally (e.g. 👋 for greetings). Don't overdo it—one or two per message is enough.`;

router.post("/ai", async (req, res) => {
  const { message, stream: useStream } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message (string) is required" });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: "Message too long" });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
  }

  const action = useStream ? "streamGenerateContent" : "generateContent";
  const endpoint = getGeminiEndpoint(GEMINI_MODEL, action);
  const requestUrl = useStream ? `${endpoint}?alt=sse` : endpoint;
  const payload = buildGeminiPayload({
    systemInstruction: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: message }] }],
    temperature: 0.6
  });
  logGeminiRequest({ label: useStream ? "chat stream" : "chat", endpoint: requestUrl, model: GEMINI_MODEL, apiKey });

  try {
    if (useStream) {
      const response = await axios.post(
        requestUrl,
        payload,
        {
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json"
          },
          responseType: "stream",
          validateStatus: () => true
        }
      );

      if (response.status !== 200) {
        const chunks = [];
        await new Promise((resolve, reject) => {
          response.data.on("data", (chunk) => chunks.push(chunk));
          response.data.on("end", resolve);
          response.data.on("error", reject);
        });
        const body = Buffer.concat(chunks).toString("utf8");
        let errMsg = "Gemini request failed";
        try {
          const parsed = JSON.parse(body);
          errMsg = extractGeminiError(parsed);
        } catch (_) {}
        console.error("Gemini stream error response:", {
          status: response.status,
          endpoint: requestUrl,
          model: GEMINI_MODEL,
          body
        });
        return res.status(response.status >= 400 ? response.status : 500).json({ error: errMsg });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let buffer = "";
      response.data.on("data", (chunk) => {
        buffer += chunk.toString("utf8").replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const dataLines = event
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.replace(/^data:\s*/, ""));

          if (dataLines.length === 0) continue;

          try {
            const geminiChunk = JSON.parse(dataLines.join(""));
            const text = extractGeminiText(geminiChunk);
            if (text) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
            }
          } catch (err) {
            console.error("Gemini stream parse error:", err.message);
          }
        }
      });
      response.data.on("end", () => {
        res.write("data: [DONE]\n\n");
        res.end();
      });
      response.data.on("error", (err) => {
        console.error("Gemini stream pipe error:", err);
        if (!res.writableEnded) res.end();
      });
      return;
    }

    const response = await axios.post(
      requestUrl,
      payload,
      {
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    const content = extractGeminiText(response.data);
    if (content == null) {
      console.error("Unexpected Gemini response:", JSON.stringify(response.data, null, 2));
      return res.status(500).json({ error: "Gemini returned no content" });
    }

    res.json({ reply: content });
  } catch (err) {
    const apiError = err?.response?.data;
    const status = err?.response?.status;
    const msg = extractGeminiError(apiError) || err.message;
    console.error("Gemini route error response:", {
      status,
      endpoint: requestUrl,
      model: GEMINI_MODEL,
      error: apiError || err.message
    });
    res.status(status && status >= 400 && status < 600 ? status : 500).json({
      error: msg
    });
  }
});

export default router;
