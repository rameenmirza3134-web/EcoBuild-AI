import { useState } from "react";
import { Leaf, FolderOpen } from "lucide-react";
import type { Step, GeocodeResult, HouseDetails, AnalysisResult, SolarPotential, SavedReport } from "@/types";
import { geocodeLocation, analyzeBuilding } from "@/api";
import { LocationStep } from "@/components/LocationStep";
import { ClimateStep } from "@/components/ClimateStep";
import { HouseStep } from "@/components/HouseStep";
import { AnalyzingStep } from "@/components/AnalyzingStep";
import { ResultsStep } from "@/components/ResultsStep";
import { SavedReportsView, CompareView } from "@/components/SaveAndCompare";

const STEPS: { id: Step; label: string }[] = [
  { id: "location", label: "Location" },
  { id: "climate", label: "Climate" },
  { id: "house", label: "Building" },
  { id: "results", label: "Results" },
];

const EMPTY_HOUSE: HouseDetails = {
  plotSize: "", floors: "", status: "", buildingType: "",
  roofType: "", wallMaterial: "", roofColor: "", wallColor: "",
  windows: "", ventilation: "", coolingSystem: "", budget: "",
};

function App() {
  const [step, setStep] = useState<Step>("location");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [houseDetails, setHouseDetails] = useState<HouseDetails>(EMPTY_HOUSE);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [solarPotential, setSolarPotential] = useState<SolarPotential | null>(null);
  const [compareReports, setCompareReports] = useState<SavedReport[]>([]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const handleLocationSubmit = async (c: string, ci: string) => {
    setLoading(true);
    setError(null);
    try {
      setCountry(c);
      setCity(ci);
      const result = await geocodeLocation(c, ci);
      setGeocodeResult(result);
      setStep("climate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to look up location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHouseSubmit = async (details: HouseDetails) => {
    if (!geocodeResult) return;
    setLoading(true);
    setError(null);
    setHouseDetails(details);
    setSolarPotential(null);
    setStep("analyzing");
    try {
      const result = await analyzeBuilding(
        { lat: geocodeResult.lat, lon: geocodeResult.lon, displayName: geocodeResult.displayName },
        geocodeResult.weather,
        details,
        geocodeResult.currency
      );
      setAnalysis(result);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setStep("house");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep("location");
    setCountry("");
    setCity("");
    setGeocodeResult(null);
    setHouseDetails(EMPTY_HOUSE);
    setAnalysis(null);
    setSolarPotential(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={handleRestart} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-800 leading-tight">EcoBuild AI</h1>
              <p className="text-xs text-slate-400 leading-tight">Climate-smart building advisor</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {step !== "analyzing" && step !== "saved" && (
              <button
                onClick={() => setStep("saved")}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Saved Reports</span>
              </button>
            )}

            {step !== "analyzing" && step !== "saved" && (
              <div className="hidden sm:flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        i <= currentStepIndex ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          i < currentStepIndex
                            ? "bg-emerald-600 text-white"
                            : i === currentStepIndex
                            ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {i < currentStepIndex ? "✓" : i + 1}
                      </span>
                      <span className="hidden md:inline">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {step === "location" && (
          <LocationStep onSubmit={handleLocationSubmit} loading={loading} error={error} />
        )}
        {step === "climate" && geocodeResult && (
          <ClimateStep
            geocodeResult={geocodeResult}
            onContinue={() => { setError(null); setStep("house"); }}
            onBack={() => setStep("location")}
          />
        )}
        {step === "house" && (
          <HouseStep
            initialDetails={houseDetails}
            onSubmit={handleHouseSubmit}
            onBack={() => setStep("climate")}
            loading={loading}
            error={error}
          />
        )}
        {step === "analyzing" && <AnalyzingStep />}
        {step === "results" && analysis && geocodeResult && (
          <ResultsStep
            analysis={analysis}
            geocodeResult={geocodeResult}
            houseDetails={houseDetails}
            country={country}
            city={city}
            onSolarCalculated={setSolarPotential}
            onViewReports={() => setStep("saved")}
            onRestart={handleRestart}
            onBack={() => setStep("house")}
          />
        )}
        {step === "saved" && compareReports.length === 2 && (
          <CompareView
            reports={compareReports}
            onBack={() => { setCompareReports([]); setStep("saved"); }}
          />
        )}
        {step === "saved" && compareReports.length !== 2 && (
          <SavedReportsView
            onBack={() => setStep(analysis ? "results" : "location")}
            onCompare={(reports) => setCompareReports(reports)}
          />
        )}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400">
        Powered by Open-Meteo climate data & Gemini AI
      </footer>
    </div>
  );
}

export default App;
