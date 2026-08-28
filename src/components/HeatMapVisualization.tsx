import { useState } from "react";
import { Flame, Info, Wind, Sun, Eye } from "lucide-react";
import type { GeocodeResult, HouseDetails } from "@/types";

interface HeatMapProps {
  geocodeResult: GeocodeResult;
  houseDetails: HouseDetails;
}

interface HeatZone {
  id: string;
  label: string;
  heatScore: number; // 0-100
  reason: string;
  color: string;
}

function calculateHeatZones(
  weather: GeocodeResult["weather"],
  house: HouseDetails
): HeatZone[] {
  const temp = weather.currentTemp;
  const uv = weather.uvIndex || 5;
  const humidity = weather.humidity;

  // Roof heat score
  let roofScore = 40;
  if (house.roofColor === "Dark") roofScore += 35;
  else if (house.roofColor === "Red/Brown") roofScore += 20;
  else if (house.roofColor === "Light") roofScore += 5;
  else if (house.roofColor === "White") roofScore -= 10;
  if (house.roofType === "Flat Concrete" || house.roofType === "Flat + Parapet") roofScore += 10;
  roofScore += Math.min(25, (temp - 20) * 0.8);
  roofScore = Math.max(10, Math.min(100, roofScore));

  // Walls heat score
  let wallScore = 30;
  if (house.wallColor === "Dark") wallScore += 25;
  else if (house.wallColor === "Light") wallScore += 3;
  else if (house.wallColor === "White") wallScore -= 5;
  if (house.wallMaterial === "Brick") wallScore += 10;
  else if (house.wallMaterial === "Stone") wallScore += 5;
  wallScore += Math.min(20, (temp - 20) * 0.6);
  wallScore = Math.max(10, Math.min(100, wallScore));

  // Windows heat score
  let windowScore = 35;
  if (house.windows === "Single Glazed") windowScore += 25;
  else if (house.windows === "Double Glazed") windowScore -= 15;
  else if (house.windows === "Wooden") windowScore += 10;
  windowScore += Math.min(20, uv * 2);
  windowScore = Math.max(5, Math.min(100, windowScore));

  // Ventilation score (inverse — poor ventilation = high heat retention)
  let ventScore = 40;
  if (house.ventilation === "None") ventScore += 40;
  else if (house.ventilation === "Natural") ventScore += 10;
  else if (house.ventilation === "Mechanical") ventScore -= 10;
  else if (house.ventilation === "Mixed") ventScore -= 5;
  ventScore += Math.min(20, (humidity - 40) * 0.5);
  ventScore = Math.max(10, Math.min(100, ventScore));

  const colorFor = (score: number) => {
    if (score >= 75) return "#dc2626"; // red-600
    if (score >= 55) return "#ea580c"; // orange-600
    if (score >= 40) return "#f59e0b"; // amber-500
    if (score >= 25) return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };

  return [
    {
      id: "roof",
      label: "Roof",
      heatScore: Math.round(roofScore),
      reason: house.roofColor === "Dark"
        ? `Dark ${house.roofType.toLowerCase()} roof absorbs maximum solar radiation at ${Math.round(temp)}°C`
        : `${house.roofColor || "Unspecified"} ${house.roofType.toLowerCase()} roof exposed to direct sun`,
      color: colorFor(roofScore),
    },
    {
      id: "walls",
      label: "Walls",
      heatScore: Math.round(wallScore),
      reason: `${house.wallMaterial || "Unknown"} walls with ${house.wallColor?.toLowerCase() || "unspecified"} finish — ${house.wallMaterial === "Brick" ? "brick retains heat well" : "moderate heat absorption"}`,
      color: colorFor(wallScore),
    },
    {
      id: "windows",
      label: "Windows",
      heatScore: Math.round(windowScore),
      reason: house.windows === "Single Glazed"
        ? `Single-glazed windows offer poor insulation; UV index ${uv} increases heat gain`
        : `${house.windows} windows with UV index ${uv}`,
      color: colorFor(windowScore),
    },
    {
      id: "ventilation",
      label: "Ventilation",
      heatScore: Math.round(ventScore),
      reason: house.ventilation === "None"
        ? "No ventilation system — heat and humidity (trapped indoors)"
        : `${house.ventilation} ventilation at ${humidity}% humidity`,
      color: colorFor(ventScore),
    },
  ];
}

export function HeatMapVisualization({ geocodeResult, houseDetails }: HeatMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const zones = calculateHeatZones(geocodeResult.weather, houseDetails);
  const w = geocodeResult.weather;

  if (!expanded) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Interactive Heat Map</h3>
            <p className="text-sm text-slate-500">See which parts of your building absorb the most heat</p>
          </div>
        </div>
        <button onClick={() => setExpanded(true)} className="btn-secondary w-full mt-2 flex items-center justify-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> View Heat Map
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Interactive Heat Map</h3>
          <p className="text-sm text-slate-500">
            Heat absorption analysis at {Math.round(w.currentTemp)}°C · UV {w.uvIndex ?? "—"} · {w.humidity}% humidity
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Building diagram */}
        <div className="relative">
          <svg viewBox="0 0 300 240" className="w-full h-auto">
            {/* Sky/background */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="300" height="240" fill="url(#skyGrad)" rx="12" />

            {/* Sun */}
            <circle cx="250" cy="35" r="16" fill="#fbbf24" opacity="0.8">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            <g stroke="#fbbf24" strokeWidth="2" opacity="0.5">
              <line x1="250" y1="10" x2="250" y2="18" />
              <line x1="274" y1="35" x2="282" y2="35" />
              <line x1="232" y1="17" x2="238" y2="23" />
              <line x1="268" y1="23" x2="274" y2="17" />
            </g>

            {/* Roof */}
            <polygon
              points="40,90 150,40 260,90 260,100 150,50 40,100"
              fill={zones[0].color}
              opacity={hoveredZone === "roof" ? 1 : 0.85}
              onMouseEnter={() => setHoveredZone("roof")}
              onMouseLeave={() => setHoveredZone(null)}
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
            />
            {/* Roof label */}
            <text x="150" y="78" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" style={{ pointerEvents: "none" }}>
              Roof {zones[0].heatScore}°
            </text>

            {/* Walls (building body) */}
            <rect
              x="55" y="90" width="190" height="110"
              fill={zones[1].color}
              opacity={hoveredZone === "walls" ? 1 : 0.75}
              onMouseEnter={() => setHoveredZone("walls")}
              onMouseLeave={() => setHoveredZone(null)}
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              rx="2"
            />
            <text x="150" y="150" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" style={{ pointerEvents: "none" }}>
              Walls {zones[1].heatScore}°
            </text>

            {/* Windows */}
            <rect
              x="75" y="110" width="40" height="50"
              fill={zones[2].color}
              opacity={hoveredZone === "windows" ? 1 : 0.8}
              onMouseEnter={() => setHoveredZone("windows")}
              onMouseLeave={() => setHoveredZone(null)}
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              rx="2"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
            <line x1="95" y1="110" x2="95" y2="160" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="75" y1="135" x2="115" y2="135" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

            <rect
              x="185" y="110" width="40" height="50"
              fill={zones[2].color}
              opacity={hoveredZone === "windows" ? 1 : 0.8}
              onMouseEnter={() => setHoveredZone("windows")}
              onMouseLeave={() => setHoveredZone(null)}
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              rx="2"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
            <line x1="205" y1="110" x2="205" y2="160" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <line x1="185" y1="135" x2="225" y2="135" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

            {/* Ventilation indicator (arrows on top of walls) */}
            <g
              onMouseEnter={() => setHoveredZone("ventilation")}
              onMouseLeave={() => setHoveredZone(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx="150" cy="105" r="14" fill={zones[3].color} opacity={hoveredZone === "ventilation" ? 1 : 0.7} />
              <text x="150" y="109" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ pointerEvents: "none" }}>
                Vent
              </text>
            </g>

            {/* Ground */}
            <rect x="0" y="200" width="300" height="40" fill="#e2e8f0" rx="0 0 12 12" />
            <line x1="0" y1="200" x2="300" y2="200" stroke="#cbd5e1" strokeWidth="1" />
          </svg>

          {/* Color legend */}
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600" /> Critical</span>
          </div>
        </div>

        {/* Zone details */}
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                hoveredZone === zone.id ? "border-slate-300 shadow-md" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: zone.color }} />
                  <span className="text-sm font-semibold text-slate-800">{zone.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: zone.color }}>
                  {zone.heatScore}°
                </span>
              </div>
              {/* Heat bar */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${zone.heatScore}%`, backgroundColor: zone.color }}
                />
              </div>
              <p className="text-xs text-slate-500">{zone.reason}</p>
            </div>
          ))}

          <div className="rounded-xl bg-slate-50 p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              Heat scores are calculated from your building's materials, colors, and real climate data.
              Hover or tap each zone to see why it scores high.
            </p>
          </div>
        </div>
      </div>

      {/* Climate context icons */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Sun className="w-4 h-4 text-amber-500" /> UV {w.uvIndex ?? "—"}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Flame className="w-4 h-4 text-orange-500" /> {Math.round(w.currentTemp)}°C
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Wind className="w-4 h-4 text-teal-500" /> {w.windSpeed} km/h
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Eye className="w-4 h-4 text-blue-500" /> {w.humidity}% humidity
        </span>
      </div>
    </div>
  );
}
