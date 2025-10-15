// app/api/schools/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";           // run on Node (not edge)
export const dynamic = "force-dynamic";    // opt-out of static optimization
export const revalidate = 0;               // no ISR
export const fetchCache = "force-no-store"; // tell Next our fetches are no-store

const BASE = "https://www.microburbs.com.au/report_generator/api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") ?? "Belmont North";

  const headers = {
    Authorization: "Bearer test",
    "Content-Type": "application/json",
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  };

  // fetch schools + amenities (for coords) in parallel
  const [schoolsRes, amenityRes] = await Promise.all([
    fetch(`${BASE}/suburb/schools?suburb=${encodeURIComponent(suburb)}`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${BASE}/suburb/amenity?suburb=${encodeURIComponent(suburb)}`, {
      headers,
      cache: "no-store",
    }),
  ]);

  // pass through upstream errors with context
  if (!schoolsRes.ok) {
    const t = await schoolsRes.text();
    return NextResponse.json(
      { error: `Upstream ${schoolsRes.status}: ${t.slice(0, 400)}` },
      { status: 502 }
    );
  }
  if (!amenityRes.ok) {
    const t = await amenityRes.text();
    return NextResponse.json(
      { error: `Upstream ${amenityRes.status}: ${t.slice(0, 400)}` },
      { status: 502 }
    );
  }

  // parse as JSON safely
  const schoolsData = await schoolsRes.json().catch(() => ({ results: [] }));
  const amenityData = await amenityRes.json().catch(() => ({ results: [] }));

  // pick only amenities that are schools to get lat/lng
  const schoolAmenities = Array.isArray(amenityData?.results)
    ? amenityData.results.filter(
        (a: any) => (a?.category ?? "").toString().toLowerCase() === "school"
      )
    : [];

  const norm = (s: string) => (s || "").toLowerCase().trim();

  const results = (Array.isArray(schoolsData?.results) ? schoolsData.results : []).map(
    (s: any) => {
      const name = s?.name?.toString() ?? "";
      const match = schoolAmenities.find((a: any) => {
        const an = a?.name?.toString() ?? "";
        return norm(an) === norm(name) || norm(an).includes(norm(name)) || norm(name).includes(norm(an));
      });

      const lat = Number(match?.lat);
      const lng = Number(match?.lon ?? match?.lng);

      return {
        id: s?.id ?? null,
        name,
        area_level: s?.area_level ?? "suburb",
        area_name: s?.area_name ?? suburb,
        school_level_type: s?.school_level_type ?? null,
        school_sector_type: s?.school_sector_type ?? null,
        naplan_rank: s?.naplan_rank ?? null,
        attendance_rate: s?.attendance_rate ?? null,
        boys: s?.boys ?? null,
        girls: s?.girls ?? null,
        socioeconomic_rank: s?.socioeconomic_rank ?? null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      };
    }
  );

  // return only schools we can place on the map (optional – or remove this filter)
  const withCoords = results.filter((r) => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng)));

  return NextResponse.json({ results: withCoords }, { status: 200 });
}