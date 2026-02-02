# Ocean Park Volleyball Court Availability

A website that displays reservation status for Santa Monica beach volleyball courts at Ocean Park, making it easier to check availability than navigating the official parks portal.

## Live Site

Once deployed: `https://<your-username>.github.io/OPCourts/`

## Problem

The Santa Monica Recreation portal ([ActiveNet](https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing)) is difficult to navigate when you just want to quickly check if volleyball courts are available for a specific day. This project extracts the relevant information and displays it in a clean, easy-to-use interface.

## Solution

A static website that:
- Shows all Ocean Park volleyball courts (North and South)
- Displays time slot availability for each court
- Allows date selection up to 28 days in advance
- Auto-refreshes data every 12 hours via GitHub Actions
- Hosted free on GitHub Pages

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Actions     │────▶│  courts.json     │────▶│  Static Site    │
│  (every 12 hours)   │     │  (scraped data)  │     │  (React + Vite) │
│                     │     │                  │     │                 │
│  Playwright scraper │     │  Committed to    │     │  GitHub Pages   │
│  headless browser   │     │  repository      │     │  free hosting   │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

### Why This Architecture?

- **ActiveNet uses JavaScript rendering** - Simple HTTP requests don't work; we need a real browser
- **Vercel/Netlify free tiers won't work** - Chromium exceeds their 50MB function size limits and 15s timeouts
- **GitHub Actions is free** - Unlimited minutes for public repos, full browser support
- **Static site is fast** - No server-side processing needed at request time

## Project Structure

```
OPCourts/
├── .github/workflows/
│   ├── scrape.yml          # Runs every 12 hours, scrapes courts, commits data
│   └── deploy.yml          # Deploys frontend to GitHub Pages on push
├── scraper/
│   ├── index.js            # Playwright script to scrape ActiveNet
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main component with date selection
│   │   ├── components/
│   │   │   ├── DatePicker.jsx   # Horizontal scrollable date buttons
│   │   │   ├── CourtCard.jsx    # Court with time slot grid
│   │   │   └── Legend.jsx       # Color legend
│   │   ├── main.jsx
│   │   └── index.css       # Tailwind imports
│   ├── public/data/
│   │   └── courts.json     # Scraped data (auto-updated by GitHub Actions)
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Data Schema

The scraper outputs `courts.json` with this structure:

```json
{
  "lastUpdated": "2026-01-26T10:00:00Z",
  "courts": [
    {
      "id": "ocean-park-north-vb-1",
      "name": "Ocean Park North - VB#1",
      "location": "North",
      "dates": {
        "2026-01-26": {
          "slots": [
            { "time": "8:00 AM", "status": "available" },
            { "time": "9:00 AM", "status": "reserved" },
            { "time": "10:00 AM", "status": "available" }
          ]
        }
      }
    }
  ]
}
```

### Slot Status Values

| Status | Meaning | UI Color |
|--------|---------|----------|
| `available` | Court is free to reserve | Green |
| `reserved` | Court is already booked | Red |
| `unknown` | Could not determine status | Gray |

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Scraper

```bash
cd scraper
npm install
npx playwright install chromium
node index.js
# Outputs to frontend/public/data/courts.json
```

## Deployment

### Initial Setup

1. Create a new GitHub repository
2. Push this code to the repository
3. Go to Settings → Pages → Source: "GitHub Actions"
4. The site will deploy automatically on push to `main`

### How It Works

1. **scrape.yml** runs every 12 hours (or on manual trigger)
   - Launches headless Chromium via Playwright
   - Navigates to ActiveNet, searches "ocean park"
   - Extracts court names and availability
   - Commits updated `courts.json` to the repo

2. **deploy.yml** triggers when frontend changes
   - Builds the Vite/React app
   - Deploys to GitHub Pages

## Current Status

### Completed
- ✅ Frontend UI with date picker and court cards
- ✅ Responsive design with Tailwind CSS
- ✅ Scraper framework with Playwright
- ✅ GitHub Actions workflows
- ✅ Handles "unknown" status gracefully

### Known Limitations
- **Scraper selector refinement needed**: The ActiveNet site structure requires further inspection to reliably extract time slot availability. Currently falls back to placeholder data.
- **No real-time data**: Data is cached, refreshed every 12 hours
- **Ocean Park courts only**: Filtered to "Sand Volleyball - Beach" tagged courts containing "Ocean Park"

## Next Steps

1. **Refine scraper selectors**: Click into a court detail page and identify the exact HTML structure for time slots
2. **Test scraper end-to-end**: Verify it extracts real availability data
3. **Deploy to GitHub**: Push to a public repo and enable GitHub Pages
4. **Monitor**: Check that scheduled scraping works correctly

## Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, date-fns
- **Scraper**: Node.js, Playwright
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages (free)

## Cost

**$0/month** - Everything runs on free tiers:
- GitHub Actions: Unlimited minutes for public repos
- GitHub Pages: 100GB bandwidth, 1GB storage
- No external services required

## Data Source

Data is scraped from the official Santa Monica Recreation portal:
https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing

To make an actual reservation, visit the official portal directly.

## License

MIT
