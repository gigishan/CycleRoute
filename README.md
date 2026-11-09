# CycleRoute

Mobile-first cycling route planner inspired by the supplied mockups. Plain HTML, CSS and JavaScript with bundled Leaflet; no build step or API key needed for personal use.

**[Open the live CycleRoute app](https://cycleroute-singapore.hazydotterel2.chatgpt.site/)**

The app is privately hosted on Sites and may require sign-in.

## Run locally

With Node.js installed, open this folder in a terminal and run `node server.mjs`, then open http://127.0.0.1:4173. Run checks with `node --test tests/*.test.mjs`.

The hosted HTTPS version is the easiest way to use it on a phone. Browser location requires HTTPS (localhost is also allowed) and permission. Add the hosted page to your home screen using your browser menu. Maps, search and routing require internet access.

## Behaviour

- The map requests current location on entry, falling back to a Singapore overview if unavailable. The start-field target button explicitly selects current location.
- Photon autocomplete is debounced, location-biased, and its returned matching places are sorted by distance. Results depend on OpenStreetMap place names; try an official park/street/entrance name if an informal name is not found.
- Stops can be added, removed, and moved up. Routes follow start → stops in displayed order → destination. Typed but unselected places must be resolved before routing.
- Three candidates are requested sequentially: cycle-route-preferring trekking, fastbike, and a trekking alternative. Best is the candidate with highest distance-weighted cycleway/shared cycling-path coverage; Fastest is the candidate with lowest BRouter estimated time. They may coincide. Neither claims a global optimum over all possible routes.
- Coverage includes `highway=cycleway`, or `highway=path/footway` with bicycle `yes`, `designated`, or `permissive`. Road lanes and roads merely carrying cycle-route relations are excluded. Missing or incorrect tags affect the percentage. Steps and ferries are disabled through profile parameters where supported by that profile.
- GPX 1.1 includes named ordered waypoints and the entire selected track, with elevation where supplied. Changing inputs invalidates previous route results.
- No accounts, payment, tracking, or saved ride history. App data stays in memory; external services receive the requests needed for their function.

## Services and production considerations

Map tiles: https://tile.openstreetmap.org (visible attribution, normal browser caching, no bulk/offline prefetch). Place search: https://photon.komoot.io. Routing: https://brouter.de. These community endpoints have no availability guarantee. For a public production launch, use appropriately provisioned or self-hosted providers and review their policies. This initial version is published privately with Sites.

References: [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md), [BRouter request parameters](https://github.com/abrensch/brouter/blob/master/brouter-server/src/main/java/btools/server/request/ServerHandler.java), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). Leaflet's license is in `dist/vendor/LEAFLET-LICENSE.txt`.

## Project files

`dist/` contains deployable assets. `dist/core.js` contains independently tested route ordering, ranking, coverage and GPX logic. `tests/live-route.json` is a real public Singapore routing response used as a regression fixture. `.openai/hosting.json` holds private Sites deployment identity. No native Android project is required.
