# Pitch Intelligence

A Next.js football intelligence dashboard built around verified fixture data, transparent statistical modelling, and measured performance. The application deliberately does not invent fixtures, team statistics, model confidence, or accuracy claims.

## Stack
- Next.js App Router + React + TypeScript
- GOAL API for fixtures and results
- Transparent Poisson probability utility for expected-goals inputs
- Vercel-compatible server-side API routes

## Local setup
1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Set `GOAL_API_KEY` in `.env.local`.
5. Start: `npm run dev`
6. Open `http://localhost:3000`.

Create a key at https://goal-api.com/. Keep it server-side; never use a `NEXT_PUBLIC_*` variable for it and never commit `.env.local`.

Example `.env.local`:
```env
GOAL_API_KEY=your_real_key_here
```

## Provider
The app uses GOAL API's documented REST base URL `https://api.goal-api.com/v1`, Bearer-token authentication, and `GET /fixtures/date/:date`. The provider advertises coverage across 1,000+ competitions and a free tier; verify the coverage, historical depth, daily quota, and plan restrictions for your specific leagues in the official dashboard before relying on them.

Official docs: https://goal-api.com/documentation
Coverage: https://goal-api.com/
Pricing and limits: https://goal-api.com/

## Current functionality
- Date-based fixture retrieval through a server-side API route
- Clear unconfigured, provider-error, and empty-day states
- Fixture list with competition filter, kickoff, score, status, and crests
- Interactive Poisson calculator from user-supplied expected goals
- Health endpoint at `/api/health`
- No fabricated match cards or unverified accuracy statistics

## Modelling boundary
The probability lab is a calculator, not a real match predictor. It computes 1X2, over/under 2.5 and both-teams-to-score probabilities from expected-goal inputs. It does not currently infer those inputs from team history. GOAL API data access alone does not establish predictive accuracy.

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
| `GOAL_API_KEY` | For live fixtures | GOAL API key, server-side only |

## Deployment
Import this repository into Vercel, set `GOAL_API_KEY` for Preview and Production, and deploy. Verify using `/api/health` and test fixture retrieval against the provider dashboard. No secrets belong in Git.
