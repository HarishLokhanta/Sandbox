// app/api/properties/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const SUBURB_QUERY = "Belmont+North";

// Optional: tiny, safe fallback so UI still renders if upstream sends HTML.
// Replace with a file import if you prefer (e.g. import fallback from "@/data/properties-belmont-north.json")
const FALLBACK: unknown = { results: [], page: 1, total_pages: 1, total_records: 0 };

function sanitizeInvalidJson(text: string): string {
  return text
    .replace(/:\s*NaN\b/g, ": null")
    .replace(/:\s*Infinity\b/g, ": null")
    .replace(/:\s*-Infinity\b/g, ": null")
    .replace(/:\s*undefined\b/g, ": null");
}

async function fetchUpstream(url: string, timeoutMs = 8000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
        // Some CDNs choose HTML unless you’re explicit:
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        // A few edges behave better with a UA + Referer:
        "User-Agent":
          "Mozilla/5.0 (compatible; MicroburbsSandboxProxy/1.0; +https://example.com)",
        Referer: "https://example.com/",
      },
      cache: "no-store",
      signal: ctl.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const upstreamUrl = `${BASE_URL}/suburb/properties?suburb=${SUBURB_QUERY}`;

  // up to 2 tries (HTML edge flakiness happens intermittently)
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res: Response;

    try {
      res = await fetchUpstream(upstreamUrl, attempt === 1 ? 8000 : 12000);
    } catch (err: any) {
      if (attempt === 2) {
        return NextResponse.json(
          { error: `Upstream fetch failed: ${String(err?.message || err)}`, fallback: true },
          { status: 502 }
        );
      }
      continue;
    }

    const contentType = res.headers.get("content-type") || "";
    const bodyText = await res.text();

    if (!res.ok) {
      // If sandbox responds 4xx/5xx, return a clean error (UI can show an alert)
      if (attempt === 2) {
        return NextResponse.json(
          { error: `Upstream ${res.status}: ${bodyText.slice(0, 400)}` },
          { status: 502 }
        );
      }
      continue;
    }

    const textToParse = sanitizeInvalidJson(bodyText.trim());
    const looksLikeJson = textToParse.startsWith("{") || textToParse.startsWith("[");

    // Sometimes the CDN mislabels JSON as text/html and/or returns a full HTML page.
    if (!/application\/json/i.test(contentType) && !looksLikeJson) {
      // Try once more; if still HTML, send a friendly error
      if (attempt === 2) {
        // As a last resort, hand back a minimal fallback so the UI doesn't look broken.
        return NextResponse.json(
          {
            error: "Upstream returned non-JSON payload.",
            hint:
              "Sandbox/CDN occasionally serves HTML to serverless IPs. Using fallback.",
            contentType,
            snippet: bodyText.slice(0, 400),
            fallback: true,
            data: FALLBACK,
          },
          { status: 200 } // 200 with fallback lets the UI proceed gracefully
        );
      }
      continue;
    }

    try {
      const parsed = JSON.parse(textToParse);
      return NextResponse.json(parsed, { status: 200 });
    } catch (err: any) {
      if (attempt === 2) {
        return NextResponse.json(
          {
            error: `Failed to parse upstream JSON: ${String(err?.message || err)}`,
            snippet: textToParse.slice(0, 400),
          },
          { status: 502 }
        );
      }
      continue;
    }
  }

  // Should not reach here, but just in case:
  return NextResponse.json({ error: "Unexpected proxy failure" }, { status: 502 });
}