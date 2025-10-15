// app/api/amenities/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";          // ensure Node runtime on Vercel
export const dynamic = "force-dynamic";   // disable static optimization
export const revalidate = 0;              // no ISR caching

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";

function sanitizeInvalidJson(text: string): string {
  // Replace non-JSON literals that sometimes appear in sandbox payloads
  return text
    .replace(/:\s*NaN\b/g, ": null")
    .replace(/:\s*Infinity\b/g, ": null")
    .replace(/:\s*-Infinity\b/g, ": null")
    .replace(/:\s*undefined\b/g, ": null");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") ?? "Belmont North";

  const upstream = `${BASE_URL}/suburb/amenity?suburb=${encodeURIComponent(suburb)}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Upstream fetch failed: ${String(err?.message || err)}` },
      { status: 502 }
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: `Upstream ${res.status}: ${bodyText.slice(0, 400)}` },
      { status: 502 }
    );
  }

  // If upstream mislabeled content-type, try to parse anyway after sanitizing
  const textToParse = sanitizeInvalidJson(bodyText.trim());
  if (!/application\/json/i.test(contentType) && !textToParse.startsWith("{") && !textToParse.startsWith("[")) {
    return NextResponse.json(
      {
        error: "Upstream returned non-JSON payload.",
        hint: "Sandbox or CDN returned HTML; try again or check token.",
        contentType,
        snippet: bodyText.slice(0, 400),
      },
      { status: 502 }
    );
  }

  let raw: any;
  try {
    raw = JSON.parse(textToParse);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Failed to parse upstream JSON: ${String(err?.message || err)}`,
        snippet: textToParse.slice(0, 400),
      },
      { status: 502 }
    );
  }

  // Normalize for the UI
  const results = Array.isArray(raw?.results) ? raw.results : [];
  const normalized = results.map((it: any) => ({
    area_level: it?.area_level ?? "suburb",
    area_name: it?.area_name ?? suburb,
    name: typeof it?.name === "string" && it.name.trim() ? it.name.trim() : (it?.category ?? "Amenity"),
    type: typeof it?.category === "string" ? it.category : "Other",  // keep both for UI
    category: typeof it?.category === "string" ? it.category : "Other",
    lat: Number(it?.lat),
    lng: Number(it?.lon ?? it?.lng),
    address: typeof it?.address === "string" ? it.address : "",
    distance: Number.isFinite(Number(it?.distance)) ? Number(it?.distance) : null,
  }));

  const categories = Array.from(new Set(normalized.map((x: any) => x.category))).sort();

  return NextResponse.json({ results: normalized, categories }, { status: 200 });
}