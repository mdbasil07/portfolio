export default function ResumeUploader({ file, onFileChange, jd, onJdChange, onSubmit, loading, disabled }) {
  return (
    <div className="border-2 border-black bg-white">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest">INPUT</span>
        <div className="flex items-center gap-2 text-black/40">
          <span className="text-[10px] sm:text-xs">—</span>
          <span className="text-[10px] sm:text-xs">□</span>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Resume (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            disabled={disabled || loading}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-black file:mr-4 file:border-2 file:border-black file:bg-white file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-wider hover:file:bg-black hover:file:text-white file:transition-colors disabled:opacity-60 disabled:pointer-events-none"
          />
          {file && (
            <p className="mt-1 text-xs text-black/50">{file.name}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Job description</label>
          <textarea
            placeholder="Paste the job description here..."
            value={jd}
            disabled={disabled || loading}
            onChange={(e) => onJdChange(e.target.value)}
            rows={6}
            className="w-full border-2 border-black bg-[#f4f4f5] px-4 py-3 text-sm text-black placeholder-black/40 focus:border-black focus:bg-white focus:outline-none disabled:opacity-60 disabled:pointer-events-none"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading || !file || !jd.trim()}
          className="w-full border-2 border-black bg-black px-4 py-3 text-xs font-bold text-white tracking-widest uppercase transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
    </div>
  );
}
