// app/api/amenities/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";

function sanitizeInvalidJson(text: string): string {
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
    // Don’t break the UI — return empty data with a meta warning
    return NextResponse.json(
      { results: [], categories: [], meta: { warning: `Upstream fetch failed: ${String(err?.message || err)}` } },
      { status: 200 }
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { results: [], categories: [], meta: { warning: `Upstream ${res.status}: ${bodyText.slice(0, 300)}` } },
      { status: 200 }
    );
  }

  const textToParse = sanitizeInvalidJson(bodyText.trim());
  const looksLikeJson = textToParse.startsWith("{") || textToParse.startsWith("[");

  if (!/application\/json/i.test(contentType) && !looksLikeJson) {
    return NextResponse.json(
      {
        results: [],
        categories: [],
        meta: {
          warning: "Upstream returned non-JSON payload; returning empty set.",
          contentType,
          snippet: bodyText.slice(0, 300),
        },
      },
      { status: 200 }
    );
  }

  let raw: any = {};
  try {
    raw = JSON.parse(textToParse);
  } catch (err: any) {
    return NextResponse.json(
      {
        results: [],
        categories: [],
        meta: {
          warning: `Failed to parse upstream JSON: ${String(err?.message || err)}`,
          snippet: textToParse.slice(0, 300),
        },
      },
      { status: 200 }
    );
  }

  const results = Array.isArray(raw?.results) ? raw.results : [];
  const normalized = results.map((it: any) => ({
    area_level: it?.area_level ?? "suburb",
    area_name: it?.area_name ?? suburb,
    name: typeof it?.name === "string" && it.name.trim() ? it.name.trim() : (it?.category ?? "Amenity"),
    type: typeof it?.category === "string" ? it.category : "Other",
    category: typeof it?.category === "string" ? it.category : "Other",
    lat: Number(it?.lat),
    lng: Number(it?.lon ?? it?.lng),
    address: typeof it?.address === "string" ? it.address : "",
    distance: Number.isFinite(Number(it?.distance)) ? Number(it?.distance) : null,
  }));

  const categories = Array.from(new Set(normalized.map((x: any) => x.category))).sort();

  return NextResponse.json({ results: normalized, categories }, { status: 200 });
}