#!/usr/bin/env node

/**
 * Proof of Concept Scraper for ActiveNet Volleyball Court Availability
 *
 * Extracts court names and time slot availability from Santa Monica ActiveNet portal.
 *
 * Usage:
 *   HEADLESS=false node poc.js     (With browser window for debugging)
 *   node poc.js                     (Headless mode)
 */

import { chromium } from 'playwright';
import { format } from 'date-fns';

const HEADLESS = process.env.HEADLESS !== 'false';
const BASE_URL = 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing';
const DEBUG = process.env.DEBUG === 'true';

/**
 * Determine availability status from element classes and text
 */
function getAvailabilityStatus(statusText, classList = '') {
  const text = statusText ? statusText.toLowerCase() : '';
  const classes = classList ? classList.toLowerCase() : '';

  if (classes.includes('available') || classes.includes('open') || classes.includes('free') ||
      text.includes('available') || text.includes('open') || text.includes('free')) {
    return 'AVAILABLE';
  }

  if (classes.includes('reserved') || classes.includes('booked') || classes.includes('full') ||
      text.includes('reserved') || text.includes('booked') || text.includes('full')) {
    return 'RESERVED';
  }

  if (classes.includes('closed') || classes.includes('unavailable') ||
      text.includes('closed') || text.includes('unavailable') || text.includes('maintenance')) {
    return 'CLOSED';
  }

  return 'UNKNOWN';
}

/**
 * Parse time slot text to extract start time
 * Handles formats like "8:00 AM", "8:00 AM - 9:00 AM", "08:00", etc.
 */
function parseTimeSlotText(text) {
  if (!text) return null;

  // Format: "8:00 AM - 9:00 AM" or "8:00 AM" or "08:00"
  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2];
    const period = match[3] ? match[3].toUpperCase() : '';

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  return text;
}

/**
 * Extract court names from search results
 */
async function extractCourtNames(page) {
  console.log('Extracting court names from search results...');

  const courtSelectors = [
    '.court-name',
    '[class*="court-name" i]',
    '.facility-name',
    'h3, h4',
  ];

  let courts = [];

  for (const selector of courtSelectors) {
    try {
      courts = await page.$$eval(selector, elements => {
        return elements
          .map(el => el.textContent.trim())
          .filter(text => text.includes('Ocean Park'))
          .filter((value, index, self) => self.indexOf(value) === index); // dedupe
      });

      if (courts.length > 0) {
        console.log(`Found ${courts.length} courts using selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Selector didn't match, try next
    }
  }

  // Fallback: search page text
  if (courts.length === 0) {
    courts = await page.$$eval('body', ([el]) => {
      const text = el.innerText;
      const lines = text.split('\n');
      const found = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if ((trimmed.includes('Ocean Park North') || trimmed.includes('Ocean Park South')) &&
            !found.includes(trimmed)) {
          found.push(trimmed);
        }
      }

      return found;
    });
  }

  return courts;
}

/**
 * Extract time slots for a court detail page
 */
async function extractTimeSlots(page) {
  console.log('  Extracting time slots...');

  const timeSlots = [];

  const slotSelectors = [
    '[class*="time" i][class*="slot" i]',
    '.time-slot',
    '[data-time]',
    '[class*="availability" i]',
  ];

  let slotElements = [];

  for (const selector of slotSelectors) {
    try {
      slotElements = await page.$$(selector);
      if (slotElements.length > 0) {
        console.log(`    Found ${slotElements.length} slots using selector: ${selector}`);
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }

  // Extract data from each slot
  for (let i = 0; i < slotElements.length; i++) {
    try {
      const slot = slotElements[i];

      // Get time text
      let timeText = '';
      try {
        timeText = await slot.$eval('[class*="time" i], time, .start-time, span', el => el.textContent.trim());
      } catch (e) {
        timeText = await slot.evaluate(el => {
          const text = el.textContent.trim();
          // Extract first time pattern
          const match = text.match(/\d{1,2}:\d{2}/);
          return match ? match[0] : text;
        });
      }

      // Get status
      let statusText = '';
      let statusClass = '';
      try {
        statusText = await slot.$eval('[class*="status" i], .status', el => el.textContent.trim());
        statusClass = await slot.$eval('[class*="status" i], .status', el => el.className);
      } catch (e) {
        // Status might be in parent or class
        statusClass = await slot.evaluate(el => el.className);
      }

      const status = getAvailabilityStatus(statusText, statusClass);
      const startTime = parseTimeSlotText(timeText);

      if (startTime && startTime !== timeText) {
        // Successfully parsed time
        timeSlots.push({
          startTime,
          timeDisplay: timeText,
          status,
          statusText: statusText || statusClass,
        });
      }
    } catch (e) {
      if (DEBUG) {
        console.error(`      Error extracting slot ${i}:`, e.message);
      }
    }
  }

  return timeSlots;
}

/**
 * Navigate to a court detail page
 */
async function navigateToCourtDetail(page, courtName) {
  console.log(`  Navigating to court detail page...`);

  try {
    // Try to find and click a link with the court name
    const linkSelectors = [
      `a:has-text("${courtName}")`,
      'a:contains("' + courtName + '")',
      '[class*="court" i] a',
      '.court-card a',
      'a[href*="detail"]',
      'a[href*="browse"]',
    ];

    let clickedLink = false;
    for (const selector of linkSelectors) {
      try {
        const link = await page.$(selector);
        if (link) {
          await link.click();
          clickedLink = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!clickedLink) {
      // Try finding any link containing "Ocean Park"
      const allLinks = await page.$$('a');
      for (const link of allLinks) {
        try {
          const text = await link.textContent();
          if (text.includes('Ocean Park')) {
            await link.click();
            clickedLink = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    if (clickedLink) {
      // Wait for page to load
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);
      return true;
    }
  } catch (e) {
    console.error(`    Error navigating to court detail:`, e.message);
  }

  return false;
}

/**
 * Main scraping function
 */
async function scrape() {
  console.log('Ocean Park Volleyball Court Availability Scraper');
  console.log('===============================================\n');
  console.log(`Headless: ${HEADLESS}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: HEADLESS,
  });

  let results = {
    timestamp: new Date().toISOString(),
    courts: [],
    errors: [],
  };

  try {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);

    // Step 1: Navigate to landing page
    console.log('Step 1: Navigating to ActiveNet portal...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log('✓ Landing page loaded\n');

    // Step 2: Search for "Ocean Park"
    console.log('Step 2: Searching for "Ocean Park"...');

    const searchSelectors = [
      'input[id*="search" i]',
      'input[placeholder*="search" i]',
      'input[type="search"]',
      '[role="searchbox"]',
      'input[id*="keyword"]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.$(selector);
        if (searchInput) {
          console.log(`✓ Found search input: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (searchInput) {
      try {
        await searchInput.fill('Ocean Park');

        // Try to find and click search button
        const buttonSelectors = [
          'button:has-text("Search")',
          'form button[type="submit"]',
          'form button',
        ];

        let buttonClicked = false;
        for (const selector of buttonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              buttonClicked = true;
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (!buttonClicked) {
          // Try pressing Enter
          await searchInput.press('Enter');
        }

        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(1500);
        console.log('✓ Search completed\n');
      } catch (e) {
        console.error('Error during search:', e.message);
        results.errors.push(`Search error: ${e.message}`);
      }
    } else {
      console.warn('⚠ Could not find search input');
      results.errors.push('Search input not found');
    }

    // Step 3: Extract court names
    console.log('Step 3: Extracting court names from results...');
    const courtNames = await extractCourtNames(page);

    if (courtNames.length === 0) {
      console.log('⚠ No courts found in search results');
      results.errors.push('No courts found');
    } else {
      console.log(`✓ Found ${courtNames.length} court(s):`);
      courtNames.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
      });
      console.log();
    }

    // Step 4: For each court, extract availability
    console.log('Step 4: Extracting time slot availability...\n');

    for (let i = 0; i < Math.min(courtNames.length, 1); i++) {
      const courtName = courtNames[i];
      console.log(`Court ${i + 1}: ${courtName}`);

      try {
        // Navigate to court detail
        const navigated = await navigateToCourtDetail(page, courtName);

        if (navigated) {
          // Extract time slots
          const slots = await extractTimeSlots(page);

          if (slots.length >= 3) {
            console.log(`  ✓ Extracted ${slots.length} time slots`);
            results.courts.push({
              name: courtName,
              date: format(new Date(), 'yyyy-MM-dd'),
              timeSlots: slots.slice(0, 10), // First 10 slots
            });
          } else {
            console.log(`  ⚠ Only found ${slots.length} time slots (need at least 3)`);
            if (slots.length > 0) {
              results.courts.push({
                name: courtName,
                date: format(new Date(), 'yyyy-MM-dd'),
                timeSlots: slots,
              });
            }
          }

          // Go back to results
          await page.goBack().catch(() => {});
          await page.waitForLoadState('networkidle').catch(() => {});
        } else {
          console.log(`  ✗ Could not navigate to court detail`);
        }
      } catch (e) {
        console.error(`  ✗ Error processing court: ${e.message}`);
        results.errors.push(`Court ${courtName}: ${e.message}`);
      }

      console.log();
    }

    await context.close();
  } catch (error) {
    console.error('Fatal error:', error);
    results.errors.push(`Fatal: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Output results
  console.log('\n===============================================');
  console.log('RESULTS');
  console.log('===============================================\n');

  if (results.courts.length > 0) {
    console.log(`Courts with availability data: ${results.courts.length}`);

    for (const court of results.courts) {
      console.log(`\nCourt: ${court.name}`);
      console.log(`Date: ${court.date}`);
      console.log(`Time Slots (${court.timeSlots.length}):`);

      for (const slot of court.timeSlots) {
        console.log(`  ${slot.startTime}  →  ${slot.status}`);
      }
    }
  } else {
    console.log('No courts successfully processed');
  }

  if (results.errors.length > 0) {
    console.log('\nErrors encountered:');
    results.errors.forEach(err => {
      console.log(`  - ${err}`);
    });
  }

  console.log(`\nTimestamp: ${results.timestamp}`);

  // Return exit code based on success
  const success = results.courts.length > 0 && results.courts[0].timeSlots.length >= 3;
  process.exit(success ? 0 : 1);
}

// Run the scraper
scrape().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
