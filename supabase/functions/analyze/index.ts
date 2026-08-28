// EcoBuild-AI Analysis Edge Function — Gemini-powered building recommendations
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    buildingAssessment: {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING" },
        risks: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["summary", "risks"],
    },
    recommendedActions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          priority: { type: "STRING", enum: ["High", "Medium", "Low"] },
          category: { type: "STRING" },
          recommendation: { type: "STRING" },
          reason: { type: "STRING" },
          expectedBenefit: { type: "STRING" },
        },
        required: ["priority", "category", "recommendation", "reason", "expectedBenefit"],
      },
    },
    recommendedMaterials: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          material: { type: "STRING" },
          category: { type: "STRING" },
          why: { type: "STRING" },
          estimatedQuantity: { type: "STRING" },
          estimatedCostRange: { type: "STRING" },
          searchQuery: { type: "STRING" },
        },
        required: ["material", "category", "why", "estimatedQuantity", "estimatedCostRange", "searchQuery"],
      },
    },
    energyEfficiency: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tip: { type: "STRING" },
          benefit: { type: "STRING" },
        },
        required: ["tip", "benefit"],
      },
    },
    coolingStrategy: { type: "STRING" },
    overallSummary: { type: "STRING" },
  },
  required: [
    "buildingAssessment",
    "recommendedActions",
    "recommendedMaterials",
    "energyEfficiency",
    "coolingStrategy",
    "overallSummary",
  ],
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { location, weather, houseDetails, currency } = body;

    if (!location || !weather || !houseDetails) {
      return new Response(
        JSON.stringify({ error: "Missing required analysis data." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read Gemini API key from the database (app_secrets table)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Service configuration error. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: secretData, error: secretError } = await supabase
      .from("app_secrets")
      .select("key_value")
      .eq("key_name", "GEMINI_API_KEY")
      .maybeSingle();

    const geminiKey = secretData?.key_value;
    if (!geminiKey || secretError) {
      console.error("Failed to read Gemini key from DB:", secretError);
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tempStr = `${weather.currentTemp}°C (feels like ${weather.feelsLike}°C)`;
    const rangeStr = `Daily range: ${weather.minTemp}°C – ${weather.maxTemp}°C`;
    const humidityStr = `Humidity: ${weather.humidity}%`;
    const windStr = `Wind: ${weather.windSpeed} km/h`;
    const uvStr = weather.uvIndex ? `UV Index: ${weather.uvIndex}` : "";
    const precipStr = weather.precipitation != null ? `Precipitation: ${weather.precipitation} mm` : "";

    const houseStr = Object.entries(houseDetails)
      .filter(([, v]) => v && v !== "")
      .map(([k, v]) => `- ${k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}: ${v}`)
      .join("\n");

    const currencyStr = `${currency.code} (${currency.symbol})`;

    const prompt = `You are EcoBuild-AI, a climate-smart building assistant. Analyze the following real data and provide personalized building recommendations.

LOCATION:
- Place: ${location.displayName}
- Coordinates: ${location.lat}, ${location.lon}

REAL CLIMATE DATA (from Open-Meteo weather API):
- Current temperature: ${tempStr}
- ${rangeStr}
- ${humidityStr}
- ${windStr}
- ${uvStr}
- ${precipStr}
- Climate condition: ${weather.condition}

HOUSE DETAILS:
${houseStr}

BUDGET: ${houseDetails.budget || "Not specified"}
LOCAL CURRENCY: ${currencyStr}

INSTRUCTIONS:
1. Analyze the building based on its real climate context and the user's house details.
2. Identify the main risks/problems for this specific building in this specific climate.
3. Recommend actions prioritized by urgency (High/Medium/Low). Every recommendation must explain WHY it is suitable for this specific location and building.
4. Recommend specific materials with:
   - Why each material is suitable for THIS climate (temperature, humidity, solar radiation)
   - Estimated quantity (based on house size if applicable)
   - Estimated cost range in ${currencyStr} — label as estimates, never claim exact prices
   - A searchQuery: the exact Google search term to find local vendors (format: "material name suppliers near ${location.displayName}")
5. Provide energy efficiency tips specific to this climate.
6. Provide a cooling strategy tailored to the actual temperature and humidity.
7. Write an overall summary (2-3 sentences).

Be specific and practical. Do NOT give generic advice. Every recommendation must reference the actual location, temperature, or building details.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: ANALYSIS_SCHEMA,
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "The AI analysis service encountered an error. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "The AI could not generate recommendations. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "The AI response was malformed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze function error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong during analysis. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
