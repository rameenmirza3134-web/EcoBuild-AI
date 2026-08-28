import { useState } from "react";
import { Sun, Zap, TrendingDown, Leaf, Loader2, Home, Coins } from "lucide-react";
import type { GeocodeResult, HouseDetails, SolarPotential } from "@/types";
import { calculateSolarPotential } from "@/api";

interface SolarCalculatorProps {
  geocodeResult: GeocodeResult;
  houseDetails: HouseDetails;
  onSolarCalculated: (solar: SolarPotential) => void;
}

function parsePlotSizeSqm(plotSize: string): number {
  if (!plotSize) return 100;
  const sqftMatch = plotSize.match(/([\d,.]+)\s*(?:sq\s*ft|sqft|square\s*feet|sf)/i);
  if (sqftMatch) return parseFloat(sqftMatch[1].replace(/,/g, "")) * 0.092903;
  const sqmMatch = plotSize.match(/([\d,.]+)\s*(?:sq\s*m|sqm|square\s*met)/i);
  if (sqmMatch) return parseFloat(sqmMatch[1].replace(/,/g, ""));
  const marlaMatch = plotSize.match(/([\d,.]+)\s*marla/i);
  if (marlaMatch) return parseFloat(marlaMatch[1].replace(/,/g, "")) * 25.29;
  const kanalMatch = plotSize.match(/([\d,.]+)\s*kanal/i);
  if (kanalMatch) return parseFloat(kanalMatch[1].replace(/,/g, "")) * 505.86;
  const num = parseFloat(plotSize.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 100 : num * 0.092903;
}

export function SolarCalculator({ geocodeResult, houseDetails, onSolarCalculated }: SolarCalculatorProps) {
  const [solar, setSolar] = useState<SolarPotential | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const roofArea = parsePlotSizeSqm(houseDetails.plotSize);
      const result = await calculateSolarPotential(
        geocodeResult.lat,
        geocodeResult.lon,
        roofArea,
        houseDetails.roofType,
        { code: geocodeResult.currency.code, symbol: geocodeResult.currency.symbol }
      );
      setSolar(result);
      onSolarCalculated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate solar potential.");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded && !solar) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Solar Potential Calculator</h3>
            <p className="text-sm text-slate-500">See how much energy your roof could generate</p>
          </div>
        </div>
        <button onClick={() => setExpanded(true)} className="btn-secondary w-full mt-2 flex items-center justify-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" /> Calculate Solar Potential
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Sun className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Solar Potential Calculator</h3>
          <p className="text-sm text-slate-500">Based on your roof and local solar radiation data</p>
        </div>
      </div>

      {!solar && !loading && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-2">Estimated roof area from your plot size ({houseDetails.plotSize || "not specified"}):</p>
            <p className="font-semibold text-slate-800">{Math.round(parsePlotSizeSqm(houseDetails.plotSize))} m² usable</p>
            <p className="text-xs text-slate-400 mt-1">Roof type: {houseDetails.roofType || "Not specified"}</p>
          </div>
          <button onClick={handleCalculate} className="btn-primary w-full flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> Get Solar Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Analyzing solar radiation data...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {solar && !loading && (
        <div className="animate-fade-in-up space-y-4">
          {/* Hero stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
              <Zap className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{solar.yearlyEnergyKWh.toLocaleString()}</p>
              <p className="text-sm text-amber-100">kWh / year</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
              <Leaf className="w-6 h-6 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{solar.yearlyCO2ReductionKg.toLocaleString()}</p>
              <p className="text-sm text-emerald-100">kg CO₂ saved / year</p>
            </div>
          </div>

          {/* Detailed stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-slate-500">Peak Sun Hours</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{solar.peakSunHours} hrs/day</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">System Size</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{solar.systemCapacityKW} kW · {solar.panelCount} panels</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-500">Est. System Cost</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {solar.currencySymbol} {solar.totalSystemCost.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-slate-500">Yearly Savings</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {solar.currencySymbol} {solar.yearlySavings.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payback period */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Estimated Payback Period</p>
                <p className="text-xs text-blue-500 mt-0.5">Time to recover your investment</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{solar.paybackYears} years</p>
            </div>
            {/* Payback bar */}
            <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (1 / solar.paybackYears) * 100 * 5)}%` }}
              />
            </div>
          </div>

          {/* Environmental impact */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">Environmental Impact</p>
            </div>
            <p className="text-sm text-emerald-600">
              Equivalent to planting <span className="font-bold">{solar.treesEquivalent} trees</span> —
              your roof could offset {solar.yearlyCO2ReductionKg.toLocaleString()} kg of CO₂ every year.
            </p>
          </div>

          {/* Roof suitability */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-1">Roof Suitability</p>
            <p className="text-sm text-slate-500">{solar.roofSuitability}</p>
          </div>
        </div>
      )}
    </div>
  );
}
