import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ApiFixture = {
  fixture?: { id?: number; date?: string; timestamp?: number; status?: { short?: string; long?: string } };
  league?: { id?: number; name?: string; country?: string; logo?: string; round?: string };
  teams?: {
    home?: { id?: number; name?: string; logo?: string; winner?: boolean | null };
    away?: { id?: number; name?: string; logo?: string; winner?: boolean | null };
  };
  goals?: { home?: number | null; away?: number | null };
};

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must use YYYY-MM-DD format." }, { status: 400 });
  }
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({
      configured: false,
      provider: "API-Football",
      fixtures: [],
      message: "Add API_FOOTBALL_KEY to your local environment or Vercel project settings to load verified fixtures.",
    });
  }

  const base = (process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io").replace(/\/$/, "");
  try {
    const upstream = await fetch(`${base}/fixtures?date=${encodeURIComponent(date)}`, {
      headers: { "x-apisports-key": key, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const payload = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({
        configured: true,
        fixtures: [],
        error: upstream.status === 429 ? "The football data provider rate limit was reached." : "The football data provider returned an error.",
        providerStatus: upstream.status,
      }, { status: upstream.status === 429 ? 429 : 502 });
    }
    if (payload?.errors && Object.keys(payload.errors).length > 0) {
      return NextResponse.json({ configured: true, fixtures: [], error: "The provider rejected the request. Check the API key and plan access." }, { status: 502 });
    }

    const fixtures = ((payload?.response ?? []) as ApiFixture[]).map((item) => ({
      id: item.fixture?.id ?? null,
      kickoff: item.fixture?.date ?? null,
      timestamp: item.fixture?.timestamp ?? null,
      status: item.fixture?.status?.short ?? "NS",
      statusText: item.fixture?.status?.long ?? "Scheduled",
      league: item.league?.name ?? "Unknown competition",
      country: item.league?.country ?? "",
      leagueId: item.league?.id ?? null,
      round: item.league?.round ?? null,
      home: { id: item.teams?.home?.id ?? null, name: item.teams?.home?.name ?? "Home team", logo: item.teams?.home?.logo ?? null },
      away: { id: item.teams?.away?.id ?? null, name: item.teams?.away?.name ?? "Away team", logo: item.teams?.away?.logo ?? null },
      goals: { home: item.goals?.home ?? null, away: item.goals?.away ?? null },
    }));
    return NextResponse.json({ configured: true, provider: "API-Football", date, count: fixtures.length, fixtures });
  } catch {
    return NextResponse.json({ configured: true, fixtures: [], error: "Could not reach the football data provider. Please retry shortly." }, { status: 504 });
  }
}