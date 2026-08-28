import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, Lightbulb, Snowflake, Package,
  ExternalLink, ArrowLeft, RotateCcw, Thermometer, Shield,
} from "lucide-react";
import type { AnalysisResult, GeocodeResult, HouseDetails, RecommendedAction, SolarPotential } from "@/types";
import { SolarCalculator } from "@/components/SolarCalculator";
import { HeatMapVisualization } from "@/components/HeatMapVisualization";
import { SaveAndCompare } from "@/components/SaveAndCompare";

interface ResultsStepProps {
  analysis: AnalysisResult;
  geocodeResult: GeocodeResult;
  houseDetails: HouseDetails;
  country: string;
  city: string;
  onSolarCalculated: (solar: SolarPotential) => void;
  onViewReports: () => void;
  onRestart: () => void;
  onBack: () => void;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Low: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof AlertTriangle; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ResultsStep({
  analysis, geocodeResult, houseDetails, country, city,
  onSolarCalculated, onViewReports, onRestart, onBack,
}: ResultsStepProps) {
  const w = geocodeResult.weather;
  const [solarPotential, setSolarPotential] = useState<SolarPotential | null>(null);

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto w-full">
      {/* Summary banner */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-emerald-600 to-teal-700 border-0 text-white">
        <div className="flex items-center gap-2 mb-3 text-emerald-100">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium">AI Analysis Complete</span>
        </div>
        <p className="text-lg font-semibold leading-relaxed">{analysis.overallSummary}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-emerald-100">
          <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4" /> {Math.round(w.currentTemp)}°C in {geocodeResult.displayName.split(",")[0]}</span>
          <span className="flex items-center gap-1.5"><Package className="w-4 h-4" /> {analysis.recommendedMaterials.length} materials recommended</span>
        </div>
      </div>

      {/* Interactive Heat Map */}
      <HeatMapVisualization geocodeResult={geocodeResult} houseDetails={houseDetails} />

      {/* Solar Potential Calculator */}
      <SolarCalculator
        geocodeResult={geocodeResult}
        houseDetails={houseDetails}
        onSolarCalculated={(s) => { setSolarPotential(s); onSolarCalculated(s); }}
      />

      {/* Building Assessment */}
      <div className="card p-6 mb-6">
        <SectionHeader icon={AlertTriangle} title="Building Assessment" subtitle="Key risks identified for your climate" />
        <p className="text-slate-600 mb-4">{analysis.buildingAssessment.summary}</p>
        <div className="space-y-2">
          {analysis.buildingAssessment.risks.map((risk, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-red-50/60 border border-red-100 px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700">{risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="card p-6 mb-6">
        <SectionHeader icon={CheckCircle2} title="Recommended Actions" subtitle="Prioritized by urgency" />
        <div className="space-y-4">
          {analysis.recommendedActions.map((action: RecommendedAction, i) => {
            const style = PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.Low;
            return (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                    {action.priority} Priority
                  </span>
                  <span className="text-xs text-slate-400">{action.category}</span>
                </div>
                <p className="font-semibold text-slate-800 mb-1">{action.recommendation}</p>
                <p className="text-sm text-slate-500 mb-2">{action.reason}</p>
                <div className="flex items-start gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{action.expectedBenefit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Materials */}
      <div className="card p-6 mb-6">
        <SectionHeader icon={Package} title="Recommended Materials" subtitle={`Cost estimates in ${geocodeResult.currency.code}`} />
        <div className="grid md:grid-cols-2 gap-4">
          {analysis.recommendedMaterials.map((mat, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-slate-800">{mat.material}</p>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{mat.category}</span>
              </div>
              <p className="text-sm text-slate-500 mb-3">{mat.why}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity</span>
                  <span className="text-slate-700 font-medium">{mat.estimatedQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Cost</span>
                  <span className="text-slate-700 font-medium">{mat.estimatedCostRange}</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(mat.searchQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Find suppliers <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Efficiency & Cooling */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <SectionHeader icon={Lightbulb} title="Energy Efficiency" />
          <div className="space-y-3">
            {analysis.energyEfficiency.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{tip.tip}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tip.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <SectionHeader icon={Snowflake} title="Cooling Strategy" />
          <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-4">
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.coolingStrategy}</p>
          </div>
        </div>
      </div>

      {/* Save & Compare */}
      <SaveAndCompare
        geocodeResult={geocodeResult}
        houseDetails={houseDetails}
        analysis={analysis}
        solarPotential={solarPotential}
        country={country}
        city={city}
        onViewReports={onViewReports}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={onRestart} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" /> Start New Analysis
        </button>
      </div>
    </div>
  );
}
