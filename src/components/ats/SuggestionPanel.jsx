function isHeading(line) {
  const t = line.trim();
  return t.length > 0 && (t.endsWith(":") || /^(Grammar mistakes|Missing skills|Improvements|Bullet rewrite suggestions|ATS tips)/i.test(t));
}

export default function SuggestionPanel({ suggestions }) {
  if (!suggestions?.trim()) return null;
  const lines = suggestions.split("\n");
  return (
    <div className="border-2 border-black bg-white">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-black">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest">AI_SUGGESTIONS</span>
        <div className="flex items-center gap-2 text-black/40">
          <span className="text-[10px] sm:text-xs">—</span>
          <span className="text-[10px] sm:text-xs">□</span>
        </div>
      </div>
      <div className="p-4 sm:p-6 text-sm text-black leading-relaxed">
        {lines.map((line, i) =>
          isHeading(line) ? (
            <div key={i} className="mt-4 first:mt-0 font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1 mb-2">
              {line.trim()}
            </div>
          ) : (
            <div key={i} className="whitespace-pre-wrap">{line || " "}</div>
          )
        )}
      </div>
    </div>
  );
}
