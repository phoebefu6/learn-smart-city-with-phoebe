# Official course map - learn-smart-city-with-phoebe

"Smart City Data", by Phoebe Fu. Bucket emrg, two-track: Leader a1-a6, Practitioner p1-p10 (p10 is the
bench). 45 minutes per session. Skeleton approved by Phoebe 2026-10-17. Difficulty d2, audience both.
Internal build document: never linked from an audience page.

Angle: the city as a data problem, never a tech tour or a vendor showcase. A warehouse row is a business
event someone meant; a city row exists only where a sensor, a vehicle or a form happened to be, about
residents who never agreed to be measured.

Running case: **Wrenmouth**, a CONSTRUCTED mid-size city transport office in a fictional city, labelled
constructed on every page. Its methods are practised on REAL public rows: New York City taxi trip records
(NYC is the data source; Wrenmouth is the fictional decision-maker; pages say both plainly). No vendor,
product, platform or company name; no named incident, breach or city scandal; no investment talk. The
landing page and a1 carry "not investment or procurement advice" because sensor budgets are money.

Fast-moving area: re-verify the TLC Trip Record Data page (schema notes, release lag, the 2025
congestion-fee column) before delivery.

---

## 1. Evidence tiers

- **Read at source** - read in the primary document on 2026-10-17 (quote or number checked against it).
- **Reported** - known from a secondary description or a citation we could not open in full. Pages say
  "reported" or teach the concept with no number.
- **Derived** - arithmetic on read-at-source data, shown with its working (every bench number).
- **Constructed** - Wrenmouth's budget, placement rules and decisions. Pages say "constructed".

## 2. Verified facts

### F1. NYC TLC Trip Record Data (read at source)
Source: NYC Taxi & Limousine Commission, "TLC Trip Record Data" web page
(https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page), read 2026-10-17.
- Yellow and green taxi records include pick-up and drop-off dates/times, pick-up and drop-off
  locations, trip distances, itemized fares, rate types, payment types and driver-reported passenger
  counts.
- The data were "collected and provided to the NYC Taxi and Limousine Commission (TLC) by technology
  providers" authorised under the Taxicab and Livery Passenger Enhancement Programs (TPEP / LPEP).
- "The trip data was not created by the TLC, and TLC makes no representations as to the accuracy of
  these data." (quote this sentence; it is the provenance lesson of a1 and p1).
- Files are PARQUET, published monthly with about a two-month delay "to allow time for full vendor
  submissions"; minor schema changes may come.
- Official links used: `https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_2024-10.parquet`,
  `.../green_tripdata_2024-10.parquet`, `https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv`,
  `.../misc/taxi_zones.zip`. Downloaded 2026-10-17 (sha256 recorded in section 7).

### F2. Yellow taxi data dictionary (read at source, dated March 18, 2025)
- `tpep_pickup_datetime` "The date and time when the meter was engaged"; dropoff = disengaged.
- `PULocationID` "TLC Taxi Zone in which the taximeter was engaged"; `DOLocationID` disengaged.
- `trip_distance` "The elapsed trip distance in miles reported by the taximeter."
- `store_and_fwd_flag`: the record "was held in vehicle memory before sending to the vendor ... because
  the vehicle did not have a connection to the server." (Y / N).
- `tip_amount` "automatically populated for credit card tips. Cash tips are not included."
  `total_amount` likewise excludes cash tips. (p1: a column that silently measures card payers only.)
- `payment_type` codes 0 Flex Fare, 1 credit card, 2 cash, 3 no charge, 4 dispute, 5 unknown, 6 voided.
- `VendorID` is a code for the meter technology provider. Pages say "a provider code" and never name a
  provider (the dictionary names four companies; we do not repeat them).
- `cbd_congestion_fee`: "Per-trip charge for MTA's Congestion Relief Zone starting Jan. 5, 2025." Our
  October 2024 month predates it, so the column is absent in our file.

### F3. What the October 2024 files actually contain (derived, our own profile with pandas 2.1.4)
- Yellow rows 3,833,771; green rows 56,147.
- Rows in, yellow + green: 3,889,918; after the month filter 3,889,871 (the p1 ledger).
- 47 rows carry a pickup time outside October 2024 (yellow earliest stamp 2009-01-01 00:35:59, latest
  2024-11-14). Dropped. (p1 teaches: a monthly file is not a clean month.)
- 13,169 rows pick up in zones outside the five boroughs (Newark airport, "Unknown" 264, "Outside of NYC"
  265). Dropped. Kept: **3,876,702** pickups.
- Yellow `store_and_fwd_flag`: N 3,419,966; Y 19,910; null 393,895. Yellow `payment_type`: 1 credit card
  2,854,092; 2 cash 477,350; 0 (Flex Fare code) 393,895; 4 dispute 80,888; 3 no charge 27,546. The
  393,895 nulls and 393,895 zero codes are the SAME ROWS (checked: null flag if and only if payment code 0).
  Zero-distance yellow trips: 81,639.
- The yellow file has 19 columns. The dictionary writes `airport_fee`; the file's column is `Airport_fee`
  (capital A): read the schema, not the PDF. No `cbd_congestion_fee` column in October 2024.
- All of F3 was reproduced by the p1 build-along code (pandas 2.1.4) on 2026-10-17.
- Zones: the lookup has 265 rows: Manhattan 69, Queens 69, Brooklyn 61, Bronx 43, Staten Island 20,
  EWR 1, Unknown 1, plus 265 "Outside of NYC". The five boroughs give **262 zones**, the universe of the
  bench. Zones with zero pickups in the month: Manhattan 2, Staten Island 2.

### F4. Where the recorded trips are (derived from F3; canon, python = node)
| Borough | Zones | Pickups | Share | Yellow share | Per zone | Zones under 100 |
|---|---|---|---|---|---|---|
| Manhattan | 69 | 3,411,386 | 88.0% | 99.0% | 49,440.4 | 6 |
| Brooklyn | 61 | 69,631 | 1.8% | 88.5% | 1,141.5 | 2 |
| Queens | 69 | 382,136 | 9.9% | 96.5% | 5,538.2 | 11 |
| Bronx | 43 | 13,318 | 0.3% | 92.9% | 309.7 | 8 |
| Staten Island | 20 | 231 | 0.0% (0.006%) | 98.7% | 11.6 | 20 |
- Outer boroughs (all but Manhattan): 465,316 pickups on 193 of 262 zones.
- Share of the 262 zones (derived): Manhattan 26.3%, Brooklyn 23.3%, Queens 26.3%, Bronx 16.4%,
  Staten Island 7.6%. Staten Island's pickup share is 0.006%. Queens includes the two airport zones
  (JFK, LaGuardia; service zone "Airports").
- Green cabs wrote 56,147 of the month's rows, yellow 3,833,771 (F3).
- Top zones: JFK Airport 194,145; Upper East Side South 191,016; Midtown Center 177,570; Upper East Side
  North 167,580; ...; LaGuardia Airport 118,732. The 40 busiest zones hold 88.9% of all pickups.
- Taxi zone names and borough names are public geography, not vendors: pages may name them.

### F5. Green taxis exist because yellow pickups concentrate in Manhattan (read at source)
TLC "Green Cab" page: street-hail liveries "may not operate in the Hail Exclusionary Zone, south of West
110th St and East 96th St." The page does not state the policy's purpose; pages say "the rule keeps
green cabs out of the core" and stop there. Censored demand (p3) is taught as a MECHANISM: a pickup is
recorded only where a cab was present to be hailed, so recorded pickups measure supply meeting demand,
not demand. No number about "true demand" exists in our data; pages never invent one.

### F6. Licence and terms (read at source)
- NYC Administrative Code section 23-502(d) (Open Data Law, via nyc-laws.readthedocs.io): public data
  sets "shall be made available without any registration requirement, license requirement or restrictions
  on their use"; the department "may require a third party providing to the public any public data set
  to explicitly identify the source and version of the public data set and a description of any
  modifications made". The widget states source, month and our modifications.
- nyc.gov Terms of Use section VI: materials are provided "AS IS" without warranties including accuracy,
  completeness, currency. Combined with F1's no-representation sentence.
- Section 23-501(g) excludes from "public data set" any portion an agency may withhold under the public
  officers law (the privacy hook for p8; teach as "the law lets agencies hold back", no further claim).

### F7. Re-identification from location traces (read at source, abstract)
de Montjoye, Hidalgo, Verleysen and Blondel (2013), "Unique in the Crowd: The privacy bounds of human
mobility", Scientific Reports 3:1376, doi:10.1038/srep01376 (abstract read via Europe PMC).
- Fifteen months of mobility data for 1.5 million individuals; location specified hourly at the
  resolution of the carrier's antennas.
- "four spatio-temporal points are enough to uniquely identify 95% of the individuals."
- Uniqueness "decays approximately as the 1/10 power of their resolution. Hence, even coarse datasets
  provide little anonymity."
- Pages teach the mechanism with these numbers only. Do NOT quote any "2 points identify over 50%"
  figure (not in the abstract we read). Never tie it to a named city or company release.

### F8. k-anonymity (read at source, abstract)
Sweeney, L. (2002), "k-anonymity: a model for protecting privacy", International Journal of
Uncertainty, Fuzziness and Knowledge-Based Systems 10(5):557-570, doi:10.1142/S0218488502001648.
- Definition: a release provides k-anonymity if each person's information "cannot be distinguished from
  at least k-1 individuals whose information also appears in the release."
- The paper also "examines re-identification attacks that can be realized on releases that adhere to
  k-anonymity unless accompanying policies are respected" (so k-anonymity alone is not a guarantee).
- Our p7 applies the IDEA to aggregate counts as small-cell suppression (a cell with fewer than k trips is
  withheld). Pages must say this is a related practice for published counts, not Sweeney's definition
  applied to person records. learn-data-access-control b5 already calls k-anonymity "not a guarantee";
  we agree.

### F9. Unequal reporting in resident-generated city data (read at source, abstract; plus reported)
- Boxer, Hong, Kontokosta and Neill (2025), "Estimating reporting bias in 311 complaint data", The
  Annals of Applied Statistics 19:1691-1713, doi:10.1214/24-AOAS2003 (abstract read via Crossref): "some
  subpopulations reporting at lower rates than others"; heating and hot water problems in New York City;
  a latent-variable model separating the probability of a problem from the probability of reporting it.
  Methods and the finding's direction only; no numbers.
- Kontokosta and Hong (2021), "Bias in smart city governance: How socio-spatial disparities in 311
  complaint behavior impact the fairness of data-driven decisions", Sustainable Cities and Society 64:
  102503, doi:10.1016/j.scs.2020.102503. **Reported** (abstract not opened; a search summary says it
  studies Kansas City and finds lower-income and minority neighbourhoods less likely to report street
  condition or nuisance issues despite greater need). Pages may say "a study of one US city reports ..."
  with "reported", no numbers.

### F10. Regression to the mean (read at source, abstract)
Barnett, van der Pols and Dobson (2005), "Regression to the mean: what it is and how to deal with it",
International Journal of Epidemiology 34(1):215-220, doi:10.1093/ije/dyh299.
- RTM "can make natural variation in repeated data look like real change"; "unusually large or small
  measurements tend to be followed by measurements that are closer to the mean."
- The effect grows "with increasing measurement error and when follow-up measurements are only examined
  on a sub-sample selected using a baseline value." (p6: picking the worst junctions to fix, then
  measuring them again.)
- "should always be considered as a possible cause of an observed change"; dealt with by design and
  suitable methods.

### F11. The modifiable areal unit problem (reported)
Openshaw, S. (1984), The Modifiable Areal Unit Problem, CATMOG 38, Geo Books, Norwich. **Reported**:
results computed on areal units change with the size and the boundaries of the units. Pages teach it
as a mechanism with OUR numbers (p2, p7: the same trips aggregated to zone x hour vs borough x hour give
different suppression and different stories), never with Openshaw numbers.

### F12. Contested findings (teach the disagreement, no numbers)
- Congestion pricing and road-use charges: evaluations disagree on size, durability and who bears the
  cost; before-after comparisons are vulnerable to regression to the mean, seasonality and concurrent
  changes. No figures from any city's scheme appear on any page. The TLC schema change (F2
  `cbd_congestion_fee`) is the only fact we state about New York's scheme.
- Pilot results ("the pilot cut journey times"): a single-site before-after is a claim, not a finding
  (F10; seam to learn-experimentation for difference-in-differences and synthetic control).
- Surveillance trade-offs (cameras, plate readers, mobility data for planning): safety and planning value
  vs chilling effects and function creep. Present both sides as positions held by reasonable people; no
  named deployment.

## 3. Seams (link, never reteach; we pick this side out loud)

| Sibling | They own | We own |
|---|---|---|
| learn-iot-data | sensor drift, missingness mechanics, time series | WHERE sensors are (placement, coverage, who goes unmeasured) |
| learn-experimentation | A/B tests, difference-in-differences (b9), geo tests and synthetic control (b8) | p6 frames before-after and RTM only, then links out |
| learn-causal-inference | DAGs, identification, the claim audit | a4 links its claim audit; no DAG teaching here |
| learn-gdpr / learn-pdpa-dnc | the law | a3, p7, p8 name that law exists and link; no legal advice |
| learn-data-access-control | access models, masking, tokenisation (b5 covers k-anonymity as not a guarantee) | p7 small-cell suppression on published COUNTS |
| learn-autonomous-driving | AV safety | not taught |
| learn-dataviz | chart craft | maps only as needed (zone centroid dots) |
| learn-statistics | confidence intervals | p10 uses stratified intervals and checks their coverage |

Live sibling URLs (all checked in github_repo and hub, status live, 2026-10-17):
- https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/a2-missing-is-never-random.html
- https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/a1-the-sensor-is-the-source-of-truth.html
- https://phoebefu6.github.io/learn-experimentation-with-phoebe/courses/b9-difference-in-differences.html
- https://phoebefu6.github.io/learn-experimentation-with-phoebe/courses/b8-geo-and-synthetic-control.html
- https://phoebefu6.github.io/learn-causal-inference-with-phoebe/courses/a2-the-claim-audit.html
- https://phoebefu6.github.io/learn-gdpr-with-phoebe/courses/a1-scope.html
- https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/courses/a1-why-pdpa-dnc.html
- https://phoebefu6.github.io/learn-data-access-control-with-phoebe/courses/b5-tokenization.html
- https://phoebefu6.github.io/learn-dataviz-with-phoebe/courses/03-honesty.html
- https://phoebefu6.github.io/learn-statistics-with-phoebe/courses/b7-confidence-intervals.html
- https://phoebefu6.github.io/learn-autonomous-driving-with-phoebe/
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## 4. Per-session coverage

| File | Title | Covers | Widget |
|---|---|---|---|
| a1-the-city-as-a-data-source.html | The city as a data source | F1, F4 headline, F5 mechanism, the warehouse-row contrast, Wrenmouth intro | borough share bars (data) |
| a2-where-the-sensors-are-not.html | Where the sensors are not | F4, F9, canon anti-lever (trips 88.9% vs zones 15.3%) | coverage toggle (engine) |
| a3-residents-who-never-consented.html | Residents who never consented | F7, F8 definition, F12 surveillance disagreement, seam to gdpr/pdpa | none required |
| a4-reading-a-smart-city-claim.html | Reading a smart-city claim | F10, F12, canon break button (0.0% vs -11.1%), claim checklist, seam to causal-inference a2 | claim checklist (static) |
| a5-why-the-warehouse-playbook-breaks-here.html | Why the warehouse playbook breaks here | source, identity, ground truth, feedback loop, cost of being wrong | none required |
| a6-from-warehouse-to-city.html | From warehouse to city: the transfer map | three columns + 90-day ladder | none required |
| p1-anatomy-of-a-trip-record.html | Anatomy of a trip record | F1, F2, F3 (out-of-month rows, nulls, zero distance, cash tips) | field explorer (static) |
| p2-zones-joins-and-the-map.html | Zones, joins and the map | F3 zone lookup (265 rows, 262 kept), F11 MAUP with our numbers, centroid dots | zone dot map (data) |
| p3-demand-you-see-vs-demand-that-exists.html | Demand you see vs demand that exists | F4, F5 censored demand, yellow share by borough | borough table (engine `boroughSummary`) |
| p4-where-the-data-is-thin.html | Where the data is thin | F4 zones under 100, F9, seam to iot-data missingness | none required |
| p5-placing-sensors-under-a-budget.html | Placing sensors under a budget | the three rules, greedy coverage, allocation 11/9/10/6/4 | allocation toy (engine) |
| p6-before-and-after.html | Before and after | F10, F12, frame only, seam to experimentation b8/b9 | none required |
| p7-aggregation-and-privacy.html | Aggregation and privacy | F7, F8, F11, canon suppression grid | suppression toy (engine `suppress`) |
| p8-publishing-open-data.html | Publishing open data | F1 provenance, F6 terms, a publish checklist (source, version, modifications, suppression) | none required |
| p9-who-benefits.html | Who benefits | F9, canon per-borough errors and dark boroughs, F12 trade-offs | none required |
| p10-the-sensor-placement-bench.html | The sensor-placement bench | the whole ladder, anti-lever, break button, coverage over draws | the bench (engine) |

## 5. Not covered (honest list)

- Any vendor, platform, product or company; any named city programme, incident or breach.
- Real "true demand": we only have recorded pickups; demand that never met a cab is unmeasured (F5).
- For-hire vehicle (app-dispatched) trip records: published by TLC, not used (size and scope).
- Zone adjacency (a sensor seeing its neighbours): the shapefile is shipped only as centroids, so
  neighbour coverage is not modelled.
- Drift, calibration and missing-data mechanics of real sensors (learn-iot-data owns them).
- Difference-in-differences and synthetic control estimation (learn-experimentation b8, b9).
- Law: GDPR, PDPA, US state privacy law beyond the one NYC code section in F6; no legal advice.
- Congestion pricing effect sizes for any city (F12: taught as disagreement only).
- Differential privacy beyond one line naming it as the stronger alternative to suppression.

## 6. Bench design (assets/cty-live.js + assets/cty-data.js)

Data: `materials/build_sample.py` (python3 -I) reads the downloaded files and writes `assets/cty-data.js`
with json.dumps: 262 zones [id, borough, name, service-zone code, centroid x, centroid y on 0..1000],
pickups per zone per hour of week (168), first-week pickups (Oct 1-7), yellow and green pickups per zone.
123,178 bytes. No row-level trip.

Truth: the full month's pickups per zone. Wrenmouth (constructed) has a budget of K counting sensors,
each counting every pickup in its zone for the month. The office knows only the FIRST WEEK's recorded
pickups when it places them.
- Rung 1, busiest zones (naive): the K zones with most first-week pickups. Estimate = average measured
  zone x number of zones (city, outer boroughs, each borough). A borough with no sensor is DARK.
- Rung 2, spread across boroughs: greedy coverage, each next sensor to the borough with most zones per
  sensor (N_h / (n_h + 1)); zones drawn at random within a borough (seeded); expansion estimate
  sum N_h x mean_h.
- Rung 3, equity-weighted with a floor: every borough gets at least `floor` sensors (default 4), the
  rest by greedy coverage; within a borough the two airports (service zone "Airports") are a take-all
  stratum when the borough has budget for them plus two; the remaining zones split into a busier half and
  a quieter half by first-week pickups, sensors split between halves by greedy coverage, random draw
  within each. Stratified expansion estimate.
- Rung 4, + honest uncertainty: rung 3's placement with a stratified variance (finite population
  correction), a two-sided normal interval at `conf` (lower end clipped at the trips actually counted),
  and the interval's coverage measured over 400 fresh placements.
- Anti-lever: "place sensors where trips are already recorded" = rung 1 compared with rung 3.
- Break button: "drop the unsensed zones from the denominator": the busiest placement's estimate compared
  with the truth OF THE MEASURED ZONES ONLY; error reads 0.0% by construction.
- p7: `CTY.suppress({k, time: hour|daypart|week, space: zone|borough})`.
- selfTest (5 checks on load): census gives the truth exactly; census interval width 0 (FPC);
  300 spread placements average within 6% of the truth; same seed same placement; allocation sums to the
  budget and respects the floor. Planted faults: busiestInStrata fails 1 (unbiased), noFpc fails 1
  (census width), noExpansion fails 1 (unbiased).
- Defaults: K 40, seed 1017, reps 400, conf 0.90, floor 4. PRNG mulberry32, mirrored in python.

## 7. Canon numbers (node run of the shipped engine = python reference)

Agreement: `node materials/cty_canon.js <repo> out.json` then
`python3 -I materials/cty_reference.py <repo> --compare out.json`: **3,486 values, worst relative
difference 0.00e+00, 0 disagreements (exit 0)**. `--plant 0.001` on one value fails (exit 1). selfTest
passes; all 3 planted faults fail it. Whole ladder with 2 x 400 replicates: 345 ms for all 8 settings in
node (44 ms for the canon ladder). Canon JSON: `materials/cty_canon.json`.
Download sha256: yellow d19fe05a...c2650, green 6e737b7c...edaa, lookup 1a99e105...c8ed, zones zip
f6d71191...df17.

Canon run (K 40 of 262 zones, seed 1017, 90%). City truth 3,876,702; outer truth 465,316.
| Rung | Zones measured | Trips in measured zones | City estimate error | Outer-borough error | Dark boroughs |
|---|---|---|---|---|---|
| 1 busiest | 15.3% | **88.9%** | **+482.2%** (22,570,200) | **+6,388.6%** (2 outer sensors: JFK, LaGuardia) | Brooklyn, Bronx, Staten Island |
| 2 spread (11/9/11/6/3) | 15.3% | 11.8% | -25.6% | -67.8% | none |
| 3 equity floor 4 (11/9/10/6/4) | 15.3% | 20.4% | -17.7% (3,191,512) | +22.0% | none |
| 4 + interval | same placement | | 90% interval 2,744,659 to 3,638,364: MISSES the truth on this draw | outer 396,299 to 739,263 covers | |
Per-borough error, rung 1 / 2 / 3: Manhattan +66.8% / -19.8% / -23.1%; Brooklyn dark / -58.4% / +8.2%;
Queens +2,724.7% / -70.7% / +25.8%; Bronx dark / -34.2% / -12.8%; Staten Island dark / -42.3% / -19.9%.
Rung 3 intervals cover Brooklyn, Queens, Bronx, Staten Island; miss Manhattan.

Over 400 placements (same settings): spread mean absolute error city 21.3%, outer 92.1%, bias +1.2%,
worst-borough error 120.5%, 90% interval coverage city 0.8775, outer 0.295. Equity: city 11.4%, outer
6.3%, bias +0.2%, worst-borough 47.2%, coverage city **0.8175**, outer **0.7675** (a nominal 90% interval
covers about 82% of the time because pickups are so skewed; the honest rung says so).

Busiest rule detail: 38 sensors in Manhattan, 2 in Queens (both on the airport zones, JFK and LaGuardia);
2 of 5 boroughs have any sensor.
Anti-lever (busiest vs equity): trip coverage +68.5 points (88.9% vs 20.4%) while outer-borough sensors
fall from 29 to 2 and the outer-borough error goes from +22.0% to +6,388.6%. The widget prints "worse".
Break button: reported error **0.0%** against the measured zones; real error **-11.1%** against the city
(222 zones and 430,870 pickups dropped from the denominator).

Comparison settings:
- K 20: busiest trips 61.7%, city +708.8%; spread city +33.8%, outer +290.4%; equity city +18.5%, outer
  +17.2%, no interval (floor uses the whole budget, one sensor per half); MAE spread 30.1% / 109.7%, equity
  20.6% / 11.5%; break real -38.3%.
- K 80: busiest trips 97.9%, city +220.7%, outer +632.1%, 2 dark; spread +1.1% / -74.1%; equity -11.3% /
  -1.0%, interval covers; MAE equity 7.7% / 4.6%, coverage 0.8525 / 0.7775; break real -2.1%.
- floor 2: equity city -17.7%, outer +21.5%, no interval (one sensor per half in small boroughs).
- floor 6: equity -19.4% / -6.2%; MAE 12.0% / 6.7%; coverage 0.815 / 0.765.
- conf 80%: coverage 0.72 / 0.705. conf 95%: 0.8775 / 0.805.
- seed 2: spread -24.1% / -75.1%; equity -12.8% / +3.3%, interval covers.

p7 suppression (cells = non-empty zone x time cells; share of cells withheld / share of trips withheld):
| Setting | Cells | Withheld | Cells % | Trips % | Manhattan / Brooklyn / Queens / Bronx / Staten Island cells % |
|---|---|---|---|---|---|
| k 3, zone x hour | 30,898 | 8,685 | 28.1% | 0.3% | 4.8 / 33.0 / 36.7 / 57.6 / 96.3 |
| k 5, zone x hour | 30,898 | 12,772 | 41.3% | 0.7% | 7.4 / 52.1 / 53.3 / 80.0 / 100.0 |
| k 10, zone x hour | 30,898 | 17,132 | 55.4% | 1.4% | 11.7 / 74.2 / 71.8 / 95.8 / 100.0 |
| k 5, zone x daypart | 6,498 | 1,198 | 18.4% | 0.1% | 3.8 / 14.3 / 22.7 / 32.1 / 95.1 |
| k 10, zone x daypart | 6,498 | 2,110 | 32.5% | 0.2% | 5.7 / 30.0 / 41.3 / 57.7 / 100.0 |
| k 5, zone x week | 258 | 10 | 3.9% | 0.0% | 1.5 / 1.6 / 1.4 / 2.3 / 33.3 |
| k 5, borough x hour | 778 | 101 | 13.0% | 0.0% | 0 / 0 / 0 / 0 / 95.3 |
Trips withheld by borough at k 5, zone x hour: Brooklyn 12.9%, Queens 2.3%, Bronx 49.0%, Staten Island
100.0%, Manhattan 0.0%. The lesson: suppression costs almost nothing city-wide and almost everything in
the thinnest boroughs.

Every page quotes ONLY these numbers, or numbers a widget prints at the reader's settings with "your
numbers will differ".

## 8. Citation appendix

1. NYC Taxi & Limousine Commission. TLC Trip Record Data (web page), and Data Dictionary - Yellow Taxi
   Trip Records (March 18, 2025). Read at source.
2. NYC Taxi & Limousine Commission. Yellow and green taxi trip records, October 2024 (parquet); Taxi Zone
   Lookup Table; Taxi Zones shapefile. Downloaded 2026-10-17.
3. NYC Taxi & Limousine Commission. Green Cab (web page). Read at source.
4. New York City Administrative Code, Title 23, Chapter 5, sections 23-501 and 23-502 (Open Data Law).
   Read at source. nyc.gov Terms of Use, section VI. Read at source.
5. de Montjoye, Y.-A., Hidalgo, C. A., Verleysen, M. and Blondel, V. D. (2013). Unique in the Crowd: The
   privacy bounds of human mobility. Scientific Reports 3:1376. doi:10.1038/srep01376. Read at source
   (abstract).
6. Sweeney, L. (2002). k-anonymity: a model for protecting privacy. International Journal of
   Uncertainty, Fuzziness and Knowledge-Based Systems 10(5):557-570. doi:10.1142/S0218488502001648. Read
   at source (abstract).
7. Boxer, K., Hong, B., Kontokosta, C. E. and Neill, D. B. (2025). Estimating reporting bias in 311
   complaint data. The Annals of Applied Statistics 19:1691-1713. doi:10.1214/24-AOAS2003. Read at
   source (abstract).
8. Kontokosta, C. E. and Hong, B. (2021). Bias in smart city governance: How socio-spatial disparities in
   311 complaint behavior impact the fairness of data-driven decisions. Sustainable Cities and Society
   64:102503. doi:10.1016/j.scs.2020.102503. Reported.
9. Barnett, A. G., van der Pols, J. C. and Dobson, A. J. (2005). Regression to the mean: what it is and
   how to deal with it. International Journal of Epidemiology 34(1):215-220. doi:10.1093/ije/dyh299. Read
   at source (abstract).
10. Openshaw, S. (1984). The Modifiable Areal Unit Problem. Concepts and Techniques in Modern Geography
    38. Geo Books, Norwich. Reported.
