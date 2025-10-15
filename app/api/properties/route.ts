import { NextResponse } from "next/server";

/**
 * Properties proxy (sandbox-safe):
 * - Always fetches Belmont North (sandbox token scope)
 * - Guards against HTML/error pages returned by upstream
 * - Sanitizes invalid JSON tokens (NaN, Infinity, -Infinity, undefined)
 * - Returns upstream JSON (sanitized) as-is
 */

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const SUBURB_QUERY = "Belmont+North";

function sanitizeInvalidJson(text: string): string {
  // Replace invalid JSON literals with null
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
        // Help some CDNs choose JSON over HTML
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

  // Read the body exactly once as text, then decide how to handle it.
  const bodyText = await res.text();

  if (!res.ok) {
    // Upstream error (401/403/5xx). Pass through a trimmed snippet for debugging.
    const snippet = bodyText.slice(0, 400);
    return NextResponse.json(
      { error: `Upstream ${res.status}: ${snippet}` },
      { status: 502 }
    );
  }

  // Some sandbox responses may occasionally return HTML (e.g., a login page or CDN edge error).
  // Detect early and fail gracefully instead of trying to JSON.parse("<!DOCTYPE ...>").
  if (!/application\/json/i.test(contentType)) {
    // Try to salvage: sanitize and parse anyway in case content-type is wrong.
    const maybeJson = sanitizeInvalidJson(bodyText.trim());
    try {
      const parsed = JSON.parse(maybeJson);
      return NextResponse.json(parsed, { status: 200 });
    } catch {
      const snippet = bodyText.slice(0, 400);
      return NextResponse.json(
        {
          error:
            "Upstream returned non-JSON payload. Try again or check the sandbox token.",
          hint: "If this happens during dev with HMR, hard refresh to clear hot-update noise.",
          contentType,
          snippet,
        },
        { status: 502 }
      );
    }
  }

  // Parse JSON with sanitization for invalid tokens.
  const sanitized = sanitizeInvalidJson(bodyText);
  try {
    const data = JSON.parse(sanitized);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    // Final guard: if JSON still fails, return a diagnostic 502
    return NextResponse.json(
      {
        error: `Failed to parse upstream JSON: ${String(err?.message || err)}`,
        snippet: sanitized.slice(0, 400),
      },
      { status: 502 }
    );
  }
}
