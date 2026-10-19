"""Python reference for assets/cty-live.js (learn-smart-city-with-phoebe).

An independent re-implementation of the sensor-placement ladder, the p7 suppression grid and the borough
summary, reading the SAME shipped aggregate (assets/cty-data.js). Run it, then compare by VALUE with the
node canon of the shipped engine:

  node materials/cty_canon.js <repo> node.json
  python3 -I materials/cty_reference.py <repo> --compare node.json            # exit 0 = agree
  python3 -I materials/cty_reference.py <repo> --compare node.json --plant 0.001   # must exit 1

Agreement rule: every number equal within 1e-9 relative (1e-9 absolute near zero); every list, string and
boolean identical.
"""
import json, math, os, sys

repo = sys.argv[1]
src = open(os.path.join(repo, "assets", "cty-data.js")).read()
DATA = json.loads(src[src.index("var DATA = ") + len("var DATA = "): src.index(";\n  if (typeof module")])
BOROS = DATA["boros"]; Z = DATA["zones"]; N = len(Z)
TRUTH = [sum(r) for r in DATA["how"]]; W1 = DATA["w1"]
DEFAULTS = {"K": 40, "seed": 1017, "reps": 400, "conf": 0.90, "floor": 4}
M32 = 0xFFFFFFFF


def imul(a, b):
    r = (a * b) & M32
    return r - (1 << 32) if r & 0x80000000 else r


def rng(seed):
    st = [seed & M32]

    def nxt():
        st[0] = (st[0] + 0x6D2B79F5) & M32
        t = st[0]
        t = imul(t ^ (t >> 15), t | 1) & M32
        t = (t ^ ((t + (imul(t ^ (t >> 7), t | 61) & M32)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return nxt


def draw(lst, n, r):
    a = list(lst)
    for i in range(n):
        j = i + math.floor(r() * (len(a) - i))
        a[i], a[j] = a[j], a[i]
    return a[:n]


def greedy(sizes, start, K):
    n = list(start); left = K - sum(start)
    while left > 0:
        best, bv = -1, -1
        for h in range(len(sizes)):
            if n[h] >= sizes[h]:
                continue
            v = sizes[h] / (n[h] + 1)
            if v > bv + 1e-12:
                bv, best = v, h
        if best < 0:
            break
        n[best] += 1; left -= 1
    return n


BZ = [[i for i in range(N) if Z[i][1] == b] for b in range(len(BOROS))]
bykey = lambda i: (-W1[i], i)


def tiers(b):
    take = [i for i in BZ[b] if Z[i][3] == 2]
    ix = sorted([i for i in BZ[b] if Z[i][3] != 2], key=bykey)
    h = math.ceil(len(ix) / 2)
    return [sorted(ix[:h]), sorted(ix[h:]), take]


TIERS = [tiers(b) for b in range(len(BOROS))]


def place_busiest(K):
    return {"strata": None, "picked": sorted(sorted(range(N), key=bykey)[:K]), "alloc": None}


def place_spread(K, r, fault=None):
    alloc = greedy([len(z) for z in BZ], [0] * len(BOROS), K)
    strata, picked = [], []
    for b in range(len(BOROS)):
        pick = sorted(BZ[b], key=bykey)[:alloc[b]] if fault == "busiestInStrata" else draw(BZ[b], alloc[b], r)
        strata.append({"zones": BZ[b], "picked": pick}); picked += pick
    return {"strata": strata, "picked": sorted(picked), "alloc": alloc}


def place_equity(K, floor, r, fault=None):
    sizes = [len(z) for z in BZ]
    start = [min(floor, s) for s in sizes]
    if sum(start) > K:
        start = greedy(sizes, [0] * len(sizes), K)
    alloc = greedy(sizes, start, K)
    strata, picked = [], []
    for b in range(len(BOROS)):
        T = TIERS[b]
        ntake = len(T[2]) if alloc[b] > len(T[2]) + 1 else 0
        if ntake:
            strata.append({"zones": T[2], "picked": list(T[2])}); picked += T[2]
        if not ntake and T[2]:
            T = [sorted(T[0] + T[2]), T[1]]
        nt = greedy([len(T[0]), len(T[1])], [0, 0], alloc[b] - ntake)
        for t in range(2):
            pick = sorted(T[t], key=bykey)[:nt[t]] if fault == "busiestInStrata" else draw(T[t], nt[t], r)
            strata.append({"zones": T[t], "picked": pick}); picked += pick
    return {"strata": strata, "picked": sorted(picked), "alloc": alloc}


def est_naive(picked, pool):
    ps = set(pool); inp = [i for i in picked if i in ps]
    if not inp:
        return None
    return sum(TRUTH[i] for i in inp) / len(inp) * len(pool)


def est_strat(strata, pool, fault, z):
    ps = set(pool); est = v = measured = 0.0; ok = var_ok = True
    for s in strata:
        Nh = len([i for i in s["zones"] if i in ps])
        if not Nh:
            continue
        y = [TRUTH[i] for i in s["picked"] if i in ps]; nh = len(y)
        measured += sum(y)
        if not nh:
            ok = False; continue
        mean = sum(y) / nh
        est += sum(y) if fault == "noExpansion" else Nh * mean
        if nh >= 2:
            ss = sum((x - mean) ** 2 for x in y)
            fpc = 1 if fault == "noFpc" else (1 - nh / Nh)
            v += Nh * Nh * fpc * (ss / (nh - 1)) / nh
        elif nh < Nh:
            var_ok = False
    if not ok:
        return dict(est=None, se=None, lo=None, hi=None)
    if not var_ok:
        return dict(est=est, se=None, lo=None, hi=None)
    se = math.sqrt(v)
    return dict(est=est, se=se, lo=max(measured, est - z * se), hi=est + z * se)


ZQ = {0.8: 1.2815515655446004, 0.9: 1.6448536269514722, 0.95: 1.959963984540054, 0.99: 2.5758293035489004}
ALL = list(range(N)); OUTER = [i for i in ALL if Z[i][1] != 0]
truth_of = lambda pool: sum(TRUTH[i] for i in pool)
TOTAL = truth_of(ALL)


def score(rule, P, opts, fault=None):
    z = ZQ[opts["conf"]]; picked = P["picked"]
    out = {"K": len(picked), "zonesShare": len(picked) / N, "tripsShare": truth_of(picked) / TOTAL,
           "picked": picked, "alloc": P["alloc"], "est": {}}
    pools = {"city": ALL, "outer": OUTER}
    for k in range(len(BOROS)):
        pools["b%d" % k] = BZ[k]
    for key, pool in pools.items():
        truth = truth_of(pool)
        e = dict(est=est_naive(picked, pool), se=None, lo=None, hi=None) if rule == "busiest" else est_strat(P["strata"], pool, fault, z)
        ps = set(pool)
        out["est"][key] = {"truth": truth, "est": e["est"], "err": None if e["est"] is None else (e["est"] - truth) / truth,
                           "se": e["se"], "lo": e["lo"], "hi": e["hi"],
                           "covers": None if e["lo"] is None else (e["lo"] - 1e-9 <= truth <= e["hi"] + 1e-9),
                           "sensors": len([i for i in picked if i in ps])}
    out["dark"] = [BOROS[k] for k in range(len(BOROS)) if out["est"]["b%d" % k]["sensors"] == 0]
    worst, wb = 0, None
    for k, b in enumerate(BOROS):
        e = out["est"]["b%d" % k]["err"]; a = math.inf if e is None else abs(e)
        if a > worst:
            worst, wb = a, b
    out["worstBoro"] = {"name": wb, "absErr": None if worst == math.inf else worst}
    return out


def place(rule, opts, r, fault=None):
    if rule == "busiest":
        return place_busiest(opts["K"])
    if rule == "spread":
        return place_spread(opts["K"], r, fault)
    return place_equity(opts["K"], opts["floor"], r, fault)


def replicate(rule, opts, fault=None):
    r = rng(opts["seed"] + 7919)
    aC = aO = mC = worstB = 0.0; cov = covO = nOk = nOkO = nE = nW = 0
    for _ in range(opts["reps"]):
        s = score(rule, place(rule, opts, r, fault), opts, fault)
        c, o = s["est"]["city"], s["est"]["outer"]
        if c["est"] is not None and o["est"] is not None:
            nE += 1; aC += abs(c["err"]); mC += c["est"]; aO += abs(o["err"])
        if s["worstBoro"]["absErr"] is not None:
            nW += 1; worstB += s["worstBoro"]["absErr"]
        if c["covers"] is not None:
            nOk += 1; cov += c["covers"]
        if o["covers"] is not None:
            nOkO += 1; covO += o["covers"]
    return {"reps": opts["reps"], "withEstimate": nE, "withInterval": nOk,
            "meanAbsErrCity": aC / nE if nE else None, "meanAbsErrOuter": aO / nE if nE else None,
            "meanEstCity": mC / nE if nE else None, "biasCity": (mC / nE - TOTAL) / TOTAL if nE else None,
            "meanWorstBoroErr": worstB / nW if nW else None,
            "coverCity": cov / nOk if nOk else None, "coverOuter": covO / nOkO if nOkO else None}


def ladder(o):
    opts = dict(DEFAULTS); opts.update(o)
    r = rng(opts["seed"])
    r1 = score("busiest", place("busiest", opts, r), opts)
    r2 = score("spread", place("spread", opts, r), opts)
    r3 = score("equity", place("equity", opts, r), opts)
    m = truth_of(r1["picked"])
    return {"total": TOTAL, "outerTotal": truth_of(OUTER), "busiest": r1, "spread": r2, "equity": r3,
            "rep": {"spread": replicate("spread", opts), "equity": replicate("equity", opts)} if opts["reps"] > 0 else None,
            "brk": {"rule": "busiest", "reportedTruth": m, "reportedEst": m, "reportedErr": 0, "realTruth": TOTAL,
                    "realErr": (m - TOTAL) / TOTAL, "zonesDropped": N - r1["K"], "tripsMissing": TOTAL - m},
            "anti": {"tripsShareGain": r1["tripsShare"] - r3["tripsShare"], "zonesBusiestOuter": r1["est"]["outer"]["sensors"],
                     "zonesEquityOuter": r3["est"]["outer"]["sensors"], "outerErrBusiest": r1["est"]["outer"]["err"],
                     "outerErrEquity": r3["est"]["outer"]["err"]}}


def suppress(k, time, space):
    cells = {}
    for i in range(N):
        for h in range(168):
            c = DATA["how"][i][h]
            if not c:
                continue
            tk = h if time == "hour" else ((h // 24) * 4 + (h % 24) // 6 if time == "daypart" else 0)
            key = (i if space == "zone" else Z[i][1], tk)
            cells[key] = cells.get(key, 0) + c
    byB = [{"cells": 0, "small": 0, "trips": 0, "ts": 0} for _ in BOROS]
    small = ts = 0
    for (sk, _), c in cells.items():
        b = Z[sk][1] if space == "zone" else sk
        byB[b]["cells"] += 1; byB[b]["trips"] += c
        if c < k:
            small += 1; ts += c; byB[b]["small"] += 1; byB[b]["ts"] += c
    return {"k": k, "time": time, "space": space, "cells": len(cells), "suppressed": small, "cellShare": small / len(cells),
            "tripShare": ts / TOTAL,
            "byBoro": [{"boro": BOROS[b], "cells": x["cells"], "suppressed": x["small"],
                        "cellShare": x["small"] / x["cells"] if x["cells"] else None,
                        "tripShare": x["ts"] / x["trips"] if x["trips"] else None} for b, x in enumerate(byB)]}


def borough_summary():
    out = []
    for k, b in enumerate(BOROS):
        ix = BZ[k]; tr = truth_of(ix); y = sum(DATA["yellow"][i] for i in ix)
        out.append({"boro": b, "zones": len(ix), "trips": tr, "share": tr / TOTAL, "yellowShare": y / tr if tr else None,
                    "perZone": tr / len(ix), "under100": len([i for i in ix if TRUTH[i] < 100])})
    return out


# ---------- compare by value ----------
def walk(a, b, path, bad, counter):
    if isinstance(a, dict):
        for k in a:
            if k not in b:
                bad.append(path + "/" + k + " missing in node"); continue
            walk(a[k], b[k], path + "/" + k, bad, counter)
    elif isinstance(a, list):
        if not isinstance(b, list) or len(a) != len(b):
            bad.append(path + " list length"); return
        for i, (x, y) in enumerate(zip(a, b)):
            walk(x, y, path + "[%d]" % i, bad, counter)
    elif isinstance(a, bool) or a is None or isinstance(a, str):
        counter[0] += 1
        if a != b:
            bad.append("%s: py %r node %r" % (path, a, b))
    else:
        counter[0] += 1
        if not isinstance(b, (int, float)) or isinstance(b, bool):
            bad.append("%s: py %r node %r" % (path, a, b)); return
        d = abs(a - b); rel = d / max(abs(a), abs(b), 1e-300)
        counter[1] = max(counter[1], rel if abs(a) > 1e-9 else d)
        if d > 1e-9 and rel > 1e-9:
            bad.append("%s: py %r node %r" % (path, a, b))


if __name__ == "__main__":
    SETTINGS = {"canon": {}, "K20": {"K": 20}, "K80": {"K": 80}, "floor2": {"floor": 2}, "floor6": {"floor": 6},
                "conf80": {"conf": 0.8, "reps": 400}, "conf95": {"conf": 0.95}, "seed2": {"seed": 2}}
    py = {"boroughs": borough_summary(), "runs": {k: ladder(o) for k, o in SETTINGS.items()},
          "suppress": {"k%d_%s_%s" % (k, t, s): suppress(k, t, s) for k in (3, 5, 10) for t in ("hour", "daypart", "week") for s in ("zone", "borough")}}
    if "--compare" in sys.argv:
        node = json.load(open(sys.argv[sys.argv.index("--compare") + 1]))
        sub = {"boroughs": node["boroughs"], "runs": node["runs"], "suppress": node["suppress"]}
        if "--plant" in sys.argv:  # planted fault: nudge one value; the comparator must catch it
            f = float(sys.argv[sys.argv.index("--plant") + 1])
            sub["runs"]["canon"]["equity"]["est"]["city"]["est"] *= (1 + f)
        bad, counter = [], [0, 0.0]
        walk(py, sub, "", bad, counter)
        print("compared %d values, worst relative difference %.2e, disagreements %d" % (counter[0], counter[1], len(bad)))
        for x in bad[:10]:
            print("  ", x)
        sys.exit(1 if bad else 0)
    else:
        c = py["runs"]["canon"]
        print(json.dumps({k: (c[k]["tripsShare"], c[k]["est"]["city"]["err"], c[k]["est"]["outer"]["err"]) for k in ("busiest", "spread", "equity")}))
