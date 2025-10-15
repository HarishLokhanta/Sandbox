import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") ?? "Belmont North";

  const headers = {
    Authorization: "Bearer test",
    "Content-Type": "application/json",
  };

  const [schoolsRes, amenityRes] = await Promise.all([
    fetch(
      `https://www.microburbs.com.au/report_generator/api/suburb/schools?suburb=${encodeURIComponent(suburb)}`,
      { headers, cache: "no-store" }
    ),
    fetch(
      `https://www.microburbs.com.au/report_generator/api/suburb/amenity?suburb=${encodeURIComponent(suburb)}`,
      { headers, cache: "no-store" }
    ),
  ]);

  if (!schoolsRes.ok) {
    const t = await schoolsRes.text();
    return NextResponse.json(
      { error: `Upstream ${schoolsRes.status}: ${t}` },
      { status: 502 }
    );
  }
  if (!amenityRes.ok) {
    const t = await amenityRes.text();
    return NextResponse.json(
      { error: `Upstream ${amenityRes.status}: ${t}` },
      { status: 502 }
    );
  }

  const schoolsData = await schoolsRes.json();
  const amenityData = await amenityRes.json();

  const schoolAmenities = (amenityData?.results ?? []).filter(
    (a: Record<string, unknown>) =>
      (a?.category ?? "").toString().toLowerCase() === "school"
  );

  const norm = (s: string) => (s || "").toLowerCase().trim();

  const results = (schoolsData?.results ?? []).map((s: Record<string, unknown>) => {
    const name = s?.name?.toString() ?? "";
    const match = schoolAmenities.find((a: Record<string, unknown>) => {
      const an = a?.name?.toString() ?? "";
      return (
        norm(an) === norm(name) ||
        norm(an).includes(norm(name)) ||
        norm(name).includes(norm(an))
      );
    });

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
      // coordinates from amenity match
      lat: Number(match?.lat ?? NaN),
      lng: Number(match?.lon ?? match?.lng ?? NaN),
      hasCoords:
        Number.isFinite(Number(match?.lat)) &&
        Number.isFinite(Number(match?.lon ?? match?.lng)),
    };
  });

  // only return those we can place on the map
  const withCoords = results.filter((r: Record<string, unknown>) => r.hasCoords);

  return NextResponse.json({ results: withCoords }, { status: 200 });
}
