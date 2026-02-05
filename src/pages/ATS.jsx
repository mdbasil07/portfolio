import { useState } from "react";
import ResumeUploader from "../components/ats/ResumeUploader";
import ScoreCard from "../components/ats/ScoreCard";
import SuggestionPanel from "../components/ats/SuggestionPanel";
import ProcessingPlaceholder from "../components/ats/ProcessingPlaceholder";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "https://portfolio-api-kean.onrender.com");

export default function ATS() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file || !jd.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("jobDescription", jd.trim());

      const res = await fetch(`${API_BASE}/api/ats`, {
        method: "POST",
        body: form
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Analysis failed");
      }

      setResult({
        score: data.score ?? 0,
        matchedSkills: data.matchedSkills ?? [],
        missingSkills: data.missingSkills ?? [],
        suggestions: data.suggestions ?? ""
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] pt-24 sm:pt-28 pb-12 sm:pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-16 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Left Column - Input */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 tracking-wide">
              ATS Resume Checker
            </h1>
            <p className="text-black/60 text-sm mb-6 sm:mb-8 tracking-wide">
              Upload your resume (PDF) and paste the job description to get a score and AI suggestions.
            </p>

            <ResumeUploader
              file={file}
              onFileChange={setFile}
              jd={jd}
              onJdChange={setJd}
              onSubmit={handleSubmit}
              loading={loading}
              disabled={loading}
            />

            {error && (
              <div className="mt-6 border-2 border-black bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:mt-[72px]">
            {loading ? (
              <ProcessingPlaceholder />
            ) : result ? (
              <div className="space-y-6">
                <ScoreCard score={result.score} />
                <SuggestionPanel suggestions={result.suggestions} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
