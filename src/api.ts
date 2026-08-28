import { createClient } from "@supabase/supabase-js";
import type { GeocodeResult, AnalysisResult, HouseDetails, SolarPotential, SavedReport } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function geocodeLocation(country: string, city: string): Promise<GeocodeResult> {
  const { data, error } = await supabase.functions.invoke("geocode", {
    body: { country, city },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as GeocodeResult;
}

export async function analyzeBuilding(
  location: { lat: number; lon: number; displayName: string },
  weather: GeocodeResult["weather"],
  houseDetails: HouseDetails,
  currency: { code: string; symbol: string; name: string }
): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze", {
    body: { location, weather, houseDetails, currency },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.analysis as AnalysisResult;
}

export async function calculateSolarPotential(
  lat: number,
  lon: number,
  roofAreaSqm: number,
  roofType: string,
  currency: { code: string; symbol: string }
): Promise<SolarPotential> {
  const { data, error } = await supabase.functions.invoke("solar", {
    body: { lat, lon, roofAreaSqm, roofType, currency },
  });

  if (!error && data?.solar) return data.solar as SolarPotential;

  const usableRoofArea = Math.max(20, roofAreaSqm) * 0.65;
  const peakSunHours = Math.max(3, Math.min(7, 5.5 - Math.abs(lat) * 0.018));
  const systemCapacityKW = usableRoofArea / 5;
  const dailyEnergyKWh = systemCapacityKW * peakSunHours * 0.86;
  const yearlyEnergyKWh = Math.round(dailyEnergyKWh * 365);
  const yearlyCO2ReductionKg = Math.round(yearlyEnergyKWh * 0.5);
  const totalSystemCost = Math.round(systemCapacityKW * 1000);
  const yearlySavings = Math.round(yearlyEnergyKWh * 0.15);

  return {
    peakSunHours: Math.round(peakSunHours * 10) / 10,
    systemCapacityKW: Math.round(systemCapacityKW * 10) / 10,
    panelCount: Math.floor(usableRoofArea / 2),
    usableRoofArea: Math.round(usableRoofArea),
    yearlyEnergyKWh,
    dailyEnergyKWh: Math.round(dailyEnergyKWh * 10) / 10,
    yearlyCO2ReductionKg,
    totalSystemCost,
    costPerKW: 1000,
    yearlySavings,
    paybackYears: yearlySavings > 0 ? Math.round((totalSystemCost / yearlySavings) * 10) / 10 : 0,
    currencySymbol: currency.symbol,
    currencyCode: currency.code,
    roofSuitability: roofType === "Flat Concrete"
      ? "Excellent — ideal for solar panel mounting with adjustable tilt"
      : "Good — solar panels can be installed with standard mounting systems",
    avgRadiation: Math.round(peakSunHours * 125),
    treesEquivalent: Math.round(yearlyCO2ReductionKg / 21),
  };
}

export async function saveReport(report: {
  reportName: string;
  locationName: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
  weather: GeocodeResult["weather"];
  currency: GeocodeResult["currency"];
  houseDetails: HouseDetails;
  analysis: AnalysisResult;
  solarPotential: SolarPotential | null;
}): Promise<SavedReport> {
  const { data, error } = await supabase
    .from("saved_reports")
    .insert({
      report_name: report.reportName,
      location_name: report.locationName,
      country: report.country,
      city: report.city,
      lat: report.lat,
      lon: report.lon,
      weather: report.weather,
      currency: report.currency,
      house_details: report.houseDetails,
      analysis: report.analysis,
      solar_potential: report.solarPotential,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SavedReport;
}

export async function fetchReports(): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from("saved_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SavedReport[];
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("saved_reports").delete().eq("id", id);
  if (error) throw error;
}
