import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/ai", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message (string) is required" });
  }

  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    console.error("KIMI_API_KEY is not set");
    return res.status(500).json({ error: "AI failed" });
  }

  try {
    const response = await axios.post(
      "https://api.moonshot.ai/v1/chat/completions",
      {
        model: "kimi-k2-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are Basil's portfolio assistant. Answer only about his skills and projects."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
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
