# Ocean Park Volleyball Court Availability Scraper - Phase 1

Proof of concept scraper for extracting volleyball court availability data from the Santa Monica ActiveNet reservation portal.

## Files

- **`package.json`** - NPM dependencies (Playwright, date-fns)
- **`selectors.md`** - Complete documentation of CSS selectors and scraping strategy
- **`investigate.js`** - Investigation script to explore the portal in headed mode with manual inspection
- **`poc.js`** - Proof of concept scraper that automatically extracts court data
- **`README.md`** - This file

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browser (Chromium):
   ```bash
   npx playwright install chromium
   ```

## Usage

### Investigation Phase (Recommended First)

Use the investigation script to explore the portal and identify selectors manually:

```bash
HEADLESS=false node investigate.js
```

This will:
- Launch a browser window showing the ActiveNet portal
- Navigate to the landing page
- Search for "Ocean Park"
- Pause at key points so you can inspect the page with browser DevTools
- Help identify all CSS selectors needed for the scraper

**Tips:**
- Press Escape or use DevTools console to continue from `page.pause()`
- Use Firefox/Chrome DevTools to inspect HTML and find selector patterns
- Note any differences from documented selectors

### Proof of Concept Scraper

Run the automated scraper in headless mode:

```bash
node poc.js
```

Or run with browser window for debugging:

```bash
HEADLESS=false node poc.js
```

**Output:**
- Lists all Ocean Park volleyball courts found
- Extracts time slots for the first court
- Shows availability status for each time slot (AVAILABLE/RESERVED/CLOSED)
- Saves results with timestamp

## How It Works

### 1. Court Search & Discovery
1. Navigate to ActiveNet landing page
2. Search for "Ocean Park"
3. Extract all court names from search results
4. Filter for courts starting with "Ocean Park North" or "Ocean Park South"

### 2. Time Slot Extraction
For each court:
1. Click into the court detail page
2. Ensure today's date is selected (or navigate to today)
3. Extract all time slot elements from the page
4. For each slot, determine:
   - **Start time** (parsed from displayed time)
   - **Status** (AVAILABLE, RESERVED, CLOSED, or UNKNOWN)
5. Return to results and process next court

### 3. Status Determination
Availability status is determined by:
- **CSS classes** on the slot element (e.g., `class="available"`, `class="reserved"`)
- **Text content** of status indicator (e.g., "Available", "Reserved", "Closed")
- **Color coding** (inspected via computed styles if needed)

## Selector Documentation

All CSS selectors and XPath expressions are documented in **`selectors.md`**, including:
- Primary selectors (most reliable)
- Fallback selectors (alternative options)
- Example HTML snippets
- Tips for identifying elements
- Status value mappings

## Challenges & Known Issues

### ActiveNet Portal
- ✓ Client-side rendering (React/JavaScript) - requires browser automation
- ✓ Slow page loads - uses `waitForLoadState('networkidle')`
- ✓ Session handling - maintains cookies across requests
- ✓ Dynamic content - all content loaded after navigation

### Selector Volatility
- CSS class names may change with site updates
- Multiple fallback selectors provided to handle changes
- May need updates if portal redesign occurs

### Rate Limiting
- Use reasonable delays between requests
- Currently pauses 1-2 seconds between major actions
- Can be increased if site returns 429 errors

## Extending the Scraper

### To scrape multiple courts:
Change this line in `poc.js`:
```javascript
for (let i = 0; i < Math.min(courtNames.length, 1); i++) {
```
To:
```javascript
for (let i = 0; i < courtNames.length; i++) {
```

### To check multiple dates:
Add date navigation logic:
```javascript
// Navigate to next day
await page.click('[class*="next" i]');
await page.waitForLoadState('networkidle');
const nextDaySlots = await extractTimeSlots(page);
```

### To export data:
The results object is already structured for export. Add:
```javascript
import fs from 'fs';

// After scraping completes:
fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
```

## Debugging

### Enable debug logging:
```bash
DEBUG=true node poc.js
```

### Use Playwright Inspector:
```bash
PWDEBUG=1 node poc.js
```

### Manual inspection in script:
The `page.pause()` method stops execution and opens the Playwright Inspector, allowing you to:
- Inspect page structure with DevTools
- Run commands in the console
- Test selectors before committing them to code

```javascript
// Add to script where needed:
await page.pause();
```

### Common debugging commands in Playwright Inspector console:
```javascript
// Test a selector
document.querySelectorAll('[class*="time-slot"]').length

// Get element text
document.querySelector('.court-name').textContent

// Inspect computed styles
window.getComputedStyle(document.querySelector('.time-slot')).color
```

## Next Steps (Phase 2)

After Phase 1 validation:
1. Create production scraper service
2. Add error handling and retries
3. Implement database storage
4. Add scheduling (run hourly/daily)
5. Create API endpoints
6. Build web dashboard for availability viewing

## Testing Checklist

- [ ] Script runs without errors
- [ ] At least 3 court names extracted from search results
- [ ] At least 3 time slots extracted for first court
- [ ] Time slots show correct status (not all UNKNOWN)
- [ ] Status values match actual page availability
- [ ] Script handles network timeouts gracefully
- [ ] Results output is correct and complete

## Troubleshooting

**Problem: "Download failed: server returned code 403"**
- Solution: Network restrictions on playwright CDN. Run on machine with internet access or pre-download browsers.

**Problem: "Timeout waiting for selector"**
- Solution: Increase timeout values in code or add more debug output to see where script gets stuck.

**Problem: "No courts found"**
- Solution: Run `investigate.js` in headed mode to see actual page structure and verify selectors match.

**Problem: "Time slots show UNKNOWN status"**
- Solution: The status indicator class/text wasn't recognized. Update `getAvailabilityStatus()` function based on what you see in browser.

## Contact

For questions or issues, refer to the investigation results and `selectors.md` documentation.
