import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ApiFootballFixture = {
  fixture?: { id?: number; date?: string; timestamp?: number; status?: { short?: string; long?: string } };
  league?: { id?: number; name?: string; country?: string; round?: string };
  teams?: {
    home?: { id?: number; name?: string; logo?: string | null };
    away?: { id?: number; name?: string; logo?: string | null };
  };
  goals?: { home?: number | null; away?: number | null };
};

function normalizedStatus(shortValue: unknown, longValue: unknown) {
  const short = typeof shortValue === "string" ? shortValue.toUpperCase() : "NS";
  const labels: Record<string, string> = {
    TBD: "Time to be defined", NS: "Not started", "1H": "First half", HT: "Half time",
    "2H": "Second half", ET: "Extra time", BT: "Break time", P: "Penalties",
    SUSP: "Suspended", INT: "Interrupted", FT: "Full time", AET: "After extra time",
    PEN: "After penalties", PST: "Postponed", CANC: "Cancelled", ABD: "Abandoned",
    AWD: "Technical loss", WO: "Walkover", LIVE: "Live",
  };
  return { short, long: typeof longValue === "string" && longValue ? longValue : labels[short] ?? short };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: "Date must use YYYY-MM-DD format." }, { status: 400 });
  }

  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({
      configured: false,
      provider: "API-Football",
      fixtures: [],
      message: "Add API_FOOTBALL_KEY to .env.local or your Vercel project settings to load verified fixtures.",
    });
  }

  try {
    const upstream = await fetch(`https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}`, {
      headers: { "x-apisports-key": key, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = upstream.status === 401 || upstream.status === 403
        ? "API-Football rejected the key or the account does not have access. Check your API-Sports dashboard."
        : upstream.status === 429
          ? "API-Football rate limit reached. Check your plan and retry later."
          : "API-Football returned an error. Check provider status and plan access.";
      return NextResponse.json({ configured: true, provider: "API-Football", fixtures: [], error: message, providerStatus: upstream.status }, {
        status: upstream.status === 429 ? 429 : upstream.status === 400 ? 400 : 502,
      });
    }

    if (!payload || !Array.isArray(payload.response) || (Array.isArray(payload.errors) && payload.errors.length > 0)) {
      return NextResponse.json({
        configured: true, provider: "API-Football", fixtures: [],
        error: "API-Football returned an unexpected response or API-level error.",
      }, { status: 502 });
    }

    const fixtures = (payload.response as ApiFootballFixture[]).map((item) => {
      const status = normalizedStatus(item.fixture?.status?.short, item.fixture?.status?.long);
      const kickoff = item.fixture?.date ?? null;
      return {
        id: item.fixture?.id ?? null,
        kickoff,
        timestamp: item.fixture?.timestamp ?? (kickoff ? Math.floor(new Date(kickoff).getTime() / 1000) : null),
        status: status.short,
        statusText: status.long,
        league: item.league?.name ?? "Unknown competition",
        country: item.league?.country ?? "",
        leagueId: item.league?.id ?? null,
        round: item.league?.round ?? null,
        home: { id: item.teams?.home?.id ?? null, name: item.teams?.home?.name ?? "Home team", logo: item.teams?.home?.logo ?? null },
        away: { id: item.teams?.away?.id ?? null, name: item.teams?.away?.name ?? "Away team", logo: item.teams?.away?.logo ?? null },
        goals: { home: item.goals?.home ?? null, away: item.goals?.away ?? null },
      };
    });

    return NextResponse.json({ configured: true, provider: "API-Football", date, count: fixtures.length, fixtures });
  } catch {
    return NextResponse.json({ configured: true, provider: "API-Football", fixtures: [], error: "Could not reach API-Football. Please retry shortly." }, { status: 504 });
  }
}
