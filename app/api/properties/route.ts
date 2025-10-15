// app/api/properties/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Sandbox-safe proxy for "properties" (FORCE Belmont North):
 * - Pins suburb to Belmont North (sandbox token scope)
 * - Forces Node.js runtime (Vercel)
 * - Disables static optimization/ISR
 * - Defensively handles HTML/non-JSON upstream payloads
 * - Sanitizes invalid JSON tokens (NaN/Infinity/undefined)
 */

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

  // If the CDN returned HTML (login/error), bail with a clean 502
  const textToParse = sanitizeInvalidJson(bodyText.trim());
  const looksLikeJson = textToParse.startsWith("{") || textToParse.startsWith("[");
  if (!/application\/json/i.test(contentType) && !looksLikeJson) {
    return NextResponse.json(
      {
        error: "Upstream returned non-JSON payload.",
        hint: "Sandbox/CDN sometimes sends HTML. Try again or check token.",
        contentType,
        snippet: bodyText.slice(0, 400),
      },
      { status: 502 }
    );
  }

  try {
    const parsed = JSON.parse(textToParse);
    return NextResponse.json(parsed, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Failed to parse upstream JSON: ${String(err?.message || err)}`,
        snippet: textToParse.slice(0, 400),
      },
      { status: 502 }
    );
  }
}