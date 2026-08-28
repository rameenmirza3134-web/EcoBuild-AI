import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Classify climate condition from temperature
function classifyClimate(temp: number): string {
  if (temp >= 38) return "Extreme heat — high risk of heat stress and rapid building material degradation";
  if (temp >= 32) return "Very hot — significant cooling and heat management required";
  if (temp >= 27) return "Hot — moderate to high cooling demand";
  if (temp >= 20) return "Warm — moderate temperature management needed";
  if (temp >= 10) return "Mild — focus on insulation and comfort";
  if (temp >= 0) return "Cool — heating and insulation priorities";
  return "Cold — heating and weatherization essential";
}

const CURRENCY_MAP: Record<string, { code: string; symbol: string; name: string }> = {
  "Pakistan": { code: "PKR", symbol: "Rs", name: "Pakistani Rupee" },
  "India": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "United States": { code: "USD", symbol: "$", name: "US Dollar" },
  "United States of America": { code: "USD", symbol: "$", name: "US Dollar" },
  "United Kingdom": { code: "GBP", symbol: "£", name: "British Pound" },
  "United Arab Emirates": { code: "AED", symbol: "AED", name: "UAE Dirham" },
  "Saudi Arabia": { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  "Bangladesh": { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  "Nigeria": { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  "Egypt": { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  "Turkey": { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  "Türkiye": { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  "Germany": { code: "EUR", symbol: "€", name: "Euro" },
  "France": { code: "EUR", symbol: "€", name: "Euro" },
  "Spain": { code: "EUR", symbol: "€", name: "Euro" },
  "Italy": { code: "EUR", symbol: "€", name: "Euro" },
  "Netherlands": { code: "EUR", symbol: "€", name: "Euro" },
  "Australia": { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  "Canada": { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  "China": { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  "Japan": { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  "South Africa": { code: "ZAR", symbol: "R", name: "South African Rand" },
  "Brazil": { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  "Mexico": { code: "MXN", symbol: "$", name: "Mexican Peso" },
  "Indonesia": { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  "Malaysia": { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  "Philippines": { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  "Thailand": { code: "THB", symbol: "฿", name: "Thai Baht" },
  "Vietnam": { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  "Kenya": { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  "Ghana": { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  "Morocco": { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  "Iraq": { code: "IQD", symbol: "IQD", name: "Iraqi Dinar" },
  "Iran": { code: "IRR", symbol: "IRR", name: "Iranian Rial" },
  "Afghanistan": { code: "AFN", symbol: "Af", name: "Afghan Afghani" },
  "Sri Lanka": { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  "Nepal": { code: "NPR", symbol: "Rs", name: "Nepalese Rupee" },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { country, city } = await req.json();
    if (!country || !city) {
      return new Response(
        JSON.stringify({ error: "Country and city are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Geocode via Nominatim/OpenStreetMap
    const query = encodeURIComponent(`${city}, ${country}`);
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "EcoBuild-AI/1.0" } }
    );
    if (!geoRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to geocode location. Please check the city and country." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return new Response(
        JSON.stringify({ error: `Could not find "${city}, ${country}" on the map. Please try a nearby major city.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    const displayName = geoData[0].display_name;

    // 2. Get real current temperature via Open-Meteo (no API key required)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum` +
      `&timezone=auto&forecast_days=1`
    );
    if (!weatherRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve temperature data for this location." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const weatherData = await weatherRes.json();

    const currentTemp = weatherData.current?.temperature_2m ?? 25;
    const currency = CURRENCY_MAP[country?.trim()] || { code: "USD", symbol: "$", name: "US Dollar" };

    return new Response(
      JSON.stringify({
        lat,
        lon,
        displayName,
        currency,
        weather: {
          currentTemp,
          feelsLike: weatherData.current?.apparent_temperature,
          humidity: weatherData.current?.relative_humidity_2m,
          windSpeed: weatherData.current?.wind_speed_10m,
          weatherCode: weatherData.current?.weather_code,
          maxTemp: weatherData.daily?.temperature_2m_max?.[0],
          minTemp: weatherData.daily?.temperature_2m_min?.[0],
          uvIndex: weatherData.daily?.uv_index_max?.[0],
          precipitation: weatherData.daily?.precipitation_sum?.[0],
          timezone: weatherData.timezone,
          condition: classifyClimate(currentTemp),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Geocode function error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong while looking up your location. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
