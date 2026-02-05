import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { scoreResume } from "../services/scorer.js";
import { getATSSuggestions } from "../services/aiAnalyzer.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    if (ok) cb(null, true);
    else cb(new Error("Only PDF resumes are supported"), false);
  }
});

router.post("/", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file (PDF) is required" });
    }

    const jobDescription = req.body?.jobDescription?.trim() ?? "";
    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const buffer = req.file.buffer;
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const resumeText = textResult.text?.trim() ?? "";

    if (!resumeText) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    const { score, matchedSkills, missingSkills } = scoreResume(resumeText, jobDescription);

    let suggestions = "";
    try {
      suggestions = await getATSSuggestions(resumeText, jobDescription);
    } catch (err) {
      console.error("ATS AI suggestions error:", err.message);
      suggestions = "AI suggestions are temporarily unavailable.";
    }

    res.json({
      score,
      matchedSkills,
      missingSkills,
      suggestions
    });
  } catch (err) {
    if (err.message?.includes("Only PDF")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("ATS route error:", err);
    res.status(500).json({
      error: err.message || "Analysis failed"
    });
  }
});

export default router;
