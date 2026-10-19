<!-- learn-with-phoebe hub banner -->
> ### 📚 Part of [**Learn with Phoebe**](https://phoebefu6.github.io/learn-with-phoebe/)
> The shelf of 171 free, hands-on courses on AI, data, and the craft around them. **[Browse every course ↗](https://phoebefu6.github.io/learn-with-phoebe/)**
<!-- /learn-with-phoebe hub banner -->

# Learn Smart City Data with Phoebe

City data as a data problem, for data people moving into city, transport and govtech work and the leaders who
fund it. Sixteen 45-minute sessions in two tracks: six leader sessions (no code) and ten practitioner sessions
(hands on), ending in a sensor-placement bench computed in the browser.

- Running case: Wrenmouth, a constructed transport office in a fictional city, labelled constructed on every page.
- Real inputs: NYC Taxi & Limousine Commission trip records for October 2024 (yellow and green), 3,876,702 pickups
  in 262 taxi zones, shipped only as a zone by hour-of-week aggregate (`assets/cty-data.js`), never as trip rows.
  Built by `materials/build_sample.py` from the official TLC files.
- The engine (`assets/cty-live.js`) runs its self-checks on load; a Python reference (`materials/cty_reference.py`)
  reproduces every bench number.

Static site, no build step: open `index.html`. No vendor or product is named and nothing here is procurement advice.

by Phoebe Fu
