import { useState, useEffect } from "react";

export default function ProcessingPlaceholder() {
  const [activeStep, setActiveStep] = useState(1);
  const [cursorVisible, setCursorVisible] = useState(true);

  const steps = [
    { id: 1, label: "Parsing your resume", command: "pdf-parse --extract-text resume.pdf" },
    { id: 2, label: "Analyzing your experience", command: "analyze --experience --years" },
    { id: 3, label: "Extracting your skills", command: "extract --keywords --skills" },
    { id: 4, label: "Generating recommendations", command: "ai --generate --suggestions" }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev >= steps.length ? 1 : prev + 1));
    }, 2000);

    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(stepInterval);
      clearInterval(cursorInterval);
    };
  }, [steps.length]);

  return (
    <div className="border-2 border-black bg-black">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-green-500">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-green-400 font-mono">TERMINAL</span>
        <div className="flex items-center gap-2 text-green-500/60">
          <span className="text-[10px] sm:text-xs">—</span>
          <span className="text-[10px] sm:text-xs">□</span>
        </div>
      </div>
      <div className="p-4 sm:p-6 bg-black font-mono">
        <div className="mb-4">
          <span className="text-green-400">$</span>
          <span className="text-green-300 ml-2">ats-scanner --resume resume.pdf</span>
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((step) => {
            const isActive = step.id === activeStep;
            const isCompleted = step.id < activeStep;
            return (
              <div key={step.id} className="space-y-1">
                <div className={`flex items-center gap-2 transition-all duration-300 ${
                  isActive ? "text-green-400" : isCompleted ? "text-green-500/60" : "text-gray-600"
                }`}>
                  <span className="text-green-500">{isActive ? ">" : isCompleted ? "✓" : "○"}</span>
                  <span className={`text-xs sm:text-sm ${isActive ? "font-semibold" : ""}`}>
                    {step.label}
                  </span>
                </div>
                {isActive && (
                  <div className="ml-6 text-xs text-green-500/80 font-mono">
                    <span>{step.command}</span>
                    <span className={`ml-1 ${cursorVisible ? "opacity-100" : "opacity-0"}`}>█</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="ml-6 text-xs text-green-500/40 font-mono line-through">
                    {step.command}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Terminal Output Lines */}
        <div className="space-y-2 mt-6 pt-4 border-t border-green-500/20">
          <div className="h-3 bg-green-900/30 rounded animate-pulse" style={{ width: "85%" }}></div>
          <div className="h-3 bg-green-900/30 rounded animate-pulse" style={{ width: "70%" }}></div>
          <div className="h-3 bg-green-900/30 rounded animate-pulse" style={{ width: "90%" }}></div>
          <div className="h-3 bg-green-900/30 rounded animate-pulse" style={{ width: "60%" }}></div>
        </div>

        <div className="mt-4 text-xs text-green-500/60">
          <span>Status: </span>
          <span className="text-green-400 animate-pulse">RUNNING</span>
        </div>
      </div>
    </div>
  );
}
