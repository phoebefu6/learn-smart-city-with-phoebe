// Node canon for learn-smart-city-with-phoebe: loads the SHIPPED engine, runs the whole ladder at the canon
// settings and the comparison settings, the p7 suppression grid, the borough summary and the selfTest faults.
// Usage: node materials/cty_canon.js <repo> <out.json>
// Then:  python3 -I materials/cty_reference.py <repo> --compare <out.json>
const path = require("path"), fs = require("fs");
const repo = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const out = process.argv[3] || "cty_canon.json";
const C = require(path.join(repo, "assets", "cty-live.js"));

function est(e) { return { truth: e.truth, est: e.est, err: e.err, se: e.se, lo: e.lo, hi: e.hi, covers: e.covers, sensors: e.sensors }; }
function rung(s) {
  const o = { K: s.K, zonesShare: s.zonesShare, tripsShare: s.tripsShare, picked: s.picked, alloc: s.alloc, dark: s.dark,
    worstBoro: s.worstBoro, est: {} };
  for (const k of Object.keys(s.est)) o.est[k] = est(s.est[k]);
  return o;
}
function pick(L) {
  return { total: L.total, outerTotal: L.outerTotal, busiest: rung(L.rungs[0].s), spread: rung(L.rungs[1].s), equity: rung(L.rungs[2].s),
    rep: L.rep || null, brk: L.brk,
    anti: { tripsShareGain: L.anti.tripsShareGain, zonesBusiestOuter: L.anti.zonesBusiestOuter, zonesEquityOuter: L.anti.zonesEquityOuter,
      outerErrBusiest: L.anti.outerErrBusiest, outerErrEquity: L.anti.outerErrEquity } };
}
const SETTINGS = {
  canon: {}, K20: { K: 20 }, K80: { K: 80 }, floor2: { floor: 2 }, floor6: { floor: 6 },
  conf80: { conf: 0.8, reps: 400 }, conf95: { conf: 0.95 }, seed2: { seed: 2 }
};
const t0 = Date.now();
const runs = {};
for (const [k, o] of Object.entries(SETTINGS)) runs[k] = pick(C.ladder(o));
const ms = Date.now() - t0;
const supp = {};
for (const k of [3, 5, 10]) for (const time of ["hour", "daypart", "week"]) for (const space of ["zone", "borough"]) {
  supp[`k${k}_${time}_${space}`] = C.suppress({ k, time, space });
}
const st = C.selfTest();
const faults = C.FAULTS.map(f => { const r = C.selfTest(f); return { fault: f, pass: r.pass, failed: r.checks.filter(c => !c.pass).map(c => c.name) }; });
const canon = { generated: new Date().toISOString().slice(0, 10), defaults: C.DEFAULTS, meta: C.DATA.meta, settings: SETTINGS,
  boroughs: C.boroughSummary(), runs, suppress: supp, selfTest: st, faultProofs: faults, ms };
fs.writeFileSync(out, JSON.stringify(canon, null, 1));
const p = x => x === null || x === undefined ? "-" : (x * 100).toFixed(1) + "%";
for (const [k, r] of Object.entries(runs)) {
  console.log(k.padEnd(7), "busiest trips", p(r.busiest.tripsShare), "city", p(r.busiest.est.city.err), "outer", p(r.busiest.est.outer.err), "dark", r.busiest.dark.length,
    "| spread city", p(r.spread.est.city.err), "outer", p(r.spread.est.outer.err),
    "| equity city", p(r.equity.est.city.err), "outer", p(r.equity.est.outer.err), "covers", r.equity.est.city.covers,
    "| MAE spread", p(r.rep.spread.meanAbsErrCity), p(r.rep.spread.meanAbsErrOuter), "equity", p(r.rep.equity.meanAbsErrCity), p(r.rep.equity.meanAbsErrOuter),
    "cov", r.rep.equity.coverCity, r.rep.equity.coverOuter, "| break real", p(r.brk.realErr));
}
for (const k of ["k5_hour_zone", "k10_hour_zone", "k5_daypart_zone", "k5_hour_borough"]) {
  const s = supp[k]; console.log(k, "cells", s.cells, "suppressed", s.suppressed, p(s.cellShare), "trips", p(s.tripShare), s.byBoro.map(b => b.boro.slice(0, 3) + " " + p(b.cellShare)).join(", "));
}
console.log("selfTest", st.pass, "| faults:", faults.map(x => x.fault + "=" + (x.pass ? "PASSED(bad)" : "failed:" + x.failed.length)).join("; "), "| ms", ms);
process.exit(st.pass && faults.every(x => !x.pass) ? 0 : 1);
