const { chromium } = require('playwright');
const { format, addDays, parse } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

/**
 * Main scraper function
 */
async function scrapeOceanParkCourts() {
  console.log('🏐 Starting Ocean Park Volleyball Court Scraper...\n');

  const browser = await chromium.launch({
    headless: config.HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(config.TIMEOUT);

    // Step 1: Discover courts
    console.log('📋 Step 1: Discovering courts from search...');
    const courts = await discoverCourts(page);
    console.log(`✅ Found ${courts.length} courts:\n${courts.map(c => `   - ${c.name} (ID: ${c.id})`).join('\n')}\n`);

    if (courts.length === 0) {
      throw new Error('No courts found matching criteria');
    }

    // Step 2: Scrape each court's calendar
    console.log('📅 Step 2: Scraping court calendars...');
    const courtData = [];

    for (const court of courts) {
      console.log(`   Scraping ${court.name}...`);
      const availability = await scrapeCourtCalendar(page, court);
      courtData.push(availability);
    }

    // Step 3: Generate output JSON
    console.log('\n💾 Step 3: Generating output JSON...');
    const output = {
      lastUpdated: new Date().toISOString(),
      courts: courtData
    };

    // Save to file
    const outputPath = path.resolve(__dirname, config.OUTPUT_PATH);
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Data saved to ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Courts scraped: ${courtData.length}`);
    console.log(`   - Total dates: ${config.DAYS_AHEAD}`);
    console.log(`   - Last updated: ${output.lastUpdated}\n`);

    return output;

  } finally {
    await browser.close();
  }
}

/**
 * Discover courts from search results
 */
async function discoverCourts(page) {
  // Navigate to search with Ocean Park keyword
  const searchUrl = `${config.SEARCH_URL}?keyword=${encodeURIComponent(config.SEARCH_KEYWORD)}`;
  console.log(`   Navigating to: ${searchUrl}`);

  await page.goto(searchUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Let JS render

  // Find all court cards
  const courts = await page.evaluate((selectors, patterns, metadataTag) => {
    const results = [];

    // Try multiple selectors
    const cardSelectors = selectors.courtCard.split(',').map(s => s.trim());
    let cards = [];

    for (const selector of cardSelectors) {
      cards = Array.from(document.querySelectorAll(selector));
      if (cards.length > 0) break;
    }

    // If no cards found, try finding links directly
    if (cards.length === 0) {
      const links = Array.from(document.querySelectorAll('a[href*="/detail/"]'));
      cards = links.map(link => link.closest('div, article, section, li')).filter(Boolean);
    }

    console.log(`Found ${cards.length} potential court cards`);

    for (const card of cards) {
      try {
        // Extract court name
        let name = null;
        const nameSelectors = selectors.courtName.split(',').map(s => s.trim());
        for (const selector of nameSelectors) {
          const nameEl = card.querySelector(selector);
          if (nameEl && nameEl.textContent.trim()) {
            name = nameEl.textContent.trim();
            break;
          }
        }

        if (!name) {
          // Try getting name from link text
          const link = card.querySelector('a[href*="/detail/"]');
          if (link) name = link.textContent.trim();
        }

        if (!name) continue;

        // Check if name matches our patterns
        const matchesPattern = patterns.some(pattern => {
          const regex = new RegExp(pattern.source, pattern.flags);
          return regex.test(name);
        });

        if (!matchesPattern) continue;

        // Check if it's Sand Volleyball - Beach
        const typeEl = card.querySelector(selectors.courtType);
        if (typeEl && !typeEl.textContent.includes(metadataTag)) {
          continue;
        }

        // Extract court ID from detail link
        const link = card.querySelector('a[href*="/detail/"]');
        if (!link) continue;

        const href = link.getAttribute('href');
        const idMatch = href.match(/\/detail\/(\d+)/);
        if (!idMatch) continue;

        const id = idMatch[1];

        results.push({ name, id });

      } catch (err) {
        console.error('Error processing card:', err.message);
      }
    }

    return results;
  }, config.SELECTORS, config.COURT_NAME_PATTERNS, config.METADATA_TAG);

  return courts;
}

/**
 * Scrape calendar for a specific court
 */
async function scrapeCourtCalendar(page, court) {
  const detailUrl = `${config.ACTIVE_NET_BASE_URL}/search/detail/${court.id}`;

  await page.goto(detailUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Extract court metadata
  const courtInfo = await page.evaluate((selectors) => {
    const titleEl = document.querySelector(selectors.courtTitle);
    const metadataEl = document.querySelector(selectors.courtMetadata);

    return {
      name: titleEl ? titleEl.textContent.trim() : null,
      metadata: metadataEl ? metadataEl.textContent.trim() : null
    };
  }, config.SELECTORS);

  // Determine location (North or South)
  const location = court.name.includes('North') ? 'North' : court.name.includes('South') ? 'South' : 'Unknown';

  // Generate ID from name
  const id = court.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Scrape calendar data
  const calendarData = await scrapeCalendarDays(page);

  // Convert to dates object format
  const dates = {};
  for (const [dateStr, timeRanges] of Object.entries(calendarData)) {
    dates[dateStr] = {
      slots: convertTimeRangesToSlots(timeRanges)
    };
  }

  return {
    id,
    name: court.name,
    location,
    dates
  };
}

/**
 * Scrape calendar days and extract time ranges
 */
async function scrapeCalendarDays(page) {
  const calendarData = await page.evaluate((selectors) => {
    const data = {};

    // Find calendar container
    let calendar = document.querySelector(selectors.calendar);
    if (!calendar) {
      // Try finding by table or grid
      calendar = document.querySelector('table, [role="grid"], .calendar-grid');
    }

    if (!calendar) {
      console.log('No calendar found');
      return data;
    }

    // Find all day cells
    const dayCells = calendar.querySelectorAll('td, .calendar-day, [class*="day-cell"]');
    console.log(`Found ${dayCells.length} calendar cells`);

    for (const cell of dayCells) {
      try {
        // Extract date from cell
        const dateText = cell.textContent;

        // Look for date pattern (e.g., "Feb 13 2026" or just "13")
        const dateMatch = dateText.match(/(\d{1,2})/);
        if (!dateMatch) continue;

        const day = parseInt(dateMatch[1], 10);
        if (day < 1 || day > 31) continue;

        // Get current month/year from context (we'll fix this in production)
        const now = new Date();
        let testDate = new Date(now.getFullYear(), now.getMonth(), day);

        // If day is less than today's date, it's probably next month
        if (testDate < now) {
          testDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
        }

        const dateKey = testDate.toISOString().split('T')[0];

        // Extract time ranges from cell
        const timeRanges = [];

        // Look for time text (e.g., "8:00 AM - 10:00 AM")
        const timeTexts = cell.querySelectorAll('[class*="time"], .time-range, div, span');

        for (const el of timeTexts) {
          const text = el.textContent.trim();
          // Match time ranges like "8:00 AM - 10:00 AM" or "12:30 PM - 2:00 PM"
          const timeRangePattern = /(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/gi;
          const matches = text.matchAll(timeRangePattern);

          for (const match of matches) {
            timeRanges.push({
              start: match[1].trim(),
              end: match[2].trim()
            });
          }
        }

        // Also check for "X More" tooltips
        const moreLinks = cell.querySelectorAll('a[class*="more"], [class*="more"]');
        for (const link of moreLinks) {
          // Check if there's a tooltip nearby or title attribute
          const title = link.getAttribute('title') || link.getAttribute('data-title');
          if (title) {
            const matches = title.matchAll(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/gi);
            for (const match of matches) {
              timeRanges.push({
                start: match[1].trim(),
                end: match[2].trim()
              });
            }
          }
        }

        if (timeRanges.length > 0) {
          data[dateKey] = timeRanges;
        }

      } catch (err) {
        console.error('Error processing calendar cell:', err.message);
      }
    }

    return data;
  }, config.SELECTORS);

  // Hover over "More" links to reveal tooltips
  try {
    const moreLinks = await page.locator('a:has-text("More"), [class*="more"]').all();

    for (const link of moreLinks) {
      try {
        await link.hover({ timeout: 1000 });
        await page.waitForTimeout(500);

        // Check for tooltip
        const tooltip = await page.locator('.an-portal, [class*="tooltip"]').first();
        if (await tooltip.isVisible({ timeout: 500 })) {
          const tooltipText = await tooltip.textContent();

          // Extract additional time ranges from tooltip
          const matches = tooltipText.matchAll(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/gi);
          // Note: We'd need to associate these with the correct date, which requires more complex logic
        }
      } catch (err) {
        // Tooltip might not exist, continue
      }
    }
  } catch (err) {
    console.log('Could not hover over "More" links:', err.message);
  }

  return calendarData;
}

/**
 * Convert time ranges to hourly slots
 * Time ranges show availability. Gaps between ranges = reserved.
 */
function convertTimeRangesToSlots(timeRanges) {
  if (!timeRanges || timeRanges.length === 0) {
    return [];
  }

  const slots = [];

  // Operating hours for volleyball courts (8 AM - 9 PM)
  const dayStart = 8; // 8 AM
  const dayEnd = 21;  // 9 PM

  // Parse all time ranges
  const availableRanges = timeRanges.map(range => {
    const start = parseTime(range.start);
    const end = parseTime(range.end);
    return { start, end };
  }).filter(r => r.start !== null && r.end !== null);

  // Generate hourly slots
  for (let hour = dayStart; hour < dayEnd; hour++) {
    const slotStart = hour;
    const slotEnd = hour + 1;

    // Check if this hour overlaps with any available range
    const isAvailable = availableRanges.some(range => {
      return slotStart >= range.start && slotEnd <= range.end ||
             slotStart < range.end && slotEnd > range.start;
    });

    // Format time
    const time = formatHour(hour);

    slots.push({
      time,
      status: isAvailable ? 'available' : 'reserved'
    });
  }

  return slots;
}

/**
 * Parse time string to hour number (24-hour format)
 */
function parseTime(timeStr) {
  try {
    // Match patterns like "8:00 AM", "12:30 PM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    // Return hour + minute fraction
    return hour + (minute / 60);

  } catch (err) {
    console.error('Error parsing time:', timeStr, err.message);
    return null;
  }
}

/**
 * Format hour as time string (e.g., 8 -> "8:00 AM")
 */
function formatHour(hour) {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Main entry point
 */
if (require.main === module) {
  scrapeOceanParkCourts()
    .then(() => {
      console.log('✅ Scraping completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Scraping failed:', err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { scrapeOceanParkCourts };
