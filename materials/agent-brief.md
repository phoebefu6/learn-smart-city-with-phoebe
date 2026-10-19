# Agent brief - shared by every fan-out page of learn-smart-city-with-phoebe

Filled from `~/.claude/skills/course-builder/references/agent-brief.template.md` on 2026-10-17, plus the
emrg family rule for a5/a6 (`course-estate-audit/briefs/two-track-emrg-overrides.md`) and the course
block (`course-estate-audit/briefs/emrg-2026-10-17-smart-city.md`). Internal build document: never
linked from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

Repo: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-smart-city-with-phoebe`

## Read first, in this order

1. The template page for YOUR track. Copy its structure, classes, SVG grammar and quiz markup
   EXACTLY, including 3 options per question:
   - Leader track (a2-a6): `<repo>/courses/a1-the-city-as-a-data-source.html`
   - Practitioner track (p2-p9): `<repo>/courses/p1-anatomy-of-a-trip-record.html`
   - Pages that use the engine (a2, p3, p5, p7, p9 if they add a live widget): also read
     `<repo>/courses/p10-the-sensor-placement-bench.html` for the widget pattern and `<repo>/assets/cty-live.js`
     for the API: `CTY.ladder(opts)` (opts K, seed, reps, conf, floor; returns `rungs[0..3].s`, `rep`,
     `anti`, `brk`), `CTY.suppress({k, time: "hour"|"daypart"|"week", space: "zone"|"borough"})`,
     `CTY.boroughSummary()`, `CTY.ZONES`, `CTY.TRUTH`, `CTY.selfTestResult`. Load order:
     `../assets/cty-data.js?v=1`, then `../assets/cty-live.js?v=1`, then `../assets/app.js?v=1`.
2. The source map: every verified number, its evidence tier, per-session coverage, the seams, the canon.
   Use ONLY its numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   `<repo>/materials/official-course-map.md`
3. The stylesheet `:root` block for the palette tokens: `<repo>/assets/style.css` (first 30 lines).

## Page skeleton (keep every component, in the order the template page has them)

toolbar (crumb EXACTLY `<a href="../index.html">learn-smart-city-with-phoebe</a> / Leader session N of 6`
or `/ Practitioner session N of 10`, #toggle-all, #zoom-toggle) · masthead (eyebrow
"Learn Smart City Data with Phoebe · Leader session N of 6" or "· Practitioner session N of 10", h1 with
one `<span class="accent">`, .sub naming Wrenmouth as constructed and NYC as the real data source where
used, .chip-row with the level chip from the table below, two .chip.audience, .chip.time "45 min",
.agenda a1-a4 spans flex-weighted) · main.wrap · section#intro (Part 0: kicker, .lede, .legend pills,
.callout.win "★ What you walk out with tonight") · Parts 1-2 as `section.section#part-N` with
section-kicker (klabel "Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, at least ONE
figure, `details.card` accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`), at
least one `.callout.example` with `span.ex-pill` "Real world" on the page · Part 3 build-along
(`.tag.demo "17 min hands on"`, .lede, ONE figure, `.steps > .step > div > h4 + p`, a `.callout.tip`
"The habit to keep") · section#quiz (3 x `.quiz-q data-answer="0-based"`, `p.qtext`, three `button.qopt`
"A · ...", "B · ...", "C · ...", `p.qwhy`; ONE `div.quiz-score` after the last) · section#homework
(`.steps`, 2-3 items) · section#official, h2 "What this session covers", `.covered > .covered-row`
(pill solid ✓ / inkpill ◐ / light ○ + name + note; at least one ○ row linking a seam sibling or naming
what is out of scope) · section#cheatsheet (h2 "Cheat sheet", `.cheat` of eight `.cheat-item`) ·
footer.pagefoot · `<script src="../assets/app.js?v=1">`.

Head: the template's social meta block with this page's own title/description/url (og:image stays
`https://phoebefu6.github.io/learn-smart-city-with-phoebe/assets/og-cover.png`, the main thread
generates it); `<title>Leader session N · <Title> - learn smart city with phoebe</title>` (or
`Practitioner session N · ...`); `<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else
external.

First `details.card` in Part 1 is `open` (the intro's first card too, as in the template); no other.
Sentence case headings. Warm practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<`
`>`. 450 to 650 lines is guidance about depth, never a target.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches". State the norm directly.
  "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map (sections 2, 4 and 7) or is printed by a widget at the reader's
  settings with "your numbers will differ". Constructed Wrenmouth numbers say "constructed".
- Contested or missing evidence: teach the disagreement (congestion pricing effects, pilot results,
  surveillance trade-offs, whether k-anonymity is enough). Never resolve it, never give a figure from
  any city's scheme.
- Citations in the exact form of the map's appendix; anything marked reported is "reported".
- NEVER "lottery" or "lotteries"; say the mechanism ("a seeded random draw", "decided by row order").
- Default to the English word; no Chinese terms are needed on these pages.
- Titles, widget ids and class names must not collide with siblings. Prefix EVERYTHING you invent with
  `cty` + page id (`ctya2a` for the first figure of a2, widget ids `ctya2-...`). The `sc`, `av`, `lh`,
  `wk`, `ia`, `ip` prefixes are taken elsewhere in the estate.
- **Course-specific refusals:** no vendor, product, platform, company or brand names (the TLC data
  dictionary names meter providers: say "a provider code"); no named incident, breach, scandal or
  city programme beyond the TLC's own schema fact about the 2025 congestion fee column; no investment,
  procurement or purchasing advice. NYC agencies (TLC, the City's Open Data Law) are sources, not
  vendors: name them. Taxi zone and borough names are public geography: name them.
- **Wrenmouth is constructed** and every page that uses it says so in the masthead .sub or the intro lede
  ("Wrenmouth, a constructed city transport office"). Never Phoebe's own work. When NYC rows appear,
  say "real New York City taxi records, October 2024".
- Park green `#8CC27A` is a FILL ONLY, always under dark ink text; never green text in that hex, never
  white text on it. Green text uses `#2D5A22`.
- Light surfaces only. Never a dark background panel.
- No figure on a page the map lacks: if a number is not in the map, it does not go in a figure.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): `#A8564E` (brick accent, axis captions) · `#6E2F29`
(deep, values) · `#C98A82` (mid) · `#EBCBC6` (soft) · `#FAF0EE` (50-tint fill) · `#241A18` (ink) ·
`#5E5250` (muted) · `#CFC4C1` (faint) · `#EAE2E0` (hairline) · `#8CC27A` (park green, fill only, the ONE
thing the figure is about) · `#EEF6EA` (green tint) · `#2D5A22` (green text) · `#FCFAF9` (paper) ·
`#FBF5F4` (hover) · `#FFFFFF` · universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `cty` + page id + figure letter (`ctya2a`,
  `ctya2b`).
- `<defs>` holds three things with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  `#A8564E` line, opacity .5), an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none, stroke
  `#241A18` 1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none" stroke="#241A18"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`; rects carry a tiny rotation (-4 to 4
  degrees for hand-placed items, under 1 for panels). Fills: white, `#FAF0EE`, the hachure for "the pile"
  or "the data", and `#8CC27A` ONLY for the one thing the figure is about. One doodle anchor per figure
  (a street grid corner, a kerb, a lamp post, a zone outline), simple strokes, never a mascot.
- Text classes (in the figure's own `<style>`): `.PH` 800 12px `#241A18` heading · `.PL` 600 12px
  `#241A18` label · `.PS` 400 11px `#5E5250` · `.PB` 800 11px `#2D5A22` · `.PV` 800 16-20px `#6E2F29`
  value · `.PA` 700 11px `#A8564E` axis caption · `.PN` 400 12px `#5E5250` note. Font
  `Inter, sans-serif`.
- ALL `<text>` outside any filtered group, never below 10.5px.
- Fit (owner: `diagram-kit.md`): max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width
  note under 110 chars; 40px between neighbouring point labels; bottom note 22px below the last row, H
  clears it by 8px. When in doubt, shorten. A path must never cross a label (the gate flags
  `line-through-text`); hand-stacked rects must not overlap.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM (a cab that only records a
  pickup where it was present to be hailed; a sensor budget split across boroughs; a denominator that
  shrinks when unsensed zones are dropped; a cell under k withheld; a worst-five selection regressing on
  re-measurement), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story from the map's facts (the TLC no-accuracy sentence, the cash-tip
blind spot, 47 out-of-month rows, Manhattan's 88.0% of pickups on 69 of 262 zones, Staten Island's 231
pickups, the 311 reporting-bias abstract, four points identifying 95%, the Open Data Law's no-restriction
clause). Wrenmouth stories say "constructed". Every Wrenmouth number is either from the map's canon table
or printed live by the engine. "Not investment or procurement advice" belongs on the landing page and a1
only; do not repeat it elsewhere unless money comes up.

## The two family sessions (emrg rule)

- **a5 "Why the warehouse playbook breaks here"**: one Part per mechanism, each drawn as a before-after
  figure (warehouse row vs city row), never a slogan: (1) the source - a row someone meant vs a row that
  exists only where a cab, sensor or form happened to be (F1, F5); (2) the identity - a customer id vs a
  zone and an hour, and residents who never agreed to be measured but can be singled out from four points
  (F7); (3) the ground truth - a sale is the event vs a pickup is supply meeting demand, so true demand is
  never observed (F5, censored); (4) the feedback loop - a dashboard that refreshes vs sensors placed
  where trips are recorded, which then record more trips there (canon anti-lever); (5) the cost of being
  wrong - a refund vs a borough that goes dark in a budget decision (canon: 3 boroughs dark under the
  busiest rule). Three Parts may group them (1-2, 3, 4-5).
- **a6 "From warehouse to city: the transfer map"**: three columns CARRIES OVER / MUST LEARN / MUST
  UNLEARN, concrete (skill, method, tool class, reading), drawn as a three-column figure plus prose. Close
  with a 90-day self-study ladder, free and official sources only, each marked official or not: TLC Trip
  Record Data page and data dictionary (official, free), Taxi Zone Lookup and shapefile (official), NYC
  Open Data Law, Admin. Code 23-501/23-502 (official), Sweeney 2002 (paper, publisher abstract free),
  de Montjoye et al. 2013 (open access), Barnett et al. 2005 (paper), Boxer et al. 2025 (paper),
  learn-experimentation b8/b9 and learn-iot-data a2 (free sibling sessions). Openshaw 1984 is a reported
  reading: say so. The landing page carries the 3 x 4 "If you come from a data team" block; a6 must agree
  with it.

## Cross-links (absolute URLs, only these are live siblings)

- Sensor missingness and drift: https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/a2-missing-is-never-random.html
- The sensor as source of truth: https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/a1-the-sensor-is-the-source-of-truth.html
- Difference-in-differences: https://phoebefu6.github.io/learn-experimentation-with-phoebe/courses/b9-difference-in-differences.html
- Geo tests and synthetic control: https://phoebefu6.github.io/learn-experimentation-with-phoebe/courses/b8-geo-and-synthetic-control.html
- The causal claim audit: https://phoebefu6.github.io/learn-causal-inference-with-phoebe/courses/a2-the-claim-audit.html
- GDPR scope: https://phoebefu6.github.io/learn-gdpr-with-phoebe/courses/a1-scope.html
- PDPA: https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/courses/a1-why-pdpa-dnc.html
- Tokenisation and k-anonymity limits: https://phoebefu6.github.io/learn-data-access-control-with-phoebe/courses/b5-tokenization.html
- Honest charts: https://phoebefu6.github.io/learn-dataviz-with-phoebe/courses/03-honesty.html
- Confidence intervals: https://phoebefu6.github.io/learn-statistics-with-phoebe/courses/b7-confidence-intervals.html
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Files, titles, difficulty, footer chains

| File | Title (h1 text; one accent span) | Level chip |
|---|---|---|
| a1-the-city-as-a-data-source.html | The city as a data source | 🟢 Foundations |
| a2-where-the-sensors-are-not.html | Where the sensors are not | 🟡 Working depth |
| a3-residents-who-never-consented.html | Residents who never consented | 🟡 Working depth |
| a4-reading-a-smart-city-claim.html | Reading a smart-city claim | 🟠 Advanced |
| a5-why-the-warehouse-playbook-breaks-here.html | Why the warehouse playbook breaks here | 🟠 Advanced |
| a6-from-warehouse-to-city.html | From warehouse to city: the transfer map | 🟠 Advanced |
| p1-anatomy-of-a-trip-record.html | Anatomy of a trip record | 🟢 Foundations |
| p2-zones-joins-and-the-map.html | Zones, joins and the map | 🟢 Foundations |
| p3-demand-you-see-vs-demand-that-exists.html | Demand you see vs demand that exists | 🟡 Working depth |
| p4-where-the-data-is-thin.html | Where the data is thin | 🟡 Working depth |
| p5-placing-sensors-under-a-budget.html | Placing sensors under a budget | 🟡 Working depth |
| p6-before-and-after.html | Before and after | 🟠 Advanced |
| p7-aggregation-and-privacy.html | Aggregation and privacy | 🟠 Advanced |
| p8-publishing-open-data.html | Publishing open data | 🟠 Advanced |
| p9-who-benefits.html | Who benefits | 🟠 Advanced |
| p10-the-sensor-placement-bench.html | The sensor-placement bench | 🔴 Hardest |

Footer: `<p>Leader session N of 6 · learn-smart-city-with-phoebe · by Phoebe Fu</p>` then
`<nav class="pagenav">` with "← Leader session N-1 · <Title>" and "Leader session N+1 · <Title> →"
(a1: "← All sessions"; a6: "All sessions →"; same pattern for p1..p10). Leader chain a1 -> a6,
Practitioner chain p1 -> p10. The last card of each track points onward (a6 `.callout.next` to p1).

## Per-page outlines (one line each; the map's sections 2 and 7 own the facts)

- a2: coverage of trips vs coverage of zones; the canon anti-lever (88.9% of trips, 15.3% of zones, three
  boroughs dark, outer-borough estimate +6,388.6%); F9 311 reporting bias as the same mechanism in
  resident reports; seam to learn-iot-data a2 for missingness mechanics.
- a3: F7 four points identify 95% and the 1/10-power decay; F8 k-anonymity's definition and its stated
  limit; the surveillance trade-off taught as a disagreement; law exists and is linked (gdpr, pdpa), no
  legal advice.
- a4: a five-question claim checklist for smart-city claims; F10 regression to the mean; the canon break
  button (0.0% reported vs -11.1% real, 222 zones dropped); F12 congestion pricing as a disagreement with
  no numbers; seam to causal-inference a2.
- a5, a6: the family rules above.
- p2: the lookup's 265 rows and why 262 are kept (EWR, Unknown, Outside); joining PULocationID to zones;
  F11 MAUP with OUR numbers (zone x hour vs borough x hour suppression); centroid dot map from
  `CTY.ZONES` (x, y on 0..1000).
- p3: censored demand as a mechanism (F5: green cabs barred south of West 110th St and East 96th St;
  yellow share 99.0% Manhattan vs 88.5% Brooklyn); `CTY.boroughSummary()`; never a "true demand" number.
- p4: zones under 100 pickups (Manhattan 6, Brooklyn 2, Queens 11, Bronx 8, Staten Island 20); Staten
  Island's 231 pickups in a month; why a thin cell is noise; seam to iot-data missingness.
- p5: the three placement rules; greedy coverage N_h / (n_h + 1); canon allocations 11/9/11/6/3 and
  11/9/10/6/4; airports as a take-all stratum; a small live allocation toy using `CTY.ladder`.
- p6: before-after as a claim; F10 RTM (select the worst, re-measure, they improve with no treatment);
  F12; frame only, link experimentation b8 and b9 for DiD and synthetic control.
- p7: F7, F8, F11; the canon suppression grid (k 5 zone x hour withholds 41.3% of cells but 0.7% of
  trips; Staten Island 100%, Bronx 80.0% of cells); live widget with `CTY.suppress`; differential privacy
  named in one line as the stronger alternative, not taught.
- p8: F1 provenance sentence, F6 the Open Data Law clause and what a publisher must state (source,
  version, modifications); a publish checklist; the shipped sample itself as the worked example (what we
  dropped and why: 47 out-of-month rows, 13,169 outside-borough pickups).
- p9: who benefits from each placement rule: canon per-borough errors (busiest: Brooklyn, Bronx, Staten
  Island dark; equity: every borough measured, worst-borough error over 400 draws 47.2% vs 120.5% for
  spread); F9; F12 surveillance trade-offs as a disagreement.

## After fan-out (main thread)

Re-run `python3 ~/.claude/skills/course-builder/scripts/pre-publish.py learn-smart-city-with-phoebe --fix-journey`
from inside `~/Documents/claude_work/github_repo` ONLY once all 16 pages exist (the arrays were set by
hand to all 16 filenames on 2026-10-17; TOTAL_SESSIONS is already 16), then gate (expect "34
page-widths"), contrast probe, browser checks.
