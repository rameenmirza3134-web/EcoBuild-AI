import {
  Thermometer, Droplets, Wind, Sun, ArrowRight, ArrowLeft,
  CloudRain, Gauge, MapPin,
} from "lucide-react";
import type { GeocodeResult } from "@/types";

interface ClimateStepProps {
  geocodeResult: GeocodeResult;
  onContinue: () => void;
  onBack: () => void;
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function ClimateStep({ geocodeResult, onContinue, onBack }: ClimateStepProps) {
  const w = geocodeResult.weather;
  return (
    <div className="animate-fade-in-up max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-2xl mb-4">
          <Thermometer className="w-8 h-8 text-sky-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Live Climate Data</h2>
        <p className="text-slate-500 flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {geocodeResult.displayName}
        </p>
      </div>

      <div className="card p-6 mb-6 bg-gradient-to-br from-sky-50 to-emerald-50 border-sky-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">Climate Condition</span>
          <span className="text-xs text-slate-400">{w.timezone}</span>
        </div>
        <p className="text-lg font-semibold text-slate-800">{w.condition}</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-5xl font-bold text-slate-800">{Math.round(w.currentTemp)}°</span>
          <span className="text-lg text-slate-500 mb-1">C</span>
          <span className="text-sm text-slate-400 mb-1.5 ml-2">
            Feels like {Math.round(w.feelsLike)}°C
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={Thermometer}
          label="Today's Range"
          value={`${Math.round(w.minTemp)}° – ${Math.round(w.maxTemp)}°C`}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          icon={Droplets}
          label="Humidity"
          value={`${w.humidity}%`}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Wind}
          label="Wind Speed"
          value={`${w.windSpeed} km/h`}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          icon={Sun}
          label="UV Index"
          value={`${w.uvIndex ?? "—"}`}
          sub={w.uvIndex >= 8 ? "Very high" : w.uvIndex >= 6 ? "High" : "Moderate"}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={CloudRain}
          label="Precipitation"
          value={`${w.precipitation ?? 0} mm`}
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={Gauge}
          label="Currency"
          value={geocodeResult.currency.code}
          sub={geocodeResult.currency.name}
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button onClick={onContinue} className="btn-primary flex-1 flex items-center justify-center gap-2">
          Continue to Building Details
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
