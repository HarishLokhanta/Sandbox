import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") ?? "Belmont North";

  const upstream = `https://www.microburbs.com.au/report_generator/api/suburb/amenity?suburb=${encodeURIComponent(
    suburb
  )}`;

  const r = await fetch(upstream, {
    headers: {
      Authorization: "Bearer test",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: `Upstream ${r.status}: ${text}` }, { status: 502 });
  }

  const data = await r.json();
  const results = (data?.results ?? []).map((it: any) => ({
    area_level: it?.area_level ?? "suburb",
    area_name: it?.area_name ?? suburb,
    name: typeof it?.name === "string" && it.name.trim() ? it.name.trim() : it?.category ?? "Amenity",
    type: typeof it?.category === "string" ? it.category : "Other",
    category: typeof it?.category === "string" ? it.category : "Other",
    lat: Number(it?.lat),
    lng: Number(it?.lon),
    address: it?.address ?? "",
    distance: it?.distance ?? null,
  }));

  const categories = Array.from(new Set(results.map((x: any) => x.category))).sort();
  return NextResponse.json({ results, categories }, { status: 200 });
}