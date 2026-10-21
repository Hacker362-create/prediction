# Pitch Intelligence

A Next.js football intelligence dashboard built around verified fixture data, transparent statistical modelling, and measured performance. The application deliberately does not invent fixtures, team statistics, model confidence, or accuracy claims.

## Stack
- Next.js App Router + React + TypeScript
- API-Football / API-Sports for fixture data
- Transparent Poisson probability utility for expected-goals inputs
- Vercel-compatible server-side API routes

## Local setup
1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Set `API_FOOTBALL_KEY` in `.env.local`.
5. Start: `npm run dev`
6. Open `http://localhost:3000`.

Keep the API key server-side; never use a `NEXT_PUBLIC_*` variable for it.

## Provider recommendation
Start by evaluating API-Football's Worldwide plan against the exact leagues and endpoints needed. Its published plan advertises 800+ leagues for $42/month; Premium advertises a prediction API for $63/month. Pricing and plan entitlements can change, so verify before subscribing. This app's first iteration fetches fixtures and does not require the provider's prediction feed.

Official provider: https://www.api-football.com/

Sportmonks is an alternative with broad coverage and deeper match data, but global coverage and advanced xG/odds features may require higher plans or add-ons: https://www.sportmonks.com/football-api/

## Current functionality
- Date-based fixture retrieval through a server-side API route
- Clear unconfigured, provider-error, and empty-day states
- Fixture list with competition filter, kickoff, score, status, and crests
- Interactive Poisson calculator from user-supplied expected goals
- Health endpoint at `/api/health`
- No fabricated match cards or unverified accuracy statistics

## Modelling boundary
The probability lab is a calculator, not a real match predictor. It computes 1X2, over/under 2.5 and both-teams-to-score probabilities from expected-goal inputs. It does not currently infer those inputs from team history.

## Accuracy roadmap
1. Store normalized historical fixtures/results with provider IDs and timestamps.
2. Fit team attack/defence ratings and home advantage using only pre-kickoff information.
3. Estimate expected goals from rolling team data; consider Dixon–Coles correction for low scores.
4. Use chronological train/validation/test splits to avoid data leakage.
5. Backtest against simple baselines and bookmaker implied probabilities where licensed data is available.
6. Track Brier score, log loss, calibration, coverage and performance by league/season.
7. Publish forecasts only when input coverage and evaluation thresholds are met.

A high hit rate cannot be guaranteed. Judge predictions on a sufficiently large out-of-sample dataset and disclose uncertainty.

## Environment variables
| Variable | Required | Description |
|---|---|---|
| `API_FOOTBALL_KEY` | For live fixtures | API-Sports key, server-side only |
| `API_FOOTBALL_BASE_URL` | No | Defaults to `https://v3.football.api-sports.io` |

## Deployment
Import this repository into Vercel, set the environment variables for Preview and Production, and deploy. Verify using `/api/health` and test fixture retrieval against the provider dashboard. No secrets belong in Git.