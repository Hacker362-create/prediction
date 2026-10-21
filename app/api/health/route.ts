import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    status: "ok",
    providerConfigured: Boolean(process.env.API_FOOTBALL_KEY),
    provider: "API-Football (API-Sports)",
    timestamp: new Date().toISOString(),
  });
}