import { useState } from "react";
import { MapPin, Loader2, Search, ArrowRight } from "lucide-react";

const COUNTRIES = [
  "Pakistan", "India", "Bangladesh", "United Arab Emirates", "Saudi Arabia",
  "Nigeria", "Egypt", "Turkey", "United States", "United Kingdom",
  "Germany", "France", "Australia", "Canada", "Malaysia", "Indonesia",
  "South Africa", "Brazil", "Mexico", "Kenya", "Morocco", "Iraq",
  "Sri Lanka", "Nepal", "Afghanistan", "Iran",
];

interface LocationStepProps {
  onSubmit: (country: string, city: string) => void;
  loading: boolean;
  error: string | null;
}

export function LocationStep({ onSubmit, loading, error }: LocationStepProps) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(country.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !city.trim()) return;
    onSubmit(country.trim(), city.trim());
  };

  return (
    <div className="animate-fade-in-up max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
          <MapPin className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Where is your building?</h2>
        <p className="text-slate-500">
          We'll look up real-time climate data for your location to tailor our recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setShowCountryList(true);
            }}
            onFocus={() => setShowCountryList(true)}
            onBlur={() => setTimeout(() => setShowCountryList(false), 200)}
            placeholder="Start typing your country..."
            className="input-field"
            autoComplete="off"
          />
          {showCountryList && filteredCountries.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {filteredCountries.slice(0, 6).map((c) => (
                <li
                  key={c}
                  onMouseDown={() => {
                    setCountry(c);
                    setShowCountryList(false);
                  }}
                  className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCityQuery(e.target.value);
            }}
            placeholder="e.g. Sialkot, Lahore, Dubai..."
            className="input-field"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !country.trim() || !city.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Looking up climate data...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Get Climate Data
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
