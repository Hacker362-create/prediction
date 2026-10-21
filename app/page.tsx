"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CircleHelp, Database, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { probabilitiesFromExpectedGoals, type OutcomeProbabilities } from "@/lib/predictions";

type Fixture = {
  id: number | string | null; kickoff: string | null; timestamp: number | null; status: string; statusText: string;
  league: string; country: string; leagueId: number | string | null; round: string | null;
  home: { id: number | string | null; name: string; logo: string | null };
  away: { id: number | string | null; name: string; logo: string | null };
  goals: { home: number | null; away: number | null };
};
type FixturesResponse = { configured: boolean; provider?: string; date?: string; count?: number; fixtures: Fixture[]; message?: string; error?: string };

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function clock(value: string | null) {
  if (!value) return "Time TBC";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function Crest({ name, logo }: { name: string; logo: string | null }) {
  return logo ? <img className="crest" src={logo} alt="" loading="lazy" /> : <span className="crest-fallback">{name.slice(0, 2).toUpperCase()}</span>;
}
function FixtureRow({ fixture }: { fixture: Fixture }) {
  const finished = ["FT", "AET", "PEN"].includes(fixture.status);
  const live = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(fixture.status);
  const scoreExists = fixture.goals.home !== null && fixture.goals.away !== null;
  return <article className="fixture">
    <div className="fixture-meta"><span className="fixture-league">{fixture.country ? `${fixture.country} · ` : ""}{fixture.league}</span><span>{fixture.round ?? ""}</span></div>
    <div className="teams">
      <div className="team"><Crest name={fixture.home.name} logo={fixture.home.logo}/><span className="team-name">{fixture.home.name}</span></div>
      <div className="scorebox">
        {scoreExists ? <div className="score">{fixture.goals.home} – {fixture.goals.away}</div> : <div className="kickoff">{clock(fixture.kickoff)}</div>}
        <span className="match-status" style={{ color: live ? "#f3c66b" : finished ? "#8c9a90" : "#c3f36b" }}>{live ? "● LIVE" : finished ? "FULL TIME" : fixture.statusText.toUpperCase()}</span>
      </div>
      <div className="team away"><span className="team-name">{fixture.away.name}</span><Crest name={fixture.away.name} logo={fixture.away.logo}/></div>
    </div>
  </article>;
}

export default function Home() {
  const [date, setDate] = useState("");
  const [data, setData] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [league, setLeague] = useState("all");
  const [homeXg, setHomeXg] = useState("1.55");
  const [awayXg, setAwayXg] = useState("1.05");
  const [showModel, setShowModel] = useState(false);

  useEffect(() => setDate(localDate()), []);
  const loadFixtures = useCallback(async (selectedDate: string) => {
    if (!selectedDate) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/fixtures?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store" });
      const payload = (await response.json()) as FixturesResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load fixtures.");
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error loading fixtures.");
      setData(null);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (date) void loadFixtures(date); }, [date, loadFixtures]);

  const fixtures = data?.fixtures ?? [];
  const leagues = useMemo(() => Array.from(new Set(fixtures.map((f) => f.league))).sort(), [fixtures]);
  const visibleFixtures = useMemo(() => league === "all" ? fixtures : fixtures.filter((f) => f.league === league), [fixtures, league]);
  const model: OutcomeProbabilities | null = useMemo(() => {
    if (!showModel) return null;
    const h = Number(homeXg), a = Number(awayXg);
    if (!Number.isFinite(h) || !Number.isFinite(a) || h <= 0 || a <= 0 || h > 6 || a > 6) return null;
    return probabilitiesFromExpectedGoals(h, a);
  }, [showModel, homeXg, awayXg]);

  return <main>
    <header className="shell topbar">
      <a className="brand" href="/" aria-label="Pitch Intelligence home"><span className="brand-mark">⌁</span><span>PITCH INTELLIGENCE<div className="brand-sub">FOOTBALL, QUANTIFIED</div></span></a>
      <div className="status-pill"><span className={data?.configured ? "dot" : "dot off"}/>{data?.configured ? "DATA PROVIDER CONNECTED" : "DATA SETUP REQUIRED"}</div>
    </header>

    <section className="shell">
      <div className="hero">
        <div><div className="eyebrow">Matchday intelligence / 01</div><h1>See the game<br/>before it happens.</h1><p>Fixtures from a real data provider, transparent probability modelling, and a clear separation between verified facts and model estimates.</p></div>
        <div><label className="form-label" htmlFor="match-date">FIXTURES DATE</label><input id="match-date" className="date-control" type="date" value={date} onChange={(e) => { setLeague("all"); setDate(e.target.value); }}/></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-top"><span>FIXTURES FOUND</span><span className="stat-icon"><CalendarDays size={16}/></span></div><div className="stat-value">{loading ? "—" : data?.configured ? (data.count ?? 0) : "—"}</div><div className="stat-foot">{data?.configured ? "Returned by provider for selected date" : "Connect provider to load fixtures"}</div></div>
        <div className="stat-card"><div className="stat-top"><span>MODEL STATUS</span><span className="stat-icon"><Activity size={16}/></span></div><div className="stat-value" style={{fontSize:21}}>Research mode</div><div className="stat-foot">No unvalidated match picks published</div></div>
        <div className="stat-card"><div className="stat-top"><span>DATA INTEGRITY</span><span className="stat-icon"><ShieldCheck size={16}/></span></div><div className="stat-value" style={{fontSize:21}}>{data?.configured ? "Connected" : "Pending"}</div><div className="stat-foot">No synthetic fixture or result records</div></div>
      </div>

      <div className="section-label"><h2>Match centre</h2><span>{date || "Select a date"} · {data?.provider ?? "Provider not connected"}</span></div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-head"><div><h3>Fixtures & results</h3><p>Live data returned by your configured provider</p></div><button className="secondary-btn" onClick={() => date && void loadFixtures(date)} disabled={loading || !date}><RefreshCw size={12} style={{display:"inline",marginRight:6,verticalAlign:"-2px"}}/>{loading ? "Loading" : "Refresh"}</button></div>
          {leagues.length > 0 && <div style={{padding:"13px 17px 0"}}><label className="form-label" htmlFor="league-filter">FILTER COMPETITION</label><select id="league-filter" className="field" value={league} onChange={(e) => setLeague(e.target.value)}><option value="all">All competitions ({fixtures.length})</option>{leagues.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>}
          {error && <div style={{padding:16}}><div className="error">{error}</div></div>}
          {loading && <div className="loading">Requesting fixtures from API-Football…</div>}
          {!loading && !error && data && !data.configured && <div className="empty"><div className="empty-icon"><Database size={20}/></div><h4>Connect your football data</h4><p>{data.message}</p><p style={{marginTop:12}}>Add <strong>API_FOOTBALL_KEY</strong> to your environment, then refresh this page.</p><a className="primary-btn" style={{display:"inline-block",marginTop:17}} href="https://api-football.com/" target="_blank" rel="noreferrer">Get API access ↗</a></div>}
          {!loading && !error && data?.configured && visibleFixtures.length === 0 && <div className="empty"><div className="empty-icon"><CalendarDays size={20}/></div><h4>No fixtures returned</h4><p>API-Football returned no fixtures for this date and your current plan. This is a real empty result, not a generated fixture list.</p></div>}
          {!loading && !error && visibleFixtures.length > 0 && <div className="fixture-list">{visibleFixtures.map((fixture, i) => <FixtureRow key={fixture.id ?? `${fixture.home.name}-${i}`} fixture={fixture}/>)}</div>}
          {!data && !loading && !error && <div className="empty"><div className="empty-icon"><CalendarDays size={20}/></div><h4>Choose a matchday</h4><p>Fixture results will appear here after the data provider is configured.</p></div>}
        </section>

        <div>
          <section className="panel">
            <div className="panel-head"><div><h3>Probability lab</h3><p>Explore the Poisson model with your own xG inputs</p></div><span className="tiny-tag">Experimental</span></div>
            <div className="panel-body">
              <div className="field-row">
                <div><label className="form-label" htmlFor="home-xg">HOME EXPECTED GOALS</label><input id="home-xg" className="field" type="number" min="0.1" max="6" step="0.05" value={homeXg} onChange={(e) => setHomeXg(e.target.value)}/></div>
                <div><label className="form-label" htmlFor="away-xg">AWAY EXPECTED GOALS</label><input id="away-xg" className="field" type="number" min="0.1" max="6" step="0.05" value={awayXg} onChange={(e) => setAwayXg(e.target.value)}/></div>
              </div>
              <button className="primary-btn" style={{width:"100%",marginTop:13}} onClick={() => setShowModel(true)}><Target size={13} style={{display:"inline",marginRight:7,verticalAlign:"-2px"}}/>Calculate probabilities</button>
              {model && <div className="model-output">
                <div className="output-title">1X2 PROBABILITIES · BASED ON YOUR INPUTS</div>
                <div className="prob-row">{[["HOME",model.home],["DRAW",model.draw],["AWAY",model.away]].map(([label,value]) => <div className="prob" key={label}><span>{label}</span><strong>{Number(value).toFixed(1)}%</strong><div className="bar-track"><div className="bar-fill" style={{width:`${value}%`}}/></div></div>)}</div>
                <div className="submarket"><span>Most likely score</span><strong>{model.mostLikelyScore}</strong></div>
                <div className="submarket"><span>Over 2.5 goals</span><strong>{model.over25.toFixed(1)}%</strong></div>
                <div className="submarket"><span>Both teams to score — Yes</span><strong>{model.bttsYes.toFixed(1)}%</strong></div>
                <div className="footnote">Expected goals: {model.expectedHomeGoals.toFixed(2)} home / {model.expectedAwayGoals.toFixed(2)} away. Inputs are user-supplied, not live team estimates.</div>
              </div>}
              {!model && <div className="notice">This calculator is a transparent statistical component, not a prediction for a real fixture. Match-specific probabilities will only be shown after the model has verified historical inputs and has been backtested.</div>}
              <div className="footnote"><CircleHelp size={12} style={{display:"inline",marginRight:5,verticalAlign:"-2px"}}/>Poisson assumes goal counts follow independent distributions. Real matches can violate these assumptions.</div>
            </div>
          </section>

          <section className="panel" style={{marginTop:15}}>
            <div className="panel-head"><div><h3>How trust is earned</h3><p>Performance before promises</p></div><span className="tiny-tag">Protocol</span></div>
            <div className="panel-body">
              {[["01","Historical backtesting","Evaluate only on matches not used to fit the model."],["02","Probability calibration","Check whether events forecast at 60% occur close to 60%."],["03","Proper scoring rules","Track Brier score and log loss, not just winner hit rate."],["04","Data freshness","Record source timestamps and show missing inputs clearly."]].map(([n,title,desc])=><div key={n} style={{display:"grid",gridTemplateColumns:"30px 1fr",gap:10,padding:"10px 0",borderBottom:"1px solid #202922"}}><span style={{color:"var(--green)",fontFamily:"DM Mono",fontSize:11}}>{n}</span><div><div style={{fontSize:11,fontWeight:800,marginBottom:5}}>{title}</div><div style={{fontSize:10,color:"var(--muted)",lineHeight:1.6}}>{desc}</div></div></div>)}
              <div className="footnote">No accuracy percentage is displayed until measured results exist.</div>
            </div>
          </section>
        </div>
      </div>
      <footer className="footer"><div><strong>PITCH INTELLIGENCE</strong><br/>Football, quantified. Built to measure uncertainty honestly.</div><div>Data: API-Football, when configured.<br/>Probabilities are estimates, never guarantees.</div></footer>
    </section>
  </main>;
}
