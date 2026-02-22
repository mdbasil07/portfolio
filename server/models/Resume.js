import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    fileName: String,
    cloudinaryUrl: String,
    publicId: String,
    fileSize: Number,
    format: String,
    atsScore: Number,
    uploadedAt: { type: Date, default: Date.now }
});

const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);
export default Resume;