# OP Court Availability

Public site showing reservations for the 24 Ocean Park beach volleyball courts (Santa Monica), 2 weeks out.
Live: https://opcourts.vercel.app · Repo: `Lion3334/OPcourts` (public) · Unrelated to the eBay projects in `~/ClaudeCode`.

## Current status (2026-10-03)
- Live and working. Shipped the full redesign this session: sand stat-style court cards over an animated 8-bit Ocean Park beach scene.
- Data: `scraper/index.js` (Node 20, no dependencies) calls the city's ActiveNet REST endpoint once per court for 14 days and writes `frontend/public/data/courts.json` (open ranges per court/date). See `docs/AVAILABILITY_API.md`.
- Automation: `.github/workflows/update-and-deploy.yml` fetches data at 11:00 and 01:00 UTC (4am/6pm PDT; 3am/5pm in winter), and commits `courts.json` if it changed. It no longer builds or deploys: the site moved from GitHub Pages to Vercel in November 2026, and the Pages steps and `retry-failed-update.yml` (which only retried the Pages publish) were removed. Also runs on pushes touching `scraper/` or the workflow. Scheduled runs often start 4–8 hours late; the user is OK with that for now.
- Frontend: React + Vite (`frontend/`), plain CSS. `vite.config.js` sets `base` to `/` on Vercel (it sets `VERCEL` during builds) and `/OPcourts/` everywhere else (a leftover from GitHub Pages; harmless, so local `npm run dev` lives at `/OPcourts/`).
- Vercel: the project's Root Directory is `frontend` (Vite is auto-detected; build `npm run build`, output `dist`). Vercel redeploys on every push to `main`, including the workflow's data commits, which is why those no longer say `[skip ci]` (Vercel skips commits that do). Live at https://opcourts.vercel.app. The old GitHub Pages site (lion3334.github.io/OPcourts) no longer updates; turn it off under the repo's Settings, then Pages.
- Analytics: `@vercel/analytics` (the `<Analytics />` component in `frontend/src/main.jsx`) counts page views and visitors, with no cookies. It only reports once Analytics is switched on in the Vercel dashboard (project, Analytics tab, Enable) and only runs on the deployed site, not local dev.

## UI (locked — every detail chosen by the user; ask before changing)
- Hand-written CSS in `frontend/src/index.css` on the `:root` tokens (sand palette). No Tailwind or daisyUI; never create tailwind.config.js.
- Font: Noto Sans everywhere (Google Fonts link in `frontend/index.html`).
- Header: "OP Court Availability", subtitle "Check availability up to 2 weeks from now", italic "Availability last updated: [date, time]".
- Date picker: native `<input type="date">` in a pill with ◀ ▶ day arrows. Dates past the 14-day window show a "check the city's site" message with a portal link.
- Section headings "North Courts" / "South Courts". Always 3 across; North 16-15 / 14-13-12 / 11-10-9 / 8-7-6 / 5-4-3 / 2-1, South H-G / F-E-D / C-B-A; rows of two centered; all cards on a day share one height.
- Card: small "Available" (green) / "Reserved" label, green check or yellow caution-triangle icon, `#N` number (21px, 18px on phones), reserved times listed (open times never shown; "All day" when fully booked), and a 7am–5pm timeline (raised during reservations; courts open at 8, so 7–8am just reads flat) with 7am/12pm/5pm tick labels.
- Weather box (`WeatherStatus.jsx`, `frontend/src/weather.js`), under the day heading: forecast for the selected day in three blocks, Morn. (7–11am), Noon (11am–3pm), Afternoon (3–7pm), each with high / low, chance of rain and gusts. Data comes from Open-Meteo in the browser (free, no key, 16 days, Pacific time). A block gets a warm tint, top bar and text badge when: Rain = ≥50% chance AND ≥0.1 in; Windy = gusts ≥25 mph; Cold = 9am temp ≤50°F (Morn. block only). The box is hidden if the forecast fails or doesn't cover the day. Thresholds and the location are constants at the top of `weather.js`.
- Reserved time = gaps between the city's open ranges, within that side's hours that day (earliest start to latest end across its courts). South closes at 7pm and North at 9pm, so the closing time isn't counted as a reservation.
- Background (`frontend/src/scene.js`, canvas, scrolls with the page), west to east: ocean and animated surf, sand, sky-blue lifeguard towers (stairs toward the water) in the gaps left of #16 and #2, palms, a narrow running path, a light-gray bike path (white lines, green bike-lane icons, animated walkers/bikers/dog walkers; northbound on the right half, southbound on the left), grass, and Perry's Cafe (vertical "PERRY'S" sign on its left edge, red umbrellas) beside courts #14–#11. Landmarks are positioned from the `[data-court]` cells, so keep that attribute.
- Phones: art pixels are 2px under 1000px wide (4px above); the right strip is at least 44px so the bike icons always show; Perry's peeks in from the right edge.

## Decisions (don't re-litigate)
- Read availability from the city's REST API, not by scraping the web page with a browser.
- Hosted on Vercel (free tier), deploying from `main`. The repo stays public. GitHub Pages was dropped in favor of Vercel.
- 14-day window; data updates twice a day.
- Design workflow: iterate on an HTML mockup artifact (https://claude.ai/artifact/KQBRYBz3GStcd9PvsKVCD8), then port to the real site when the user says "ship it".

## Open items
- On a 390px phone the title wraps onto two lines (offered to shrink it; no answer yet).
- On desktop the tall vertical Perry's sign leaves room for only one row of umbrellas (offered to tighten the sign or switch back to a horizontal sign on wide screens; no answer).
- GitHub Actions warns that its standard actions use deprecated Node 20. Nothing is broken.
- `README.md` still has a placeholder site URL.

## Tried and dropped
- Playwright browser scraper: never produced real data (all slots "unknown"); replaced by the REST endpoint.
- daisyUI 5 + Tailwind 4 (dark, then nord theme): user hated how generic it looked; removed.
- Hourly slot chips, day-button strip date picker, yellow/red two-color reserved scheme, solid-gray and black reserved fills, dark theme: all rejected during review.
- Fonts: Handjet (user: "yuck"), DM Sans/JetBrains Mono. Noto Sans won.
- "Pacific Ocean" / "Park" labels in the scene; towers along the shoreline (moved beside the cards).

## Key context
- The city API is anonymous (no login or key). One request returns up to ~6 weeks for one court. Facility IDs are in `scraper/index.js`.
- Courts are "not reservable online"; booking goes through Santa Monica rec staff. The note saying so was removed from the page at the user's request.
- Headless Chrome won't render narrower than ~500px. To check a real phone width, load the page inside a 390px-wide iframe.
- The user is non-technical. Explain commands in plain English, and confirm before outward-facing steps (pushing, changing repo visibility).
