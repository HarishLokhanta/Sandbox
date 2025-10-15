// app/api/schools/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type RawAmenity = {
  category?: string;
  name?: string;
  lat?: number | string;
  lon?: number | string;
  lng?: number | string;
};

type RawSchool = {
  id?: number;
  name?: string;
  area_level?: string;
  area_name?: string;
  school_level_type?: string;
  school_sector_type?: string;
  naplan_rank?: string;
  attendance_rate?: number;
  boys?: number;
  girls?: number;
  socioeconomic_rank?: string;
};

type SchoolOut = {
  id: number | null;
  name: string;
  area_level: string;
  area_name: string;
  school_level_type: string | null;
  school_sector_type: string | null;
  naplan_rank: string | null;
  attendance_rate: number | null;
  boys: number | null;
  girls: number | null;
  socioeconomic_rank: string | null;
  lat: number | null;
  lng: number | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") ?? "Belmont North";

  const headers = {
    Authorization: "Bearer test",
    "Content-Type": "application/json",
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  };

  const schoolsUrl = `https://www.microburbs.com.au/report_generator/api/suburb/schools?suburb=${encodeURIComponent(
    suburb
  )}`;
  const amenityUrl = `https://www.microburbs.com.au/report_generator/api/suburb/amenity?suburb=${encodeURIComponent(
    suburb
  )}`;

  const [schoolsRes, amenityRes] = await Promise.all([
    fetch(schoolsUrl, { headers, cache: "no-store" }),
    fetch(amenityUrl, { headers, cache: "no-store" }),
  ]);

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

  const schoolsJson = (await schoolsRes.json()) as { results?: RawSchool[] } | RawSchool[];
  const amenityJson = (await amenityRes.json()) as { results?: RawAmenity[] } | RawAmenity[];

  const schoolList: RawSchool[] = Array.isArray((schoolsJson as any)?.results)
    ? ((schoolsJson as any).results as RawSchool[])
    : (Array.isArray(schoolsJson) ? (schoolsJson as RawSchool[]) : []);

  const amenityList: RawAmenity[] = Array.isArray((amenityJson as any)?.results)
    ? ((amenityJson as any).results as RawAmenity[])
    : (Array.isArray(amenityJson) ? (amenityJson as RawAmenity[]) : []);

  // only amenities categorized as "School"
  const schoolAmenities = amenityList.filter(
    (a) => (a.category ?? "").toString().toLowerCase() === "school"
  );

  const norm = (s: string) => (s || "").toLowerCase().trim();

  const results: SchoolOut[] = schoolList.map((s) => {
    const name = s?.name?.toString() ?? "";
    const match = schoolAmenities.find((a) => {
      const an = a?.name?.toString() ?? "";
      return norm(an) === norm(name) || norm(an).includes(norm(name)) || norm(name).includes(norm(an));
    });

    const latNum = Number(match?.lat);
    const lngNum = Number((match as any)?.lon ?? (match as any)?.lng);

    return {
      id: typeof s?.id === "number" ? s.id : null,
      name,
      area_level: s?.area_level ?? "suburb",
      area_name: s?.area_name ?? suburb,
      school_level_type: s?.school_level_type ?? null,
      school_sector_type: s?.school_sector_type ?? null,
      naplan_rank: s?.naplan_rank ?? null,
      attendance_rate: typeof s?.attendance_rate === "number" ? s.attendance_rate : null,
      boys: typeof s?.boys === "number" ? s.boys : null,
      girls: typeof s?.girls === "number" ? s.girls : null,
      socioeconomic_rank: s?.socioeconomic_rank ?? null,
      lat: Number.isFinite(latNum) ? latNum : null,
      lng: Number.isFinite(lngNum) ? lngNum : null,
    };
  });

  // ✅ Type the filter parameter & keep output typed
  const withCoords: SchoolOut[] = results.filter(
    (r: SchoolOut) => Number.isFinite(r.lat ?? NaN) && Number.isFinite(r.lng ?? NaN)
  );

  return NextResponse.json({ results: withCoords }, { status: 200 });
}