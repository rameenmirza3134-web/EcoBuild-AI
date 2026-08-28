import { useState } from "react";
import { Home, ArrowRight, ArrowLeft, Loader2, Ruler, Building2 } from "lucide-react";
import type { HouseDetails } from "@/types";

interface HouseStepProps {
  initialDetails: HouseDetails;
  onSubmit: (details: HouseDetails) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

const OPTIONS = {
  status: ["Planning", "Under Construction", "Already Built", "Renovation"],
  buildingType: ["Residential", "Commercial", "Industrial", "Mixed Use"],
  floors: ["1", "2", "3", "4+"],
  roofType: ["Flat Concrete", "Sloped Tile", "Metal Sheet", "Flat + Parapet"],
  wallMaterial: ["Brick", "Concrete Block", "Stone", "Wood Frame", "RCC"],
  roofColor: ["Dark", "Light", "White", "Red/Brown"],
  wallColor: ["Dark", "Light", "White", "Natural"],
  windows: ["Single Glazed", "Double Glazed", "No Windows", "Wooden"],
  ventilation: ["Natural", "Mechanical", "None", "Mixed"],
  coolingSystem: ["None", "Fans Only", "AC (Some Rooms)", "AC (Whole Building)", "Evaporative Cooler"],
};

function OptionGroup({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
              value === opt
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HouseStep({ initialDetails, onSubmit, onBack, loading, error }: HouseStepProps) {
  const [details, setDetails] = useState<HouseDetails>(initialDetails);

  const update = (key: keyof HouseDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    details.plotSize && details.status && details.buildingType &&
    details.roofType && details.wallMaterial;

  return (
    <div className="animate-fade-in-up max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
          <Home className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tell us about your building</h2>
        <p className="text-slate-500">
          The more details you provide, the more accurate your recommendations will be.
        </p>
      </div>

      <div className="card p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4" /> Plot Size</span>
            </label>
            <input
              type="text"
              value={details.plotSize}
              onChange={(e) => update("plotSize", e.target.value)}
              placeholder="e.g. 2000 sq ft"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Budget</span>
            </label>
            <input
              type="text"
              value={details.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="e.g. 500000"
              className="input-field"
            />
          </div>
        </div>

        <OptionGroup label="Construction Status" options={OPTIONS.status} value={details.status} onChange={(v) => update("status", v)} />
        <OptionGroup label="Building Type" options={OPTIONS.buildingType} value={details.buildingType} onChange={(v) => update("buildingType", v)} />
        <OptionGroup label="Number of Floors" options={OPTIONS.floors} value={details.floors} onChange={(v) => update("floors", v)} />
        <OptionGroup label="Roof Type" options={OPTIONS.roofType} value={details.roofType} onChange={(v) => update("roofType", v)} />
        <OptionGroup label="Wall Material" options={OPTIONS.wallMaterial} value={details.wallMaterial} onChange={(v) => update("wallMaterial", v)} />
        <OptionGroup label="Roof Color" options={OPTIONS.roofColor} value={details.roofColor} onChange={(v) => update("roofColor", v)} />
        <OptionGroup label="Windows" options={OPTIONS.windows} value={details.windows} onChange={(v) => update("windows", v)} />
        <OptionGroup label="Ventilation" options={OPTIONS.ventilation} value={details.ventilation} onChange={(v) => update("ventilation", v)} />
        <OptionGroup label="Cooling System" options={OPTIONS.coolingSystem} value={details.coolingSystem} onChange={(v) => update("coolingSystem", v)} />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <button
            onClick={() => onSubmit(details)}
            disabled={loading || !canSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing your building...
              </>
            ) : (
              <>
                Analyze My Building
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
