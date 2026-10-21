export type OutcomeProbabilities = {
  home: number; draw: number; away: number; over25: number; under25: number;
  bttsYes: number; bttsNo: number; expectedHomeGoals: number; expectedAwayGoals: number;
  mostLikelyScore: string;
};
function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial;
}
/** Probabilities from expected goals supplied by a real model or verified statistics. */
export function probabilitiesFromExpectedGoals(homeXg: number, awayXg: number): OutcomeProbabilities {
  const h = Math.min(6, Math.max(0.05, homeXg));
  const a = Math.min(6, Math.max(0.05, awayXg));
  let home = 0, draw = 0, away = 0, over25 = 0, bttsYes = 0;
  let best = { score: "0–0", probability: -1 };
  for (let hg = 0; hg <= 10; hg += 1) for (let ag = 0; ag <= 10; ag += 1) {
    const p = poisson(hg, h) * poisson(ag, a);
    if (hg > ag) home += p; else if (hg === ag) draw += p; else away += p;
    if (hg + ag >= 3) over25 += p;
    if (hg > 0 && ag > 0) bttsYes += p;
    if (p > best.probability) best = { score: `${hg}–${ag}`, probability: p };
  }
  const pct = (n: number) => Math.round(n * 1000) / 10;
  return {
    home:pct(home),draw:pct(draw),away:pct(away),over25:pct(over25),under25:pct(1-over25),
    bttsYes:pct(bttsYes),bttsNo:pct(1-bttsYes),expectedHomeGoals:h,expectedAwayGoals:a,
    mostLikelyScore:best.score,
  };
}