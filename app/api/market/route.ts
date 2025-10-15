import { NextRequest, NextResponse } from "next/server";

import { fetchMicroburbsJson, normalizeSuburb, DEFAULT_TIMEOUT_MS } from "../_lib/helpers";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const suburbParam = searchParams.get("suburb");

  if (!suburbParam) {
    return NextResponse.json({ error: "Missing suburb parameter" }, { status: 400 });
  }

  const propertyType = searchParams.get("property_type") ?? undefined;
  const suburb = normalizeSuburb(suburbParam) || suburbParam;

  const params = new URLSearchParams();
  params.set("suburb", suburb);
  params.set("property_type", propertyType ?? "all");

  const upstreamUrl = `${BASE_URL}/suburb/market?${params.toString()}`;
  const started = Date.now();

  const result = await fetchMicroburbsJson(upstreamUrl, { timeoutMs: DEFAULT_TIMEOUT_MS });
  const duration = Date.now() - started;

  if (!result.ok) {
    console.info(`[api/market] error ${duration}ms ${upstreamUrl} :: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  console.info(`[api/market] ${duration}ms ${upstreamUrl}`);
  return NextResponse.json(result.data, { status: 200 });
}
