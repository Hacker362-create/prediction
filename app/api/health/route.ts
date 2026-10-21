import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    providerConfigured: Boolean(process.env.GOAL_API_KEY),
    provider: "GOAL API",
    timestamp: new Date().toISOString(),
  });
}
