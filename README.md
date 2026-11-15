# EcoBuild AI

EcoBuild AI is a climate-smart building advisor that turns a location and basic building details into practical recommendations for more resilient, comfortable, and energy-efficient construction.

The application combines real-time location and weather data with Gemini-generated analysis. Users can review climate risks, prioritized building actions, recommended materials, energy-efficiency guidance, cooling strategies, and an optional solar potential estimate. Analyses can be saved and compared side by side.

## Features

- **Location-aware analysis**  
  Geocodes a city and country using OpenStreetMap Nominatim and retrieves current climate data from Open-Meteo.
- **Climate classification**  
  Categorizes local conditions from cold through extreme heat and presents relevant temperature, humidity, wind, UV, and precipitation data.
- **AI building assessment**  
  Uses Gemini through a protected Supabase Edge Function to generate:
  - Building risks and climate-specific concerns
  - High-, medium-, and low-priority recommended actions
  - Recommended materials, quantities, estimated costs, and supplier search terms
  - Energy-efficiency tips
  - A tailored cooling strategy
- **Solar potential calculator**  
  Estimates panel capacity, annual energy generation, CO₂ reduction, system cost, yearly savings, payback period, and roof suitability using Open-Meteo solar radiation data.
- **Interactive climate visualization**  
  Displays a building-oriented heat map based on the selected location and building inputs.
- **Save and compare reports**  
  Stores complete analysis snapshots in Supabase and allows users to compare two saved reports.
- **Responsive interface**  
  Built with React, Tailwind CSS, and Lucide icons for desktop and mobile layouts.

## Product workflow

1. Enter a **country** and **city**.
2. Review the resolved location and current climate conditions.
3. Enter building information such as plot size, floors, building type, roof, walls, windows, ventilation, cooling system, and budget.
4. Run the climate-aware AI analysis.
5. Review the assessment, recommended actions, materials, energy guidance, cooling strategy, heat map, and optional solar calculation.
6. Save the report or compare it with another saved analysis.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, PostCSS |
| UI icons | Lucide React |
| Client data access | Supabase JavaScript client |
| Backend | Supabase Edge Functions running on Deno |
| AI provider | Google Gemini |
| Geocoding | OpenStreetMap Nominatim |
| Weather and solar data | Open-Meteo |
| Persistence | Supabase PostgreSQL with JSONB report snapshots |

## Repository structure

```text
.
├── src/
│   ├── App.tsx                    # Main multi-step application flow
│   ├── api.ts                     # Supabase client and application API calls
│   ├── types.ts                   # Shared domain types
│   ├── components/
│   │   ├── LocationStep.tsx       # Location input
│   │   ├── ClimateStep.tsx        # Climate summary
│   │   ├── HouseStep.tsx          # Building details form
│   │   ├── AnalyzingStep.tsx      # Analysis loading state
│   │   ├── ResultsStep.tsx        # Analysis results
│   │   ├── SolarCalculator.tsx    # Solar estimates
│   │   ├── HeatMapVisualization.tsx
│   │   └── SaveAndCompare.tsx     # Save, list, delete, and compare reports
│   └── index.css
├── supabase/
│   ├── functions/
│   │   ├── geocode/               # Nominatim + Open-Meteo integration
│   │   ├── analyze/               # Gemini analysis orchestration
│   │   └── solar/                 # Open-Meteo solar calculations
│   ├── migrations/                # Database schema and RLS policies
│   └── config.toml                # Edge Function configuration
├── index.html
├── package.json
└── vite.config.ts
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- A Google Gemini API key
- Supabase CLI, if deploying migrations and Edge Functions from the command line

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure frontend environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Only the public Supabase URL and anonymous key belong in the Vite environment. Never expose a Supabase service-role key or Gemini API key in frontend code.

### 3. Apply the database migrations

Link the local project to Supabase and push the migrations:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

The migrations create:

- `app_secrets`, which is readable only by the Supabase service role
- `saved_reports`, which stores weather, currency, building, AI, and solar snapshots as JSONB

### 4. Configure the Gemini key

The `analyze` Edge Function reads `GEMINI_API_KEY` from `app_secrets` using the service-role client. Insert the key through a trusted administrative channel, such as the Supabase SQL Editor:

```sql
insert into public.app_secrets (key_name, key_value)
values ('GEMINI_API_KEY', '<your-gemini-api-key>')
on conflict (key_name)
do update set key_value = excluded.key_value;
```

Do not commit the key or place it in `.env.local`.

### 5. Deploy the Edge Functions

```bash
supabase functions deploy geocode
supabase functions deploy analyze
supabase functions deploy solar
```

The project config disables JWT verification for these functions because the frontend invokes them directly through the Supabase client. The functions still validate request payloads and use the service role only where server-side secret access is required.

### 6. Start the frontend

```bash
npm run dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

For a production-style local check:

```bash
npm run lint
npm run typecheck
npm run build
```

## Backend request flow

### Geocoding and climate data

`geocode`:

1. Receives `{ country, city }`.
2. Resolves coordinates and a display name through Nominatim.
3. Requests current and daily forecast data from Open-Meteo.
4. Maps the country to a supported currency, defaulting to USD when no mapping exists.
5. Returns coordinates, weather data, currency information, and a climate classification.

### AI analysis

`analyze`:

1. Validates the location, weather, and building payload.
2. Reads `GEMINI_API_KEY` from `app_secrets`.
3. Builds a location- and climate-specific prompt from the weather and building details.
4. Requests structured JSON from Gemini using a response schema.
5. Returns the parsed analysis to the frontend.

### Solar calculation

`solar`:

1. Validates latitude and longitude.
2. Requests shortwave radiation data from Open-Meteo.
3. Estimates usable roof area, panel capacity, energy production, CO₂ reduction, costs, savings, and payback.
4. Returns estimates in the detected local currency.

If the solar Edge Function cannot provide a result, the frontend contains a simplified fallback calculation so the solar section can still produce an estimate.

## Data and privacy considerations

- The application currently has **no user authentication**.
- Saved reports are intentionally shared through public Supabase CRUD policies for the current demo implementation.
- Reports contain location, weather, building details, AI recommendations, and optional solar data.
- Do not use the current shared-report configuration for sensitive or private projects without adding authentication, ownership columns, and user-scoped Row Level Security policies.
- API keys must remain server-side. The Gemini key is stored in `app_secrets` and is never read by the browser.

## Accuracy and limitations

- Weather, geocoding, and solar results depend on third-party provider availability and returned data quality.
- Material prices, solar costs, savings, and payback periods are estimates, not quotes.
- Currency support is based on a static country-to-currency map in the geocoding function; unsupported countries fall back to USD.
- Solar output uses roof-area assumptions, panel efficiency, system losses, and average electricity-cost assumptions.
- AI recommendations are decision-support content and should be reviewed by qualified architects, engineers, contractors, and local building authorities before construction.
- Nominatim usage should follow the OpenStreetMap Foundation usage policy, including responsible request rates and identification.

## Deployment

Build the frontend with:

```bash
npm run build
```

Deploy the generated `dist/` directory to a static hosting provider such as Vercel, Netlify, Cloudflare Pages, or an equivalent service. Configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in the hosting provider, then deploy the Supabase migrations and Edge Functions separately.

## Contributing

1. Create a feature branch.
2. Make focused changes that preserve the existing user flow.
3. Run linting, type checking, and the production build.
4. Open a pull request describing the user-facing and backend changes.

## License

No license file is currently included in this repository. Add an explicit license before distributing or accepting external contributions.
