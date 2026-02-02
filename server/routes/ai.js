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
      "https://api.moonshot.cn/v1/chat/completions",
      {
        model: "kimi-k2",
        messages: [
          {
            role: "system",
            content:
              "You are Basil's portfolio assistant. Answer only about his projects, skills, and experience."
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content == null) {
      console.error("Unexpected API response:", response.data);
      return res.status(500).json({ error: "AI failed" });
    }

    res.json({ reply: content });
  } catch (err) {
    console.error("AI route error:", err?.response?.data ?? err.message);
    res.status(500).json({ error: "AI failed" });
  }
});

export default router;
