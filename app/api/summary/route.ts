// app/api/summary/route.ts
import { NextResponse } from "next/server";
import { fetchMicroburbsJson } from "../_lib/helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suburb = searchParams.get("suburb") || "Belmont North";
  const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
  const upstreamUrl = `${BASE_URL}/suburb/summary?suburb=${encodeURIComponent(suburb)}`;

  try {
    const result = await fetchMicroburbsJson(upstreamUrl);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // ✅ Extract and return only the useful data (handle loose types safely)
    const rawData: any = (result as any)?.data ?? null;

    const formatted: any[] = Array.isArray(rawData?.results)
      ? rawData.results
      : Array.isArray(rawData)
      ? rawData
      : [];

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch summary: ${err.message}` },
      { status: 500 }
    );
  }
}