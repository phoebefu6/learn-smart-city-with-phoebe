/* cty-live.js - the sensor-placement engine for learn-smart-city-with-phoebe.
   Data: NYC TLC October 2024 yellow + green pickups per taxi zone and hour of week (assets/cty-data.js,
   real counts, aggregated). Wrenmouth is a CONSTRUCTED transport office; the placement rules, the budget
   and the estimators are the modelled part. Every number a page quotes is printed by this file.
   Python twin: materials/cty_reference.py (must agree to 1e-9 relative over the whole ladder). */
(function (root) {
  "use strict";
  var DATA = (typeof module !== "undefined" && module.exports) ? require("./cty-data.js") : root.CTY_DATA;

  var BOROS = DATA.boros;                 // Manhattan, Brooklyn, Queens, Bronx, Staten Island
  var Z = DATA.zones;                     // [id, boro, name, svc, x, y]
  var N = Z.length;
  var TRUTH = DATA.how.map(function (r) { var s = 0; for (var i = 0; i < r.length; i++) s += r[i]; return s; });
  var W1 = DATA.w1;
  var DEFAULTS = { K: 40, seed: 1017, reps: 400, conf: 0.90, floor: 4 };
  var FAULTS = ["busiestInStrata", "noFpc", "noExpansion"];

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  /* mulberry32: 32-bit seeded generator, mirrored exactly in python */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* draw n of the list without replacement: partial Fisher-Yates on a copy */
  function draw(list, n, r) {
    var a = list.slice();
    for (var i = 0; i < n; i++) {
      var j = i + Math.floor(r() * (a.length - i));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n);
  }
  /* greedy coverage: each next sensor goes to the group with most zones per sensor, N_h / (n_h + 1) */
  function greedy(sizes, start, K) {
    var n = start.slice(), left = K - sum(start);
    while (left > 0) {
      var best = -1, bv = -1;
      for (var h = 0; h < sizes.length; h++) {
        if (n[h] >= sizes[h]) continue;
        var v = sizes[h] / (n[h] + 1);
        if (v > bv + 1e-12) { bv = v; best = h; }
      }
      if (best < 0) break;
      n[best]++; left--;
    }
    return n;
  }
  function zonesOf(b) { var o = []; for (var i = 0; i < N; i++) if (Z[i][1] === b) o.push(i); return o; }
  var BZ = BOROS.map(function (_, b) { return zonesOf(b); });
  /* within a borough: busier half (by first-week recorded pickups) and quieter half */
  /* airports (service zone code 2) are unlike every other zone: a take-all stratum, measured with certainty */
  function tiers(b) {
    var take = BZ[b].filter(function (i) { return Z[i][3] === 2; });
    var ix = BZ[b].filter(function (i) { return Z[i][3] !== 2; }).sort(function (p, q) { return (W1[q] - W1[p]) || (p - q); });
    var h = Math.ceil(ix.length / 2);
    return [ix.slice(0, h).sort(function (p, q) { return p - q; }), ix.slice(h).sort(function (p, q) { return p - q; }), take];
  }
  var TIERS = BOROS.map(function (_, b) { return tiers(b); });

  /* ---------- placement rules ---------- */
  function placeBusiest(K) {
    var ix = []; for (var i = 0; i < N; i++) ix.push(i);
    ix.sort(function (p, q) { return (W1[q] - W1[p]) || (p - q); });
    return { strata: null, picked: ix.slice(0, K).sort(function (p, q) { return p - q; }) };
  }
  function placeSpread(K, r, fault) {
    var alloc = greedy(BZ.map(function (z) { return z.length; }), BOROS.map(function () { return 0; }), K);
    var strata = [], picked = [];
    for (var b = 0; b < BOROS.length; b++) {
      var pick = fault === "busiestInStrata"
        ? BZ[b].slice().sort(function (p, q) { return (W1[q] - W1[p]) || (p - q); }).slice(0, alloc[b])
        : draw(BZ[b], alloc[b], r);
      strata.push({ boro: b, tier: -1, zones: BZ[b], picked: pick });
      picked = picked.concat(pick);
    }
    return { strata: strata, picked: picked.sort(function (p, q) { return p - q; }), alloc: alloc };
  }
  function placeEquity(K, floor, r, fault) {
    var sizes = BZ.map(function (z) { return z.length; });
    var start = sizes.map(function (s) { return Math.min(floor, s); });
    if (sum(start) > K) start = greedy(sizes, sizes.map(function () { return 0; }), K);
    var alloc = greedy(sizes, start, K);
    var strata = [], picked = [];
    for (var b = 0; b < BOROS.length; b++) {
      var T = TIERS[b];
      var nTake = alloc[b] > T[2].length + 1 ? T[2].length : 0;
      if (nTake) { strata.push({ boro: b, tier: 2, zones: T[2], picked: T[2].slice() }); picked = picked.concat(T[2]); }
      if (!nTake && T[2].length) { T = [T[0].concat(T[2]).sort(function (p, q) { return p - q; }), T[1]]; }
      var nt = greedy([T[0].length, T[1].length], [0, 0], alloc[b] - nTake);
      for (var t = 0; t < 2; t++) {
        var pick = fault === "busiestInStrata"
          ? T[t].slice().sort(function (p, q) { return (W1[q] - W1[p]) || (p - q); }).slice(0, nt[t])
          : draw(T[t], nt[t], r);
        strata.push({ boro: b, tier: t, zones: T[t], picked: pick });
        picked = picked.concat(pick);
      }
    }
    return { strata: strata, picked: picked.sort(function (p, q) { return p - q; }), alloc: alloc };
  }

  /* ---------- estimators ---------- */
  /* naive: assume every unmeasured zone looks like the average measured zone */
  function estNaive(picked, pool) {
    var inPool = picked.filter(function (i) { return pool.indexOf(i) >= 0; });
    if (!inPool.length) return null;
    var m = sum(inPool.map(function (i) { return TRUTH[i]; })) / inPool.length;
    return m * pool.length;
  }
  /* stratified expansion estimate and its variance (with finite population correction) for a zone pool */
  function estStrat(strata, pool, fault, z) {
    var est = 0, v = 0, measured = 0, ok = true, varOk = true;
    strata.forEach(function (s) {
      var Nh = s.zones.filter(function (i) { return pool.indexOf(i) >= 0; }).length;
      if (!Nh) return;
      var y = s.picked.filter(function (i) { return pool.indexOf(i) >= 0; }).map(function (i) { return TRUTH[i]; });
      var nh = y.length;
      measured += sum(y);
      if (!nh) { ok = false; return; }
      var mean = sum(y) / nh;
      est += fault === "noExpansion" ? sum(y) : Nh * mean;
      if (nh >= 2) {
        var ss = 0; y.forEach(function (x) { ss += (x - mean) * (x - mean); });
        var s2 = ss / (nh - 1);
        var fpc = fault === "noFpc" ? 1 : (1 - nh / Nh);
        v += Nh * Nh * fpc * s2 / nh;
      } else if (nh < Nh) { varOk = false; }  /* one sensor in a stratum: a point, but no spread to measure */
    });
    if (!ok) return { est: null, se: null, lo: null, hi: null, measured: measured };
    if (!varOk) return { est: est, se: null, lo: null, hi: null, measured: measured };
    var se = Math.sqrt(v);
    return { est: est, se: se, lo: Math.max(measured, est - z * se), hi: est + z * se, measured: measured };
  }
  function zq(conf) { /* two-sided normal quantile for the few confidence levels offered */
    var t = { "0.8": 1.2815515655446004, "0.9": 1.6448536269514722, "0.95": 1.959963984540054, "0.99": 2.5758293035489004 };
    return t[String(conf)];
  }

  var ALL = []; for (var i0 = 0; i0 < N; i0++) ALL.push(i0);
  var OUTER = ALL.filter(function (i) { return Z[i][1] !== 0; });
  function truthOf(pool) { return sum(pool.map(function (i) { return TRUTH[i]; })); }
  var TOTAL = truthOf(ALL);

  function relErr(est, truth) { return est === null ? null : (est - truth) / truth; }

  function score(rule, P, opts, fault) {
    var z = zq(opts.conf);
    var picked = P.picked;
    var measuredTrips = truthOf(picked);
    var out = {
      rule: rule, K: picked.length, picked: picked,
      zonesShare: picked.length / N, tripsShare: measuredTrips / TOTAL, alloc: P.alloc || null
    };
    var pools = { city: ALL, outer: OUTER };
    BOROS.forEach(function (b, k) { pools["b" + k] = BZ[k]; });
    out.est = {};
    Object.keys(pools).forEach(function (key) {
      var pool = pools[key], truth = truthOf(pool);
      var e;
      if (rule === "busiest") { var nv = estNaive(picked, pool); e = { est: nv, se: null, lo: null, hi: null }; }
      else e = estStrat(P.strata, pool, fault, z);
      out.est[key] = { truth: truth, est: e.est, err: relErr(e.est, truth), se: e.se, lo: e.lo, hi: e.hi,
        covers: (e.lo === null) ? null : (truth >= e.lo - 1e-9 && truth <= e.hi + 1e-9),
        sensors: picked.filter(function (i) { return pool.indexOf(i) >= 0; }).length, zones: pool.length };
    });
    out.dark = BOROS.filter(function (_, k) { return out.est["b" + k].sensors === 0; });
    var worst = 0, worstB = null;
    BOROS.forEach(function (b, k) {
      var e = out.est["b" + k].err;
      var a = e === null ? Infinity : Math.abs(e);
      if (a > worst) { worst = a; worstB = b; }
    });
    out.worstBoro = { name: worstB, absErr: worst === Infinity ? null : worst };
    return out;
  }

  function place(rule, opts, r, fault) {
    if (rule === "busiest") return placeBusiest(opts.K);
    if (rule === "spread") return placeSpread(opts.K, r, fault);
    return placeEquity(opts.K, opts.floor, r, fault);
  }

  /* replicate the random rules over many seeds: average absolute error, interval coverage */
  function replicate(rule, opts, fault) {
    var r = rng(opts.seed + 7919);
    var aC = 0, aO = 0, mC = 0, cov = 0, covO = 0, nOk = 0, nOkO = 0, worstB = 0, nE = 0, nW = 0;
    for (var k = 0; k < opts.reps; k++) {
      var s = score(rule, place(rule, opts, r, fault), opts, fault);
      if (s.est.city.est !== null && s.est.outer.est !== null) {
        nE++; aC += Math.abs(s.est.city.err); mC += s.est.city.est; aO += Math.abs(s.est.outer.err);
      }
      if (s.worstBoro.absErr !== null) { nW++; worstB += s.worstBoro.absErr; }
      if (s.est.city.covers !== null) { nOk++; if (s.est.city.covers) cov++; }
      if (s.est.outer.covers !== null) { nOkO++; if (s.est.outer.covers) covO++; }
    }
    return { reps: opts.reps, withEstimate: nE, withInterval: nOk,
      meanAbsErrCity: nE ? aC / nE : null, meanAbsErrOuter: nE ? aO / nE : null,
      meanEstCity: nE ? mC / nE : null, biasCity: nE ? (mC / nE - TOTAL) / TOTAL : null,
      meanWorstBoroErr: nW ? worstB / nW : null,
      coverCity: nOk ? cov / nOk : null, coverOuter: nOkO ? covO / nOkO : null };
  }

  function ladder(o) {
    var opts = {};
    Object.keys(DEFAULTS).forEach(function (k) { opts[k] = (o && o[k] !== undefined && o[k] !== null) ? o[k] : DEFAULTS[k]; });
    var fault = o && o.fault;
    var r = rng(opts.seed);
    var r1 = score("busiest", place("busiest", opts, r, fault), opts, fault);
    var r2 = score("spread", place("spread", opts, r, fault), opts, fault);
    var eqP = place("equity", opts, r, fault);
    var r3 = score("equity", eqP, opts, fault);
    var rungs = [
      { id: 1, name: "Busiest zones (naive)", s: r1, intervals: false },
      { id: 2, name: "Spread across boroughs", s: r2, intervals: false },
      { id: 3, name: "Equity-weighted with a floor", s: r3, intervals: false },
      { id: 4, name: "+ honest uncertainty", s: r3, intervals: true }
    ];
    var res = { opts: opts, total: TOTAL, outerTotal: truthOf(OUTER), rungs: rungs };
    if (opts.reps > 0) {
      res.rep = { spread: replicate("spread", opts, fault), equity: replicate("equity", opts, fault) };
    }
    /* anti-lever: spend the same budget where trips are already recorded, compared with rung 3 */
    res.anti = { busiest: r1, equity: r3,
      tripsShareGain: r1.tripsShare - r3.tripsShare,
      zonesBusiestOuter: r1.est.outer.sensors, zonesEquityOuter: r3.est.outer.sensors,
      outerErrBusiest: r1.est.outer.err, outerErrEquity: r3.est.outer.err };
    /* break button: drop the unsensed zones from the denominator */
    var mOnly = truthOf(r1.picked);
    res.brk = { rule: "busiest", reportedTruth: mOnly, reportedEst: mOnly, reportedErr: 0,
      realTruth: TOTAL, realErr: (mOnly - TOTAL) / TOTAL, zonesDropped: N - r1.K,
      tripsMissing: TOTAL - mOnly };
    return res;
  }

  /* p7: small-cell suppression on zone x time cells from the same sample */
  function suppress(o) {
    var k = (o && o.k) || 5, time = (o && o.time) || "hour", space = (o && o.space) || "zone";
    var cells = {};
    for (var i = 0; i < N; i++) {
      for (var h = 0; h < 168; h++) {
        var c = DATA.how[i][h]; if (!c) continue;
        var tk = time === "hour" ? h : time === "daypart" ? (Math.floor(h / 24) * 4 + Math.floor((h % 24) / 6)) : 0;
        var sk = space === "zone" ? i : Z[i][1];
        var key = sk + ":" + tk;
        cells[key] = (cells[key] || 0) + c;
      }
    }
    var keys = Object.keys(cells), nz = keys.length, small = 0, tripsSmall = 0;
    var byB = BOROS.map(function () { return { cells: 0, small: 0, trips: 0, tripsSmall: 0 }; });
    keys.forEach(function (key) {
      var sk = +key.split(":")[0], b = space === "zone" ? Z[sk][1] : sk, c = cells[key];
      byB[b].cells++; byB[b].trips += c;
      if (c < k) { small++; tripsSmall += c; byB[b].small++; byB[b].tripsSmall += c; }
    });
    return { k: k, time: time, space: space, cells: nz, suppressed: small, cellShare: small / nz,
      tripShare: tripsSmall / TOTAL,
      byBoro: byB.map(function (x, b) { return { boro: BOROS[b], cells: x.cells, suppressed: x.small,
        cellShare: x.cells ? x.small / x.cells : null, tripShare: x.trips ? x.tripsSmall / x.trips : null }; }) };
  }

  /* p3 and a1: what each borough contributes, and who records it */
  function boroughSummary() {
    return BOROS.map(function (b, k) {
      var ix = BZ[k], tr = truthOf(ix), y = sum(ix.map(function (i) { return DATA.yellow[i]; }));
      return { boro: b, zones: ix.length, trips: tr, share: tr / TOTAL, yellowShare: tr ? y / tr : null,
        perZone: tr / ix.length, under100: ix.filter(function (i) { return TRUTH[i] < 100; }).length };
    });
  }

  /* ---------- self-test: every check must FAIL on at least one planted fault ---------- */
  function selfTest(fault) {
    var checks = [];
    function add(name, pass, detail) { checks.push({ name: name, pass: !!pass, detail: detail }); }
    var census = score("equity", placeEquity(N, DEFAULTS.floor, rng(1), fault), { conf: 0.9 }, fault);
    add("census: all zones measured gives the truth exactly", Math.abs(census.est.city.est - TOTAL) < 1e-6, census.est.city.est);
    add("census: interval width is zero (finite population correction)", census.est.city.se < 1e-9, census.est.city.se);
    var rs = replicate("spread", { K: 40, seed: 99, reps: 300, conf: 0.9, floor: 4 }, fault);
    add("unbiased: 300 spread placements average within 6% of the truth", Math.abs(rs.biasCity) < 0.06, rs.biasCity);
    var a = placeEquity(40, 4, rng(5), fault).picked.join(","), b = placeEquity(40, 4, rng(5), fault).picked.join(",");
    add("reproducible: same seed gives the same placement", a === b, null);
    var al = placeEquity(40, 4, rng(5), fault).alloc;
    add("allocation: sums to the budget and respects the floor", sum(al) === 40 && al.every(function (x) { return x >= 4; }), al.join("/"));
    return { pass: checks.every(function (c) { return c.pass; }), checks: checks };
  }

  var api = { DATA: DATA, BOROS: BOROS, ZONES: Z, TRUTH: TRUTH, TOTAL: TOTAL, DEFAULTS: DEFAULTS, FAULTS: FAULTS,
    rng: rng, ladder: ladder, suppress: suppress, boroughSummary: boroughSummary, selfTest: selfTest };
  try { api.selfTestResult = selfTest(); } catch (e) { api.selfTestResult = { pass: false, error: String(e) }; }
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CTY = api;
})(this);
