"""Build the compact aggregate sample shipped as assets/cty-data.js.

Source: NYC Taxi & Limousine Commission (TLC) Trip Record Data, October 2024, yellow + green taxi
trip records (official parquet files) and the official Taxi Zone Lookup table and zone shapefile.
Downloaded into their own empty directory; this script only READS them (run with python3 -I).
No row-level trip ever leaves this script: the output is zone x hour-of-week pickup COUNTS plus a
few per-zone totals and one centroid per zone.

Usage: python3 -I materials/build_sample.py <download_dir> <repo>
"""
import json, struct, sys, os
import pandas as pd

d, repo = sys.argv[1], sys.argv[2]
BOROS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
SVC = {"Yellow Zone": 0, "Boro Zone": 1, "Airports": 2}

zl = pd.read_csv(os.path.join(d, "taxi_zone_lookup.csv"))
zl = zl[zl.Borough.isin(BOROS)].sort_values("LocationID")
ids = [int(i) for i in zl.LocationID]
idx = {z: i for i, z in enumerate(ids)}

# ---- zone centroids from the official shapefile (stdlib parse, NY State Plane feet) ----
def shp_centroids(path):
    out = []
    with open(path, "rb") as f:
        f.seek(100)
        while True:
            h = f.read(8)
            if len(h) < 8:
                break
            n, clen = struct.unpack(">ii", h)
            body = f.read(clen * 2)
            st = struct.unpack("<i", body[:4])[0]
            if st != 5:
                out.append(None); continue
            nparts, npts = struct.unpack("<ii", body[36:44])
            parts = list(struct.unpack("<%di" % nparts, body[44:44 + 4 * nparts]))
            off = 44 + 4 * nparts
            pts = [struct.unpack("<dd", body[off + 16 * k: off + 16 * k + 16]) for k in range(npts)]
            parts.append(npts)
            A = cx = cy = 0.0
            for a, b in zip(parts[:-1], parts[1:]):
                ring = pts[a:b]
                for (x0, y0), (x1, y1) in zip(ring[:-1], ring[1:]):
                    c = x0 * y1 - x1 * y0
                    A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
            A *= 0.5
            out.append((cx / (6 * A), cy / (6 * A)) if A else pts[0])
    return out

import zipfile, tempfile
with zipfile.ZipFile(os.path.join(d, "taxi_zones.zip")) as zf:
    shp = zf.read("taxi_zones/taxi_zones.shp"); dbf = zf.read("taxi_zones/taxi_zones.dbf")
tmp = tempfile.mkdtemp()
open(os.path.join(tmp, "z.shp"), "wb").write(shp)
cents = shp_centroids(os.path.join(tmp, "z.shp"))
# dbf: read LocationID per record (field order from header)
nrec, hlen, rlen = struct.unpack("<IHH", dbf[4:12])
fields, pos = [], 32
while dbf[pos] != 0x0D:
    name = dbf[pos:pos + 11].split(b"\0")[0].decode(); flen = dbf[pos + 16]
    fields.append((name, flen)); pos += 32
loc_of_rec = []
for r in range(nrec):
    rec = dbf[hlen + r * rlen + 1: hlen + (r + 1) * rlen]; o = 0; vals = {}
    for name, flen in fields:
        vals[name] = rec[o:o + flen].decode("latin-1").strip(); o += flen
    loc_of_rec.append(int(float(vals["LocationID"])))
cent = {}
for loc, c in zip(loc_of_rec, cents):
    if c and loc not in cent:
        cent[loc] = c  # a zone split across records keeps its first ring's centroid
xs = [cent[z][0] for z in ids]; ys = [cent[z][1] for z in ids]
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
scale = 1000 / max(x1 - x0, y1 - y0)
qx = [round((x - x0) * scale) for x in xs]; qy = [round((y1 - y) * scale) for y in ys]  # 0..1000, y down

# ---- trips: yellow + green, October 2024, pickups in the five boroughs ----
y = pd.read_parquet(os.path.join(d, "yellow_tripdata_2024-10.parquet"), columns=["tpep_pickup_datetime", "PULocationID"])
g = pd.read_parquet(os.path.join(d, "green_tripdata_2024-10.parquet"), columns=["lpep_pickup_datetime", "PULocationID"])
y.columns = g.columns = ["t", "z"]
y["c"] = "y"; g["c"] = "g"
raw = {"yellow_rows": int(len(y)), "green_rows": int(len(g))}
t = pd.concat([y, g], ignore_index=True)
inmonth = (t.t >= "2024-10-01") & (t.t < "2024-11-01")
raw["dropped_out_of_month"] = int((~inmonth).sum())
t = t[inmonth]
inb = t.z.isin(ids)
raw["dropped_not_in_five_boroughs"] = int((~inb).sum())  # Newark airport, unknown, outside NYC
t = t[inb]
raw["kept"] = int(len(t))
t["how"] = t.t.dt.dayofweek * 24 + t.t.dt.hour
t["i"] = t.z.map(idx)
how = [[0] * 168 for _ in ids]
for (i, h), n in t.groupby(["i", "how"]).size().items():
    how[int(i)][int(h)] = int(n)
w1 = [0] * len(ids)
for i, n in t[t.t < "2024-10-08"].groupby("i").size().items():
    w1[int(i)] = int(n)
yel = [0] * len(ids); grn = [0] * len(ids)
for (i, c), n in t.groupby(["i", "c"]).size().items():
    (yel if c == "y" else grn)[int(i)] = int(n)

data = {
    "meta": {
        "source": "NYC Taxi & Limousine Commission (TLC) Trip Record Data, yellow and green taxi trips, October 2024",
        "url": "https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page",
        "terms": "NYC public data set (NYC Admin. Code 23-502: no registration, licence or use restrictions; source and modifications must be stated). TLC makes no representation as to accuracy.",
        "modified": "Aggregated to pickup counts per taxi zone and hour of week; Newark airport, unknown and outside-NYC zones dropped; no row-level trips.",
        "month": "2024-10", "raw": raw,
    },
    "boros": BOROS,
    "zones": [[z, BOROS.index(b), n, SVC.get(s, 1), qx[k], qy[k]] for k, (z, b, n, s) in enumerate(zip(zl.LocationID, zl.Borough, zl.Zone, zl.service_zone))],
    "w1": w1, "yellow": yel, "green": grn, "how": how,
}
js = "/* NYC TLC October 2024 aggregate (yellow + green pickups per taxi zone and hour of week).\n   Generated by materials/build_sample.py with json.dumps; do not edit by hand. */\n"
js += "(function (root) {\n  var DATA = " + json.dumps(data, separators=(",", ":"), ensure_ascii=True) + ";\n"
js += "  if (typeof module !== \"undefined\" && module.exports) module.exports = DATA; else root.CTY_DATA = DATA;\n})(this);\n"
out = os.path.join(repo, "assets", "cty-data.js")
open(out, "w").write(js)
print("zones", len(ids), "kept trips", raw["kept"], "raw", raw, "bytes", os.path.getsize(out))
