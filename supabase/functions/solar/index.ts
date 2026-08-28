// EcoBuild-AI Solar Potential Edge Function
// Uses Open-Meteo's solar radiation API (no API key required)
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lat, lon, roofAreaSqm, roofType, currency } = await req.json();

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return new Response(
        JSON.stringify({ error: "A valid latitude and longitude are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let dailyEnergyKWhPerSqm = 5;
    let avgHourlyRadiation = 200;

    try {
      const solarRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=shortwave_radiation_sum&hourly=shortwave_radiation` +
        `&timezone=auto&forecast_days=1`
      );

      if (solarRes.ok) {
        const solarData = await solarRes.json();
        const hourlyRadiation = Array.isArray(solarData.hourly?.shortwave_radiation)
          ? solarData.hourly.shortwave_radiation.filter((reading: unknown): reading is number =>
            typeof reading === "number" && Number.isFinite(reading) && reading >= 0
          )
          : [];
        const dailyRadiation = solarData.daily?.shortwave_radiation_sum?.[0];
        if (typeof dailyRadiation === "number" && Number.isFinite(dailyRadiation)) {
          dailyEnergyKWhPerSqm = dailyRadiation / 3.6;
        } else if (hourlyRadiation.length > 0) {
          dailyEnergyKWhPerSqm = hourlyRadiation.reduce((sum: number, reading: number) => sum + reading, 0) / 1000;
        }
        if (hourlyRadiation.length > 0) {
          avgHourlyRadiation = hourlyRadiation.reduce((sum: number, reading: number) => sum + reading, 0) / hourlyRadiation.length;
        }
      } else {
        console.error("Open-Meteo solar request failed:", solarRes.status);
      }
    } catch (providerError) {
      console.error("Open-Meteo solar request failed:", providerError);
    }

    const peakSunHours = Math.max(3, Math.min(8, dailyEnergyKWhPerSqm / 1.5));

    // Roof area: estimate from plotSize if not provided directly
    // Default to 60% of plot area as usable roof area for solar
    let usableRoofArea = roofAreaSqm;
    if (!usableRoofArea || usableRoofArea <= 0) {
      usableRoofArea = 100; // default 100 sqm
    }

    // Solar panel efficiency factors
    const PANEL_EFFICIENCY = 0.20; // 20% for modern panels
    const SYSTEM_LOSS_FACTOR = 0.86; // inverter, wiring, temperature losses
    const USABLE_ROOF_PERCENTAGE = 0.65; // 65% of roof area usable (obstructions, spacing)

    const panelArea = usableRoofArea * USABLE_ROOF_PERCENTAGE;
    const systemCapacityKW = (panelArea * PANEL_EFFICIENCY) / 5;

    // Daily energy production
    const dailyEnergyKWh = systemCapacityKW * peakSunHours * SYSTEM_LOSS_FACTOR;
    const yearlyEnergyKWh = dailyEnergyKWh * 365;

    // CO2 offset: ~0.5 kg CO2 per kWh (varies by grid, use average)
    const yearlyCO2ReductionKg = yearlyEnergyKWh * 0.5;

    // Cost estimates — simplified, currency-aware
    // Average solar panel cost: ~$1,000 per kW installed (global average, adjusted)
    const SYSTEM_COST_PER_KW_USD = 1000;
    const usdToCurrencyRate: Record<string, number> = {
      USD: 1, PKR: 278, INR: 83, EUR: 0.92, GBP: 0.79,
      AED: 3.67, SAR: 3.75, BDT: 110, NGN: 1500, EGP: 48,
      TRY: 32, AUD: 1.52, CAD: 1.36, CNY: 7.2, JPY: 150,
      ZAR: 18, BRL: 5, MXN: 17, IDR: 15800, MYR: 4.7,
      PHP: 56, THB: 36, VND: 24500, KES: 129, GHS: 15,
      MAD: 10, IQD: 1310, IRR: 42000, AFN: 71, LKR: 300, NPR: 133,
    };
    const rate = usdToCurrencyRate[currency?.code] || 1;
    const currencySymbol = currency?.symbol || "$";

    const totalSystemCost = systemCapacityKW * SYSTEM_COST_PER_KW_USD * rate;
    const costPerKW = SYSTEM_COST_PER_KW_USD * rate;

    // Payback estimate: assume electricity cost ~0.15 USD/kWh average
    const ELECTRICITY_COST_PER_KWH_USD = 0.15;
    const yearlySavingsUSD = yearlyEnergyKWh * ELECTRICITY_COST_PER_KWH_USD;
    const yearlySavingsLocal = yearlySavingsUSD * rate;
    const paybackYears = yearlySavingsLocal > 0 ? totalSystemCost / yearlySavingsLocal : 0;

    // Number of panels (each ~2 sqm)
    const panelCount = Math.floor(panelArea / 2);

    // Roof suitability based on roof type
    const roofSuitability: Record<string, string> = {
      "Flat Concrete": "Excellent — ideal for solar panel mounting with adjustable tilt",
      "Flat + Parapet": "Very Good — parapets may cause minor shading, plan panel placement accordingly",
      "Metal Sheet": "Good — lightweight mounting, consider roof load capacity",
      "Sloped Tile": "Moderate — tile roofs need special mounting brackets, orientation matters",
    };
    const suitability = roofSuitability[roofType] || "Good — solar panels can be installed with standard mounting systems";

    const result = {
      peakSunHours: Math.round(peakSunHours * 10) / 10,
      systemCapacityKW: Math.round(systemCapacityKW * 10) / 10,
      panelCount,
      usableRoofArea: Math.round(panelArea),
      yearlyEnergyKWh: Math.round(yearlyEnergyKWh),
      dailyEnergyKWh: Math.round(dailyEnergyKWh * 10) / 10,
      yearlyCO2ReductionKg: Math.round(yearlyCO2ReductionKg),
      totalSystemCost: Math.round(totalSystemCost),
      costPerKW: Math.round(costPerKW),
      yearlySavings: Math.round(yearlySavingsLocal),
      paybackYears: Math.round(paybackYears * 10) / 10,
      currencySymbol,
      currencyCode: currency?.code || "USD",
      roofSuitability: suitability,
      avgRadiation: Math.round(avgHourlyRadiation),
      treesEquivalent: Math.round(yearlyCO2ReductionKg / 21), // 1 tree absorbs ~21 kg CO2/year
    };

    return new Response(
      JSON.stringify({ solar: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Solar function error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to calculate solar potential. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
