/*
# Create saved_reports table for EcoBuild AI

1. New Tables
- `saved_reports`
  - `id` (uuid, primary key)
  - `report_name` (text, user-provided label for the report)
  - `location_name` (text, the display name from geocoding)
  - `country` (text)
  - `city` (text)
  - `lat` (double precision)
  - `lon` (double precision)
  - `weather` (jsonb, full weather data snapshot)
  - `currency` (jsonb, currency info)
  - `house_details` (jsonb, full house details)
  - `analysis` (jsonb, full AI analysis result)
  - `solar_potential` (jsonb, nullable, solar calculation if available)
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `saved_reports`.
- This is a no-auth app, so all CRUD is allowed for anon + authenticated (data is intentionally shared/public for demo purposes).

3. Notes
- All JSON fields store the complete object so reports can be fully reconstructed without re-running analysis.
- `solar_potential` is nullable because not all reports will have solar data.
*/

CREATE TABLE IF NOT EXISTS saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name text NOT NULL,
  location_name text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  weather jsonb NOT NULL,
  currency jsonb NOT NULL,
  house_details jsonb NOT NULL,
  analysis jsonb NOT NULL,
  solar_potential jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON saved_reports;
CREATE POLICY "anon_select_reports" ON saved_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON saved_reports;
CREATE POLICY "anon_insert_reports" ON saved_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON saved_reports;
CREATE POLICY "anon_update_reports" ON saved_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON saved_reports;
CREATE POLICY "anon_delete_reports" ON saved_reports FOR DELETE
  TO anon, authenticated USING (true);
