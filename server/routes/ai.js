import express from "express";
import axios from "axios";

const router = express.Router();

const SYSTEM_PROMPT = `You are Mikasa, Basil's portfolio assistant. When asked your name, say "Mikasa" (or "I'm Mikasa").

About Basil:
- Computer Science Engineering student
- Full-stack + DevOps developer

Projects:
- EL-KAID → AI-driven billing & finance automation platform
- B1 → Electron desktop accounting app
- WedWise → Android wedding planning app
- AL-D → Real estate MERN platform
- TermTime → EdTech website

Tech Stack:
React, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS, CI/CD, Electron, Android(Java)

Rules:
- Only answer using the above info
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

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    console.error("KIMI_API_KEY is not set");
    return res.status(500).json({ error: "AI failed" });
  }

  const payload = {
    model: "kimi-k2-turbo-preview",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ],
    temperature: 0.6
  };

  if (useStream) {
    payload.stream = true;
  }

  try {
    if (useStream) {
      const response = await axios.post(
        "https://api.moonshot.ai/v1/chat/completions",
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        let errMsg = "AI failed";
        try {
          const parsed = JSON.parse(body);
          errMsg = parsed?.error?.message || errMsg;
        } catch (_) {}
        console.error("AI stream error:", response.status, errMsg);
        return res.status(response.status >= 400 ? response.status : 500).json({ error: errMsg });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      response.data.pipe(res);
      response.data.on("error", (err) => {
        console.error("AI stream pipe error:", err);
        if (!res.writableEnded) res.end();
      });
      return;
    }

    const response = await axios.post(
      "https://api.moonshot.ai/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content == null) {
      console.error("Unexpected API response:", response.data);
      return res.status(500).json({ error: "AI failed" });
    }

    res.json({ reply: content });
  } catch (err) {
    const apiError = err?.response?.data?.error;
    const status = err?.response?.status;
    const msg = apiError?.message || apiError?.code || err.message;
    console.error("AI route error:", status, apiError || err.message);
    res.status(status && status >= 400 && status < 600 ? status : 500).json({
      error: "AI failed",
      details: process.env.NODE_ENV !== "production" ? msg : undefined
    });
  }
});

export default router;
