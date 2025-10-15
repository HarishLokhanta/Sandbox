// app/api/properties/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const SUBURB_QUERY = "Belmont+North";

function sanitizeInvalidJson(text: string): string {
  return text
    .replace(/:\s*NaN\b/g, ": null")
    .replace(/:\s*Infinity\b/g, ": null")
    .replace(/:\s*-Infinity\b/g, ": null")
    .replace(/:\s*undefined\b/g, ": null");
}

export async function GET() {
  const upstreamUrl = `${BASE_URL}/suburb/properties?suburb=${SUBURB_QUERY}`;

  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });
  } catch (err: any) {
    return NextResponse.json(
      { results: [], meta: { warning: `Upstream fetch failed: ${String(err?.message || err)}` } },
      { status: 200 }
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { results: [], meta: { warning: `Upstream ${res.status}: ${bodyText.slice(0, 300)}` } },
      { status: 200 }
    );
  }

  const textToParse = sanitizeInvalidJson(bodyText.trim());
  const looksLikeJson = textToParse.startsWith("{") || textToParse.startsWith("[");

  if (!/application\/json/i.test(contentType) && !looksLikeJson) {
    return NextResponse.json(
      {
        results: [],
        meta: {
          warning: "Upstream returned non-JSON payload for properties; returning empty set.",
          contentType,
          snippet: bodyText.slice(0, 300),
        },
      },
      { status: 200 }
    );
  }

  try {
    const parsed = JSON.parse(textToParse);
    // Some feeds return `{ results: [...] }`, others return an array directly.
    const results = Array.isArray(parsed?.results) ? parsed.results : (Array.isArray(parsed) ? parsed : []);
    return NextResponse.json({ results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        results: [],
        meta: { warning: `Failed to parse upstream JSON: ${String(err?.message || err)}` },
      },
      { status: 200 }
    );
  }
}