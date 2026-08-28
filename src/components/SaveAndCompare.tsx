import { useState, useEffect } from "react";
import {
  Save, FolderOpen, Trash2, X, ArrowLeft, ArrowRight, Loader2,
  MapPin, Calendar, Thermometer, CheckCircle2,
} from "lucide-react";
import type { SavedReport, GeocodeResult, HouseDetails, AnalysisResult, SolarPotential } from "@/types";
import { saveReport, fetchReports, deleteReport } from "@/api";

interface SaveAndCompareProps {
  geocodeResult: GeocodeResult;
  houseDetails: HouseDetails;
  analysis: AnalysisResult;
  solarPotential: SolarPotential | null;
  country: string;
  city: string;
  onViewReports: () => void;
}

export function SaveAndCompare({
  geocodeResult, houseDetails, analysis, solarPotential, country, city, onViewReports,
}: SaveAndCompareProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportName, setReportName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const name = reportName.trim() || `${city} - ${new Date().toLocaleDateString()}`;
      await saveReport({
        reportName: name,
        locationName: geocodeResult.displayName,
        country,
        city,
        lat: geocodeResult.lat,
        lon: geocodeResult.lon,
        weather: geocodeResult.weather,
        currency: geocodeResult.currency,
        houseDetails,
        analysis,
        solarPotential,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Save className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Save & Compare</h3>
          <p className="text-sm text-slate-500">Save this report or compare with others</p>
        </div>
      </div>

      {saved ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Report saved successfully!</p>
              <p className="text-xs text-emerald-600">You can compare it with other reports anytime.</p>
            </div>
          </div>
          <button onClick={onViewReports} className="btn-secondary w-full flex items-center justify-center gap-2">
            <FolderOpen className="w-5 h-5" /> View All Saved Reports
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder={`Report name (default: ${city} - ${new Date().toLocaleDateString()})`}
            className="input-field"
          />
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Report
            </button>
            <button onClick={onViewReports} className="btn-secondary flex items-center gap-2">
              <FolderOpen className="w-5 h-5" /> View Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Saved Reports List View
// ============================================================

interface SavedReportsViewProps {
  onBack: () => void;
  onCompare: (reports: SavedReport[]) => void;
}

export function SavedReportsView({ onBack, onCompare }: SavedReportsViewProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setReports(reports.filter((r) => r.id !== id));
      setSelected(selected.filter((s) => s !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report.");
    }
  };

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  const selectedReports = reports.filter((r) => selected.includes(r.id));

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
          <FolderOpen className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Saved Reports</h2>
        <p className="text-slate-500">Select two reports to compare them side-by-side</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No saved reports yet.</p>
          <p className="text-sm text-slate-400 mt-1">Run an analysis and save it to see it here.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <>
          <div className="space-y-3 mb-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`card p-5 cursor-pointer transition-all ${
                  selected.includes(report.id) ? "ring-2 ring-indigo-500 border-indigo-300" : "hover:shadow-md"
                }`}
                onClick={() => toggleSelect(report.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        selected.includes(report.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-300"
                      }`}>
                        {selected.includes(report.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <h3 className="font-semibold text-slate-800">{report.report_name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {report.location_name.split(",")[0]}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(report.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {Math.round(report.weather.currentTemp)}°C</span>
                      {report.solar_potential && (
                        <span className="flex items-center gap-1 text-amber-600">
                          Solar: {report.solar_potential.yearlyEnergyKWh.toLocaleString()} kWh/yr
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <button
              onClick={() => onCompare(selectedReports)}
              disabled={selected.length !== 2}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Compare {selected.length}/2 Reports
              {selected.length === 2 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Compare View
// ============================================================

interface CompareViewProps {
  reports: SavedReport[];
  onBack: () => void;
}

function CompareCard({ report, accent }: { report: SavedReport; accent: string }) {
  const a = report.analysis;
  const s = report.solar_potential;

  return (
    <div className={`card p-5 border-2 ${accent}`}>
      <h3 className="font-bold text-slate-800 mb-1">{report.report_name}</h3>
      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5" /> {report.location_name.split(",")[0]}
      </p>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1">Climate</p>
          <p className="text-slate-700">{Math.round(report.weather.currentTemp)}°C · {report.weather.humidity}% humidity</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1">Building</p>
          <p className="text-slate-700">{report.house_details.buildingType} · {report.house_details.roofType}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1">Risks</p>
          <ul className="space-y-1">
            {a.buildingAssessment.risks.slice(0, 3).map((risk, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span> {risk}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1">Top Actions</p>
          <ul className="space-y-1">
            {a.recommendedActions.slice(0, 3).map((action, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className={`mt-0.5 font-bold ${
                  action.priority === "High" ? "text-red-500" : action.priority === "Medium" ? "text-amber-500" : "text-sky-500"
                }`}>●</span>
                {action.recommendation}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase mb-1">Materials</p>
          <p className="text-slate-700">{a.recommendedMaterials.length} recommended</p>
        </div>

        {s && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs font-medium text-amber-600 uppercase mb-1">Solar Potential</p>
            <p className="text-sm font-bold text-amber-700">{s.yearlyEnergyKWh.toLocaleString()} kWh/yr</p>
            <p className="text-xs text-amber-600">Payback: {s.paybackYears} years</p>
          </div>
        )}

        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
          <p className="text-xs font-medium text-emerald-600 uppercase mb-1">Summary</p>
          <p className="text-xs text-emerald-700 leading-relaxed">{a.overallSummary}</p>
        </div>
      </div>
    </div>
  );
}

export function CompareView({ reports, onBack }: CompareViewProps) {
  const [r1, r2] = reports;

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Comparison</h2>
        <p className="text-slate-500">Side-by-side analysis of two buildings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <CompareCard report={r1} accent="border-indigo-200" />
        <CompareCard report={r2} accent="border-emerald-200" />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Reports
        </button>
      </div>
    </div>
  );
}
