# Pitch Intelligence

A Next.js football intelligence dashboard built around verified fixture data, transparent statistical modelling, and measured performance. The application deliberately does not invent fixtures, team statistics, model confidence, or accuracy claims.

## Stack
- Next.js App Router + React + TypeScript
- API-Football (API-Sports) for fixtures and results
- Transparent Poisson probability utility for expected-goals inputs
- Vercel-compatible server-side API routes

## Local setup
1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Set `API_FOOTBALL_KEY` in `.env.local`.
5. Start: `npm run dev`
6. Open `http://localhost:3000`.

Get an API key from https://www.api-football.com/. Keep it server-side; never use a `NEXT_PUBLIC_*` variable for it and never commit `.env.local`.

Example `.env.local`:
```env
API_FOOTBALL_KEY=your_api_key_here
```

## Provider
Fixtures are requested from `GET https://v3.football.api-sports.io/fixtures?date=YYYY-MM-DD` using the `x-apisports-key` header. API access, league coverage, history, and request limits depend on the account's current plan. Check the provider dashboard and official documentation before relying on a particular competition.

Official documentation: https://www.api-football.com/documentation-v3

## Current functionality
- Date-based fixture retrieval through a server-side API route
- Clear unconfigured, provider-error, and empty-day states
- Fixture list with competition filter, kickoff, score, status, and crests
- Interactive Poisson calculator from user-supplied expected goals
- Health endpoint at `/api/health`
- No fabricated match cards or unverified accuracy statistics

## Modelling boundary
The probability lab is a calculator, not a real match predictor. It computes 1X2, over/under 2.5 and both-teams-to-score probabilities from expected-goal inputs. It does not currently infer those inputs from team history. API-Football data access alone does not establish predictive accuracy.

## Accuracy roadmap
1. Check coverage and historical depth for the exact competitions to be supported.
2. Store normalized historical fixtures/results with provider IDs and timestamps.
3. Fit team attack/defence ratings and home advantage using only pre-kickoff information.
4. Estimate expected goals from rolling team data; consider Dixon–Coles correction for low scores.
5. Use chronological train/validation/test splits to avoid data leakage.
6. Backtest against simple baselines and bookmaker implied probabilities where licensed data is available.
7. Track Brier score, log loss, calibration, coverage and performance by league/season.
8. Publish forecasts only when input coverage and evaluation thresholds are met.

A high hit rate cannot be guaranteed. Judge predictions on a sufficiently large out-of-sample dataset and disclose uncertainty.

## Environment variables
| Variable | Required | Description |
|---|---|---|
| `API_FOOTBALL_KEY` | For live fixtures | API-Football key, server-side only |

## Deployment
Import this repository into Vercel, set `API_FOOTBALL_KEY` for Preview and Production, and deploy. Verify using `/api/health` and test fixture retrieval against the provider dashboard. No secrets belong in Git.
