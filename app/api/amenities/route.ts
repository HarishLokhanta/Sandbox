import { NextResponse } from "next/server";
import { fetchMicroburbsJson } from "../_lib/helpers";

const BASE_URL = "https://www.microburbs.com.au/report_generator/api";
const SUBURB_QUERY = "Belmont+North";

export async function GET() {
  const upstreamUrl = `${BASE_URL}/suburb/amenity?suburb=${SUBURB_QUERY}`;
  const result = await fetchMicroburbsJson(upstreamUrl);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
