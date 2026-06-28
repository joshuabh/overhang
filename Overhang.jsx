import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────
// OVERHANG — Etsy opportunity scout for 3D-printed products.
//
// Opportunities tab pulls REAL Etsy data from your local backend
// (etsy_backend.py) and ranks it. Sales/revenue are clearly-labelled
// MODELLED estimates (Etsy publishes none — every tool estimates).
// "Find the gap" uses Claude to turn each winner into a remix brief.
// Niche + Keyword tabs run real web research to validate before you model.
// ─────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

:root{
  --paper:#F7F4ED; --paper2:#ECE6D9; --ink:#20232A; --ink2:#6A6B72;
  --molten:#E8651E; --molten-d:#C44E10; --teal:#137886; --teal-d:#0C5A66;
  --green:#2E7D5B; --line:#E0D9C9; --line2:#CFC6B1;
}
*{box-sizing:border-box}
.oh-root{
  background:var(--paper); color:var(--ink);
  font-family:'Hanken Grotesk',system-ui,sans-serif; min-height:100%; width:100%;
  background-image:repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(32,35,42,.025) 5px,rgba(32,35,42,.025) 6px);
}
.oh-wrap{max-width:1000px;margin:0 auto;padding:26px 20px 80px}

/* header */
.oh-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.oh-mark{display:flex;align-items:center;gap:13px}
.oh-logo{width:44px;height:44px;flex:none;border:2px solid var(--ink);background:var(--ink);
  display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;border-radius:3px}
.oh-logo i{display:block;height:5px;background:var(--molten);margin:1.5px 3px;border-radius:1px}
.oh-logo i:nth-child(1){width:55%;background:var(--teal)}
.oh-logo i:nth-child(2){width:78%}
.oh-logo i:nth-child(3){width:92%}
.oh-title{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:28px;line-height:.9;letter-spacing:-.02em}
.oh-sub{font-size:12.5px;color:var(--ink2);margin-top:4px}

/* data source pill */
.oh-src{display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;
  border:1px solid var(--line2);background:#fff;padding:6px 10px;border-radius:3px}
.oh-dot{width:8px;height:8px;border-radius:50%;background:var(--ink2);flex:none}
.oh-dot.ok{background:var(--green)} .oh-dot.fail{background:var(--molten)}

/* honesty banner */
.oh-note{margin:18px 0 20px;border:1px solid var(--line2);border-left:4px solid var(--teal);
  background:#fff;padding:11px 14px;font-size:12.5px;color:var(--ink2);line-height:1.55;border-radius:3px}
.oh-note b{color:var(--ink)}

/* tabs */
.oh-tabs{display:flex;border:1px solid var(--ink);background:#fff;border-radius:4px;overflow:hidden;margin-bottom:20px}
.oh-tab{flex:1;appearance:none;border:none;background:transparent;cursor:pointer;
  font-family:'Hanken Grotesk',sans-serif;font-weight:600;font-size:13px;color:var(--ink2);
  padding:11px 8px;border-right:1px solid var(--line);transition:.15s}
.oh-tab:last-child{border-right:none}
.oh-tab:hover{background:var(--paper2);color:var(--ink)}
.oh-tab.act{background:var(--ink);color:var(--paper)}
.oh-tab small{display:block;font-family:'Space Mono',monospace;font-weight:400;font-size:9.5px;opacity:.7;margin-top:2px;letter-spacing:.03em}

/* card / form */
.oh-card{background:#fff;border:1px solid var(--line2);border-radius:4px;padding:18px;box-shadow:3px 3px 0 var(--paper2)}
.oh-lab{display:block;font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.07em;
  text-transform:uppercase;color:var(--ink2);margin-bottom:7px}
.oh-input{width:100%;border:1px solid var(--line2);background:var(--paper);border-radius:3px;
  font-family:'Hanken Grotesk',sans-serif;font-size:14.5px;color:var(--ink);padding:10px 12px;outline:none;transition:.15s}
.oh-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(19,120,134,.12)}
.oh-grid2{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.oh-grid2 > div{flex:1;min-width:120px}
.oh-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
.oh-btn{appearance:none;border:2px solid var(--ink);background:var(--molten);color:#fff;
  font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;cursor:pointer;
  padding:10px 20px;border-radius:3px;transition:.12s;box-shadow:2px 2px 0 var(--ink)}
.oh-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--ink)}
.oh-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--ink)}
.oh-btn:disabled{opacity:.5;cursor:wait}
.oh-btn.ghost{background:#fff;color:var(--ink)}
.oh-chip{appearance:none;border:1px solid var(--line2);background:var(--paper);cursor:pointer;
  font-family:'Space Mono',monospace;font-size:11px;color:var(--teal);padding:5px 9px;border-radius:14px;transition:.12s}
.oh-chip:hover{border-color:var(--teal);background:#fff}

/* connect panel */
.oh-connect{background:#fff;border:1px dashed var(--line2);border-radius:4px;padding:20px;margin-top:18px}
.oh-connect h3{font-family:'Space Grotesk',sans-serif;font-size:15px;margin:0 0 8px}
.oh-steps{margin:10px 0 0;padding:0;list-style:none;counter-reset:s}
.oh-steps li{counter-increment:s;font-size:13.5px;line-height:1.5;padding:5px 0 5px 30px;position:relative;color:var(--ink2)}
.oh-steps li::before{content:counter(s);position:absolute;left:0;top:5px;width:20px;height:20px;
  background:var(--ink);color:var(--paper);font-family:'Space Mono',monospace;font-size:11px;
  display:flex;align-items:center;justify-content:center;border-radius:3px}
.oh-steps code{font-family:'Space Mono',monospace;font-size:12px;background:var(--paper2);padding:1px 6px;border-radius:3px;color:var(--ink)}

/* results */
.oh-res{margin-top:20px;animation:rise .35s ease}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.oh-meta{font-family:'Space Mono',monospace;font-size:11px;color:var(--ink2);margin:0 2px 12px}

/* opportunity listing card */
.oh-item{background:#fff;border:1px solid var(--line2);border-radius:4px;padding:15px;margin-bottom:13px;
  display:flex;gap:15px;box-shadow:3px 3px 0 var(--paper2)}
.oh-layers{width:34px;flex:none;display:flex;flex-direction:column-reverse;gap:2px;
  border:1px solid var(--ink);padding:3px;background:var(--paper);height:108px;border-radius:2px}
.oh-layer{flex:1;background:var(--paper2);border-radius:1px}
.oh-layer.on{background:var(--molten)}
.oh-itemmain{flex:1;min-width:0}
.oh-itemtop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.oh-itemtitle{font-weight:600;font-size:14.5px;line-height:1.35;color:var(--ink);text-decoration:none}
.oh-itemtitle:hover{color:var(--teal);text-decoration:underline}
.oh-oppscore{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:22px;line-height:1;white-space:nowrap;text-align:right}
.oh-oppscore small{display:block;font-family:'Space Mono',monospace;font-size:8.5px;font-weight:400;letter-spacing:.06em;color:var(--ink2);text-transform:uppercase;margin-top:3px}
.oh-stats{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.oh-stat{font-family:'Space Mono',monospace;font-size:11px;border:1px solid var(--line);border-radius:3px;padding:4px 8px;background:var(--paper)}
.oh-stat b{color:var(--ink);font-weight:700}
.oh-stat.est{border-style:dashed;border-color:var(--teal);color:var(--teal-d)}
.oh-stat .k{color:var(--ink2)}
.oh-tagrow{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.oh-tag{font-family:'Space Mono',monospace;font-size:10.5px;background:var(--paper2);border:1px solid var(--line);padding:3px 7px;border-radius:2px;color:var(--ink2)}
.oh-gapbtn{margin-top:12px}
.oh-gapbtn button{appearance:none;border:1px solid var(--ink);background:var(--paper);cursor:pointer;
  font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12.5px;color:var(--ink);padding:7px 14px;border-radius:3px;transition:.12s}
.oh-gapbtn button:hover:not(:disabled){background:var(--ink);color:var(--paper)}
.oh-gapbtn button:disabled{opacity:.5;cursor:wait}

/* gap analysis */
.oh-gap{margin-top:12px;border-top:1px dashed var(--line2);padding-top:12px;animation:rise .3s ease}
.oh-gap .lead{font-size:13px;line-height:1.5;color:var(--ink);margin-bottom:10px;font-style:italic}
.oh-gapcol{margin-bottom:10px}
.oh-gapcol h4{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;
  color:var(--teal-d);margin:0 0 5px;display:flex;align-items:center;gap:6px}
.oh-gapcol h4 .sq{width:7px;height:7px;background:var(--molten);flex:none}
.oh-gapli{font-size:13px;line-height:1.45;padding:3px 0 3px 14px;position:relative;color:var(--ink)}
.oh-gapli::before{content:"›";position:absolute;left:0;color:var(--molten);font-weight:700}
.oh-punrow{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.oh-pun{font-family:'Space Mono',monospace;font-size:11px;color:var(--teal);background:var(--paper);border:1px solid var(--line2);padding:3px 8px;border-radius:12px}

/* niche / keyword blocks */
.oh-verdict{display:flex;align-items:center;gap:15px;background:#fff;border:2px solid var(--ink);
  border-radius:4px;padding:15px 17px;box-shadow:3px 3px 0 var(--paper2);flex-wrap:wrap}
.oh-vbadge{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;padding:7px 13px;border-radius:3px;border:2px solid var(--ink);white-space:nowrap}
.v-Go{background:var(--green);color:#fff;border-color:#1f5c41}
.v-Refine{background:var(--molten);color:#fff;border-color:var(--molten-d)}
.v-Skip{background:#fff;color:var(--ink)}
.oh-vsum{font-size:14px;line-height:1.5;flex:1;min-width:220px}
.oh-block{background:#fff;border:1px solid var(--line2);border-radius:4px;padding:15px 17px;margin-top:13px}
.oh-block h3{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;margin:0 0 10px;display:flex;align-items:center;gap:8px}
.oh-block h3 .sq{width:9px;height:9px;background:var(--teal);flex:none}
.oh-li{display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:14px;line-height:1.45}
.oh-li:last-child{border-bottom:none}
.oh-li .ix{font-family:'Space Mono',monospace;font-size:11px;color:var(--molten-d);flex:none;padding-top:1px}
.oh-sources{font-family:'Space Mono',monospace;font-size:11px;color:var(--ink2);margin-top:6px;line-height:1.6}
.oh-sources a{color:var(--teal-d)}
.oh-taglist{display:flex;flex-wrap:wrap;gap:7px}
.oh-tagb{font-family:'Space Mono',monospace;font-size:11.5px;background:var(--paper2);border:1px solid var(--line2);padding:5px 9px;border-radius:3px}
.oh-kw{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);flex-wrap:wrap}
.oh-kw:last-child{border-bottom:none}
.oh-kw .term{font-weight:600;font-size:14px;flex:1;min-width:140px}
.oh-kw .comp{font-family:'Space Mono',monospace;font-size:11px;padding:3px 8px;border-radius:12px;border:1px solid var(--line2)}

/* states */
.oh-load{display:flex;align-items:center;gap:12px;color:var(--ink2);font-size:13.5px;padding:20px 4px}
.oh-spin{width:18px;height:18px;border:2px solid var(--line2);border-top-color:var(--molten);border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.oh-err{background:#fff;border:1px solid var(--molten);border-left:4px solid var(--molten);border-radius:3px;padding:12px 14px;font-size:13px;color:var(--ink);margin-top:16px;line-height:1.5}
.oh-foot{margin-top:28px;font-family:'Space Mono',monospace;font-size:10.5px;color:var(--ink2);text-align:center;line-height:1.7}
@media (max-width:560px){.oh-title{font-size:23px}.oh-item{flex-direction:row}}
`;

const SEEDS = {
  opp: ["articulated dragon", "dice tower", "cable management", "switch game holder", "desk plant pot"],
  niche: ["3D printed dice tower", "cable management 3D print", "articulated fidget toys"],
  keyword: ["dice tower", "headphone stand", "controller holder"],
};

const MODEL = "claude-sonnet-4-6";

async function callClaude(prompt, useSearch) {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  };
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("The analysis engine didn't respond. Try again in a moment.");
  const data = await res.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

function parseJSON(text) {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error("Couldn't read the analysis — try again.");
  return JSON.parse(text.slice(a, b + 1));
}

function LayerBar({ score }) {
  const N = 12;
  const on = Math.round((score / 100) * N);
  return (
    <div className="oh-layers" aria-label={`Opportunity ${score} of 100`}>
      {Array.from({ length: N }).map((_, i) => (
        <div key={i} className={"oh-layer" + (i < on ? " on" : "")} />
      ))}
    </div>
  );
}

function num(n) {
  if (n == null) return "—";
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

export default function Overhang() {
  const [tab, setTab] = useState("opp");
  const [backendUrl, setBackendUrl] = useState("http://localhost:5000");
  const [conn, setConn] = useState("idle"); // idle | ok | nokey | fail

  // opportunities
  const [oppKw, setOppKw] = useState("articulated dragon");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [oppOut, setOppOut] = useState(null);
  const [gaps, setGaps] = useState({}); // listing_id -> analysis
  const [gapLoading, setGapLoading] = useState({});

  // niche / keyword
  const [nicheIn, setNicheIn] = useState("3D printed dice tower");
  const [nicheOut, setNicheOut] = useState(null);
  const [kwIn, setKwIn] = useState("dice tower");
  const [kwOut, setKwOut] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function checkConn() {
    setErr("");
    try {
      const r = await fetch(`${backendUrl.replace(/\/$/, "")}/health`);
      const j = await r.json();
      setConn(j.has_key ? "ok" : "nokey");
    } catch {
      setConn("fail");
    }
  }

  async function runOpp() {
    if (!oppKw.trim()) return;
    setLoading(true); setErr(""); setOppOut(null); setGaps({});
    try {
      const u = new URL(`${backendUrl.replace(/\/$/, "")}/opportunities`);
      u.searchParams.set("keywords", oppKw);
      u.searchParams.set("limit", "40");
      if (minP) u.searchParams.set("min_price", minP);
      if (maxP) u.searchParams.set("max_price", maxP);
      const r = await fetch(u);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Backend error.");
      setConn("ok");
      setOppOut(j);
    } catch (e) {
      if (e.message.includes("fetch") || e.name === "TypeError")
        setErr("Couldn't reach your backend. Start etsy_backend.py and check the data-source URL above.");
      else setErr(e.message);
    } finally { setLoading(false); }
  }

  async function findGap(item) {
    setGapLoading((g) => ({ ...g, [item.listing_id]: true }));
    try {
      const out = await callClaude(
`You advise a 3D-printing maker (FDM + incoming multi-colour printer, parametric OpenSCAD workflow, brand "beansandstitches" known for punny names) who wants to design an IMPROVED, original version of a proven Etsy product — not copy it.
Here is a selling listing:
Title: "${item.title}"
Price: ${item.price} ${item.currency}
Tags: ${(item.tags || []).join(", ")}
Estimated monthly sales: ${item.est_monthly_sales} (modelled, directional)
Favourites: ${item.favourites ?? "n/a"}
Identify where this product is weak and how to make a genuinely better, original design.
Respond with ONLY JSON, no markdown:
{"demandRead":"1 sentence on why this sells","gaps":[3 likely weaknesses of typical listings like this],"yourAngle":[3 concrete design improvements a 3D-print maker could make],"printNotes":[2 short FDM/material/multicolour tips],"punNames":[3 short punny product-name ideas]}`,
        false);
      setGaps((g) => ({ ...g, [item.listing_id]: parseJSON(out) }));
    } catch (e) {
      setGaps((g) => ({ ...g, [item.listing_id]: { error: e.message } }));
    } finally {
      setGapLoading((g) => ({ ...g, [item.listing_id]: false }));
    }
  }

  async function runNiche() {
    if (!nicheIn.trim()) return;
    setLoading(true); setErr(""); setNicheOut(null);
    try {
      const out = await callClaude(
`Research the Etsy market for this 3D-printed product niche: "${nicheIn}". Use web search to ground your read in current reality (saturation, demand, what's selling, where gaps are). Then judge it for a maker who designs original improved versions.
End your reply with ONLY a JSON object (no markdown):
{"niche":string,"verdict":"Go"|"Refine"|"Skip","summary":"1-2 sentence research-grounded read","findings":[3 specific things your research surfaced],"gaps":[3 underserved angles to design into],"keywords":[5 buyer search phrases],"sources":[2-3 short source labels you used]}`,
        true);
      setNicheOut(parseJSON(out));
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  async function runKw() {
    if (!kwIn.trim()) return;
    setLoading(true); setErr(""); setKwOut(null);
    try {
      const out = await callClaude(
`For a 3D-printing Etsy seller, expand the seed keyword "${kwIn}" into buyer search phrases. Use web search to sanity-check that these are real, current search terms in the 3D-printed-goods space.
End with ONLY JSON (no markdown):
{"seed":string,"keywords":[6 objects: {"term":string,"competition":"Low"|"Medium"|"High","intent":"why a buyer searches this","punAngle":"short punny product-name idea"}]}`,
        true);
      setKwOut(parseJSON(out));
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  const Loading = ({ label }) => (
    <div className="oh-load"><div className="oh-spin" />{label}</div>
  );
  const dotClass = conn === "ok" ? "ok" : conn === "fail" ? "fail" : "";
  const connLabel = { idle: "not checked", ok: "live data connected", nokey: "connected · no API key set", fail: "offline" }[conn];

  return (
    <div className="oh-root">
      <style>{STYLES}</style>
      <div className="oh-wrap">
        <header className="oh-head">
          <div className="oh-mark">
            <div className="oh-logo"><i /><i /><i /></div>
            <div>
              <div className="oh-title">Overhang</div>
              <div className="oh-sub">Find what sells. Design it better.</div>
            </div>
          </div>
          <div className="oh-src">
            <span className={"oh-dot " + dotClass} />
            etsy data: {connLabel}
          </div>
        </header>

        <div className="oh-note">
          <b>Real vs estimated:</b> price, favourites, views, tags and listing age come straight from Etsy's
          official API. <b>Sales &amp; revenue are modelled estimates</b> — Etsy publishes no per-listing sales, so
          every tool (Everbee included) estimates from these same public signals. Use them to rank and compare, then
          design something better than the winners.
        </div>

        <nav className="oh-tabs">
          <button className={"oh-tab" + (tab === "opp" ? " act" : "")} onClick={() => { setTab("opp"); setErr(""); }}>
            Opportunities<small>LIVE ETSY DATA</small>
          </button>
          <button className={"oh-tab" + (tab === "niche" ? " act" : "")} onClick={() => { setTab("niche"); setErr(""); }}>
            Niche check<small>WEB-RESEARCHED</small>
          </button>
          <button className={"oh-tab" + (tab === "keyword" ? " act" : "")} onClick={() => { setTab("keyword"); setErr(""); }}>
            Keyword dig<small>SEARCH PHRASES</small>
          </button>
        </nav>

        {/* ── OPPORTUNITIES ── */}
        {tab === "opp" && (
          <section>
            <div className="oh-card">
              <label className="oh-lab" htmlFor="ds">Data source (your local backend)</label>
              <div className="oh-row" style={{ marginTop: 0 }}>
                <input id="ds" className="oh-input" style={{ flex: 1, minWidth: 200 }} value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)} placeholder="http://localhost:5000" />
                <button className="oh-btn ghost" onClick={checkConn}>Test connection</button>
              </div>

              <div style={{ height: 16 }} />
              <label className="oh-lab" htmlFor="ok">Keyword search</label>
              <input id="ok" className="oh-input" value={oppKw} onChange={(e) => setOppKw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runOpp()} placeholder="e.g. articulated dragon" />
              <div className="oh-row">
                {SEEDS.opp.map((s) => <button key={s} className="oh-chip" onClick={() => setOppKw(s)}>{s}</button>)}
              </div>
              <div className="oh-grid2">
                <div>
                  <label className="oh-lab" htmlFor="mn">Min price</label>
                  <input id="mn" className="oh-input" value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="any" inputMode="decimal" />
                </div>
                <div>
                  <label className="oh-lab" htmlFor="mx">Max price</label>
                  <input id="mx" className="oh-input" value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="any" inputMode="decimal" />
                </div>
              </div>
              <div className="oh-row">
                <button className="oh-btn" onClick={runOpp} disabled={loading}>Scout opportunities</button>
              </div>
            </div>

            {conn === "fail" && (
              <div className="oh-connect">
                <h3>Connect your live Etsy data</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink2)", margin: "0 0 4px", lineHeight: 1.5 }}>
                  Opportunities run on real Etsy listings, which must be fetched by the backend on your machine.
                </p>
                <ul className="oh-steps">
                  <li>Get a free key at <code>etsy.com/developers/register</code> → copy the keystring.</li>
                  <li><code>pip install flask flask-cors requests</code></li>
                  <li><code>export ETSY_API_KEY="your_key"</code> then <code>python etsy_backend.py</code></li>
                  <li>Set the data-source field above to <code>http://localhost:5000</code> and test the connection.</li>
                </ul>
              </div>
            )}

            {loading && <Loading label="Pulling live listings from Etsy…" />}
            {err && <div className="oh-err">{err}</div>}

            {oppOut && !loading && (
              <div className="oh-res">
                <div className="oh-meta">
                  {oppOut.count} listings for "{oppOut.keywords}" · ranked by opportunity · sales = modelled estimate
                </div>
                {oppOut.results.slice(0, 24).map((it) => (
                  <div className="oh-item" key={it.listing_id}>
                    <LayerBar score={it.opportunity_score} />
                    <div className="oh-itemmain">
                      <div className="oh-itemtop">
                        <a className="oh-itemtitle" href={it.url} target="_blank" rel="noopener noreferrer">{it.title}</a>
                        <div className="oh-oppscore">{it.opportunity_score}<small>opp score</small></div>
                      </div>
                      <div className="oh-stats">
                        <span className="oh-stat"><span className="k">price </span><b>{it.price} {it.currency}</b></span>
                        <span className="oh-stat"><span className="k">favs </span><b>{num(it.favourites)}</b></span>
                        {it.views != null && <span className="oh-stat"><span className="k">views </span><b>{num(it.views)}</b></span>}
                        <span className="oh-stat"><span className="k">age </span><b>{it.age_months}mo</b></span>
                        <span className="oh-stat est"><span className="k">est </span><b>~{it.est_monthly_sales}/mo</b></span>
                        <span className="oh-stat est"><span className="k">est rev </span><b>~{num(Math.round(it.est_monthly_revenue))} {it.currency}/mo</b></span>
                      </div>
                      {it.tags?.length > 0 && (
                        <div className="oh-tagrow">
                          {it.tags.slice(0, 8).map((t, i) => <span className="oh-tag" key={i}>{t}</span>)}
                        </div>
                      )}
                      <div className="oh-gapbtn">
                        <button onClick={() => findGap(it)} disabled={gapLoading[it.listing_id]}>
                          {gapLoading[it.listing_id] ? "Analysing…" : gaps[it.listing_id] ? "↻ Re-analyse the gap" : "Find the gap →"}
                        </button>
                      </div>

                      {gaps[it.listing_id] && !gaps[it.listing_id].error && (
                        <div className="oh-gap">
                          <div className="lead">{gaps[it.listing_id].demandRead}</div>
                          <div className="oh-gapcol">
                            <h4><span className="sq" />where it's weak</h4>
                            {gaps[it.listing_id].gaps.map((g, i) => <div className="oh-gapli" key={i}>{g}</div>)}
                          </div>
                          <div className="oh-gapcol">
                            <h4><span className="sq" />your better version</h4>
                            {gaps[it.listing_id].yourAngle.map((g, i) => <div className="oh-gapli" key={i}>{g}</div>)}
                          </div>
                          <div className="oh-gapcol">
                            <h4><span className="sq" />print notes</h4>
                            {gaps[it.listing_id].printNotes.map((g, i) => <div className="oh-gapli" key={i}>{g}</div>)}
                          </div>
                          <div className="oh-punrow">
                            {gaps[it.listing_id].punNames.map((p, i) => <span className="oh-pun" key={i}>{p}</span>)}
                          </div>
                        </div>
                      )}
                      {gaps[it.listing_id]?.error && <div className="oh-err">{gaps[it.listing_id].error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── NICHE ── */}
        {tab === "niche" && (
          <section>
            <div className="oh-card">
              <label className="oh-lab" htmlFor="ni">3D-printed niche or idea</label>
              <input id="ni" className="oh-input" value={nicheIn} onChange={(e) => setNicheIn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runNiche()} placeholder="e.g. cable management 3D print" />
              <div className="oh-row">
                {SEEDS.niche.map((s) => <button key={s} className="oh-chip" onClick={() => setNicheIn(s)}>{s}</button>)}
              </div>
              <div className="oh-row">
                <button className="oh-btn" onClick={runNiche} disabled={loading}>Research this niche</button>
              </div>
            </div>
            {loading && <Loading label="Researching the live market…" />}
            {err && <div className="oh-err">{err}</div>}
            {nicheOut && !loading && (
              <div className="oh-res">
                <div className="oh-verdict">
                  <div className={"oh-vbadge v-" + nicheOut.verdict}>{nicheOut.verdict}</div>
                  <div className="oh-vsum">{nicheOut.summary}</div>
                </div>
                <div className="oh-block">
                  <h3><span className="sq" />what the research surfaced</h3>
                  {nicheOut.findings.map((m, i) => <div className="oh-li" key={i}><span className="ix">{String(i + 1).padStart(2, "0")}</span>{m}</div>)}
                </div>
                <div className="oh-block">
                  <h3><span className="sq" />gaps to design into</h3>
                  {nicheOut.gaps.map((m, i) => <div className="oh-li" key={i}><span className="ix">+</span>{m}</div>)}
                </div>
                <div className="oh-block">
                  <h3><span className="sq" />starter keywords</h3>
                  <div className="oh-taglist">{nicheOut.keywords.map((k, i) => <span className="oh-tagb" key={i}>{k}</span>)}</div>
                  {nicheOut.sources?.length > 0 && (
                    <div className="oh-sources">grounded in: {nicheOut.sources.join(" · ")}</div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── KEYWORD ── */}
        {tab === "keyword" && (
          <section>
            <div className="oh-card">
              <label className="oh-lab" htmlFor="kw">Seed keyword</label>
              <input id="kw" className="oh-input" value={kwIn} onChange={(e) => setKwIn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runKw()} placeholder="e.g. headphone stand" />
              <div className="oh-row">
                {SEEDS.keyword.map((s) => <button key={s} className="oh-chip" onClick={() => setKwIn(s)}>{s}</button>)}
              </div>
              <div className="oh-row">
                <button className="oh-btn" onClick={runKw} disabled={loading}>Dig for phrases</button>
              </div>
            </div>
            {loading && <Loading label="Checking real search terms…" />}
            {err && <div className="oh-err">{err}</div>}
            {kwOut && !loading && (
              <div className="oh-res">
                <div className="oh-block">
                  <h3><span className="sq" />buyer phrases for "{kwOut.seed}"</h3>
                  {kwOut.keywords.map((k, i) => (
                    <div className="oh-kw" key={i}>
                      <span className="term">{k.term}</span>
                      <span className="comp" style={{ color: k.competition === "Low" ? "var(--green)" : k.competition === "High" ? "var(--molten-d)" : "var(--teal-d)" }}>{k.competition} comp</span>
                      <span style={{ fontSize: 12.5, color: "var(--ink2)", flexBasis: "100%" }}>{k.intent}</span>
                      {k.punAngle && <span style={{ fontSize: 12.5, color: "var(--teal-d)", fontStyle: "italic" }}>↳ {k.punAngle}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="oh-foot">
          OVERHANG · real signals from etsy's official api · sales are modelled estimates, not reported figures
        </div>
      </div>
    </div>
  );
}
