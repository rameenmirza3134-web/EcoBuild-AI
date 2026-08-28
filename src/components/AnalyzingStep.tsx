import { Loader2 } from "lucide-react";

export function AnalyzingStep() {
  const steps = [
    "Analyzing climate data...",
    "Evaluating building materials...",
    "Calculating energy efficiency...",
    "Generating recommendations...",
  ];

  return (
    <div className="animate-fade-in-up max-w-md mx-auto w-full text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-3xl mb-6">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Analysis in Progress</h2>
      <p className="text-slate-500 mb-8">
        Our AI is analyzing your building against real-time climate data to generate personalized recommendations.
      </p>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 card p-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
            <span className="text-sm text-slate-600 text-left">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
