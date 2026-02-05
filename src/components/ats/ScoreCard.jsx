export default function ScoreCard({ score }) {
  const band = score >= 70 ? "green" : score >= 40 ? "yellow" : "red";
  const styles =
    band === "green"
      ? "bg-[#f4f4f5] text-black"
      : band === "yellow"
        ? "bg-amber-50 text-black"
        : "bg-red-50 text-red-900";

  return (
    <div className={`border-2 border-black ${styles}`}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest">ATS_SCORE</span>
        <div className="flex items-center gap-2 text-black/40">
          <span className="text-[10px] sm:text-xs">—</span>
          <span className="text-[10px] sm:text-xs">□</span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-4xl font-bold tabular-nums">{score}%</p>
      </div>
    </div>
  );
}
