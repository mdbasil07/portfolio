import express from "express";
import multer from "multer";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { hybridATSScorer, rankCandidates } from "../services/scorer.js";
import { getATSSuggestions } from "../services/aiAnalyzer_v2.js";
import cloudinary from "../config/cloudinary.js";
import Resume from "../models/Resume.js";

const router = express.Router();

// Multer config
const upload = multer({
  dest: "uploads/", // temporary folder
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    if (ok) cb(null, true);
    else cb(new Error("Only PDF resumes are supported"), false);
  }
});

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file (PDF) is required" });
    }

    const jobDescription = req.body?.jobDescription?.trim() ?? "";
    if (!jobDescription) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Job description is required" });
    }

    const buffer = fs.readFileSync(file.path);

    // Previous ATS scoring logic
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const resumeText = textResult.text?.trim() ?? "";

    if (!resumeText) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    const atsResult = await hybridATSScorer({
      resumeText,
      jobDescText: jobDescription,
      useEmbeddings: true,
    });
    const { score, matchedSkills, missingSkills, breakdown, features, recommendations, penalties, gamingFlags, meta } = atsResult;

    let suggestions = "";
    try {
      suggestions = await getATSSuggestions({
        resumeText,
        jobDescription,
        score: atsResult.score,
        weakSignals: atsResult.weakSignals,
        missingSkills: atsResult.missingSkills,
        riskFlags: atsResult.riskFlags
      });
    } catch (err) {
      console.error("ATS AI suggestions error:", err.message);
      // aiAnalyzer now provides deterministic fallback; keep a safe fallback string
      suggestions = "AI suggestions are temporarily unavailable.";
    }

    // Upload to Cloudinary
    let result;
    try {
      result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto",
        folder: "resumes",
      });
    } catch (err) {
      console.error("Cloudinary error:", err);
      if (file) fs.unlinkSync(file.path);
      return res.status(500).json({ error: "Failed to upload to Cloudinary" });
    }

    // Save metadata in MongoDB
    let savedResume;
    try {
      console.log("Attempting to save resume to MongoDB...");
      savedResume = await Resume.create({
        fileName: file.originalname,
        cloudinaryUrl: result.secure_url,
        publicId: result.public_id,
        fileSize: file.size, // in bytes
        format: result.format || "pdf",
        atsScore: score, // real ATS score!
        uploadedAt: new Date(),
      });
      console.log("Successfully saved resume to MongoDB:", savedResume._id);
    } catch (err) {
      console.error("MongoDB save error:", err);
      // It's optional if we wanna fail the request just because of MongoDB, but we try.
    }

    // Delete temp file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // ignore unlink errors
    }

    res.json({
      message: "Resume uploaded successfully",
      data: savedResume,
      score,
      matchedSkills,
      missingSkills,
      suggestions,
      breakdown,
      features,
      recommendations,
      penalties,
      gamingFlags,
      meta,
    });
  } catch (err) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) { }
    }
    if (err.message?.includes("Only PDF")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("ATS upload-resume error:", err);
    res.status(500).json({
      error: err.message || "Upload failed"
    });
  }
});

// Retaining old route just in case the frontend relies exactly on `/api/ats`
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file (PDF) is required" });
    }

    const jobDescription = req.body?.jobDescription?.trim() ?? "";
    if (!jobDescription) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Job description is required" });
    }

    const buffer = fs.readFileSync(file.path);
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const resumeText = textResult.text?.trim() ?? "";

    if (!resumeText) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    const atsResult = await hybridATSScorer({
      resumeText,
      jobDescText: jobDescription,
      useEmbeddings: true,
    });
    const { score, matchedSkills, missingSkills, breakdown, features, recommendations, penalties, gamingFlags, meta } = atsResult;
    let suggestions = "";
    try {
      suggestions = await getATSSuggestions({
        resumeText,
        jobDescription,
        score: atsResult.score,
        weakSignals: atsResult.weakSignals,
        missingSkills: atsResult.missingSkills,
        riskFlags: atsResult.riskFlags
      });
    } catch (err) {
      suggestions = "AI suggestions are temporarily unavailable.";
    }

    // Just delete file, no uploads
    try {
      fs.unlinkSync(file.path);
    } catch (e) { }

    res.json({
      score,
      matchedSkills,
      missingSkills,
      suggestions,
      breakdown,
      features,
      recommendations,
      penalties,
      gamingFlags,
      meta,
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

export default router;
