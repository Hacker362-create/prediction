import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GoalTeam = { id?: string | number; apiId?: string | number; name?: string; logo?: string | null; image?: string | null };
type GoalFixture = {
  id?: string | number;
  apiId?: string | number;
  kickoffUtc?: string;
  matchDate?: string;
  matchTime?: string;
  matchStatus?: string;
  matchPeriod?: string;
  status?: string | { short?: string; long?: string };
  homeTeam?: GoalTeam | null;
  awayTeam?: GoalTeam | null;
  league?: { id?: string | number; name?: string; country?: string | { name?: string } | null } | null;
  homeScore?: number | string | null;
  awayScore?: number | string | null;
  score?: { home?: number | string | null; away?: number | string | null } | null;
};

function score(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedStatus(value: unknown): { short: string; long: string } {
  const raw = typeof value === "string" ? value.toUpperCase() : "";
  const status = typeof value === "object" && value !== null
    ? String((value as { short?: string }).short ?? "").toUpperCase()
    : raw;
  const labels: Record<string, { short: string; long: string }> = {
    NOT_STARTED: { short: "NS", long: "Not started" },
    SCHEDULED: { short: "NS", long: "Scheduled" },
    LIVE: { short: "LIVE", long: "Live" },
    FIRST_HALF: { short: "1H", long: "First half" },
    HALF_TIME: { short: "HT", long: "Half time" },
    SECOND_HALF: { short: "2H", long: "Second half" },
    EXTRA_TIME: { short: "ET", long: "Extra time" },
    PENALTIES: { short: "P", long: "Penalties" },
    FINISHED: { short: "FT", long: "Finished" },
    FULL_TIME: { short: "FT", long: "Full time" },
    POSTPONED: { short: "PST", long: "Postponed" },
    CANCELLED: { short: "CANC", long: "Cancelled" },
    ABANDONED: { short: "ABD", long: "Abandoned" },
  };
  if (labels[status]) return labels[status];
  if (typeof value === "object" && value !== null) {
    const item = value as { short?: string; long?: string };
    return { short: item.short ?? "NS", long: item.long ?? "Scheduled" };
  }
  return { short: status || "NS", long: status ? status.replaceAll("_", " ") : "Scheduled" };
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: "Date must use YYYY-MM-DD format." }, { status: 400 });
  }

  const key = process.env.GOAL_API_KEY;
  if (!key) {
    return NextResponse.json({
      configured: false,
      provider: "GOAL API",
      fixtures: [],
      message: "Add GOAL_API_KEY to .env.local or your Vercel project settings to load verified fixtures.",
    });
  }

  try {
    const upstream = await fetch(`https://api.goal-api.com/v1/fixtures/date/${encodeURIComponent(date)}?limit=100`, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = upstream.status === 401
        ? "GOAL API rejected the key. Check that GOAL_API_KEY is correct."
        : upstream.status === 429
          ? "GOAL API request quota or rate limit reached. Check your plan and retry later."
          : "GOAL API returned an error. Check provider status and plan access.";
      return NextResponse.json({ configured: true, provider: "GOAL API", fixtures: [], error: message, providerStatus: upstream.status }, {
        status: upstream.status === 429 ? 429 : upstream.status === 400 ? 400 : 502,
      });
    }

    if (!payload || payload.success === false || !Array.isArray(payload.data)) {
      return NextResponse.json({ configured: true, provider: "GOAL API", fixtures: [], error: "GOAL API returned an unexpected response format." }, { status: 502 });
    }

    const fixtures = (payload.data as GoalFixture[]).map((item) => {
      const status = normalizedStatus(item.matchStatus ?? item.matchPeriod ?? item.status);
      const country = typeof item.league?.country === "string" ? item.league.country : item.league?.country?.name ?? "";
      const homeScore = score(item.homeScore ?? item.score?.home);
      const awayScore = score(item.awayScore ?? item.score?.away);
      const kickoff = item.kickoffUtc ?? (item.matchDate ? `${item.matchDate}T${item.matchTime ?? "00:00"}:00Z` : null);
      return {
        id: item.id ?? item.apiId ?? null,
        kickoff,
        timestamp: kickoff ? Math.floor(new Date(kickoff).getTime() / 1000) : null,
        status: status.short,
        statusText: status.long,
        league: item.league?.name ?? "Unknown competition",
        country,
        leagueId: item.league?.id ?? null,
        round: null,
        home: { id: item.homeTeam?.id ?? item.homeTeam?.apiId ?? null, name: item.homeTeam?.name ?? "Home team", logo: item.homeTeam?.logo ?? item.homeTeam?.image ?? null },
        away: { id: item.awayTeam?.id ?? item.awayTeam?.apiId ?? null, name: item.awayTeam?.name ?? "Away team", logo: item.awayTeam?.logo ?? item.awayTeam?.image ?? null },
        goals: { home: homeScore, away: awayScore },
      };
    });

    return NextResponse.json({ configured: true, provider: "GOAL API", date, count: fixtures.length, fixtures });
  } catch {
    return NextResponse.json({ configured: true, provider: "GOAL API", fixtures: [], error: "Could not reach GOAL API. Please retry shortly." }, { status: 504 });
  }
}
