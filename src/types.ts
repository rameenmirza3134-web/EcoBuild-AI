export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface WeatherData {
  currentTemp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  uvIndex: number;
  precipitation: number;
  timezone: string;
  condition: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  currency: Currency;
  weather: WeatherData;
}

export interface HouseDetails {
  plotSize: string;
  floors: string;
  status: string;
  buildingType: string;
  roofType: string;
  wallMaterial: string;
  roofColor: string;
  wallColor: string;
  windows: string;
  ventilation: string;
  coolingSystem: string;
  budget: string;
}

export interface RecommendedAction {
  priority: "High" | "Medium" | "Low";
  category: string;
  recommendation: string;
  reason: string;
  expectedBenefit: string;
}

export interface RecommendedMaterial {
  material: string;
  category: string;
  why: string;
  estimatedQuantity: string;
  estimatedCostRange: string;
  searchQuery: string;
}

export interface EnergyTip {
  tip: string;
  benefit: string;
}

export interface AnalysisResult {
  buildingAssessment: {
    summary: string;
    risks: string[];
  };
  recommendedActions: RecommendedAction[];
  recommendedMaterials: RecommendedMaterial[];
  energyEfficiency: EnergyTip[];
  coolingStrategy: string;
  overallSummary: string;
}

export interface SolarPotential {
  peakSunHours: number;
  systemCapacityKW: number;
  panelCount: number;
  usableRoofArea: number;
  yearlyEnergyKWh: number;
  dailyEnergyKWh: number;
  yearlyCO2ReductionKg: number;
  totalSystemCost: number;
  costPerKW: number;
  yearlySavings: number;
  paybackYears: number;
  currencySymbol: string;
  currencyCode: string;
  roofSuitability: string;
  avgRadiation: number;
  treesEquivalent: number;
}

export interface SavedReport {
  id: string;
  report_name: string;
  location_name: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
  weather: WeatherData;
  currency: Currency;
  house_details: HouseDetails;
  analysis: AnalysisResult;
  solar_potential: SolarPotential | null;
  created_at: string;
}

export type Step = "location" | "climate" | "house" | "analyzing" | "results" | "saved";
