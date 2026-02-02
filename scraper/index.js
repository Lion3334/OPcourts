import { chromium } from 'playwright';
import { format, addDays, parse } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Test with single court ID provided by user
    const testCourts = [
      { name: 'Ocean Park North - VB#10', id: '170' }
    ];

    console.log('📋 Testing with court ID 170 (Ocean Park North - VB#10)\n');

    // Scrape the test court's calendar
    console.log('📅 Scraping court calendar...');
    const courtData = [];

    for (const court of testCourts) {
      console.log(`   Scraping ${court.name}...`);
      const availability = await scrapeCourtCalendar(page, court);
      courtData.push(availability);
    }

    // Generate output JSON
    console.log('\n💾 Generating output JSON...');
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
    console.log(`   - Dates with data: ${Object.keys(courtData[0]?.dates || {}).length}`);
    console.log(`   - Last updated: ${output.lastUpdated}\n`);

    // Print sample data
    if (courtData[0] && Object.keys(courtData[0].dates).length > 0) {
      const firstDate = Object.keys(courtData[0].dates)[0];
      const slots = courtData[0].dates[firstDate].slots;
      console.log(`\n📋 Sample data for ${firstDate}:`);
      console.log(`   ${slots.slice(0, 5).map(s => `${s.time}: ${s.status}`).join(', ')}...`);
    }

    return output;

  } finally {
    await browser.close();
  }
}

/**
 * Scrape calendar for a specific court
 */
async function scrapeCourtCalendar(page, court) {
  const detailUrl = `${config.ACTIVE_NET_BASE_URL}/search/detail/${court.id}`;

  console.log(`   Navigating to: ${detailUrl}`);
  await page.goto(detailUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Extract court metadata
  const courtInfo = await page.evaluate((selectors) => {
    const titleEl = document.querySelector('h1');
    const metadataEl = document.querySelector('[class*="type"], p');

    return {
      name: titleEl ? titleEl.textContent.trim() : null,
      metadata: metadataEl ? metadataEl.textContent.trim() : null
    };
  }, config.SELECTORS);

  console.log(`   Found court: ${courtInfo.name || court.name}`);

  // Determine location (North or South)
  const location = court.name.includes('North') ? 'North' : court.name.includes('South') ? 'South' : 'Unknown';

  // Generate ID from name
  const id = court.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Scrape calendar data
  console.log(`   Scraping calendar...`);
  const calendarData = await scrapeCalendarDays(page);

  console.log(`   Found ${Object.keys(calendarData).length} dates with availability`);

  // Convert to dates object format
  const dates = {};
  for (const [dateStr, timeRanges] of Object.entries(calendarData)) {
    dates[dateStr] = {
      slots: convertTimeRangesToSlots(timeRanges)
    };
  }

  return {
    id,
    name: courtInfo.name || court.name,
    location,
    dates
  };
}

/**
 * Scrape calendar days and extract time ranges
 */
async function scrapeCalendarDays(page) {
  const calendarData = await page.evaluate(() => {
    const data = {};

    // Find calendar - try multiple approaches
    let calendar = document.querySelector('table');
    if (!calendar) {
      calendar = document.querySelector('[class*="calendar"]');
    }
    if (!calendar) {
      calendar = document.querySelector('[role="grid"]');
    }

    if (!calendar) {
      console.log('❌ No calendar found');
      return data;
    }

    console.log('✅ Found calendar table');

    // Find all table cells (calendar days)
    const cells = calendar.querySelectorAll('td');
    console.log(`Found ${cells.length} table cells`);

    for (const cell of cells) {
      try {
        const cellText = cell.textContent.trim();

        // Skip empty cells or header cells
        if (!cellText || cellText.length < 1) continue;

        // Look for day number (1-31)
        const dayMatch = cellText.match(/^(\d{1,2})\b/);
        if (!dayMatch) continue;

        const day = parseInt(dayMatch[1], 10);
        if (day < 1 || day > 31) continue;

        // Determine the date
        // The calendar shows the current month, so we need to figure out year/month
        const now = new Date();
        let targetDate = new Date(now.getFullYear(), now.getMonth(), day);

        // If the day is before today, it's probably next month
        if (targetDate < now) {
          targetDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
        }

        const dateKey = targetDate.toISOString().split('T')[0];

        // Extract time ranges from cell text
        const timeRanges = [];

        // Match patterns like "8:00 AM - 10:00 AM" or "12:30 PM - 2:00 PM"
        const timeRangePattern = /(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/gi;
        const matches = Array.from(cellText.matchAll(timeRangePattern));

        for (const match of matches) {
          timeRanges.push({
            start: match[1].trim(),
            end: match[2].trim()
          });
        }

        if (timeRanges.length > 0) {
          data[dateKey] = timeRanges;
          console.log(`Date ${dateKey}: ${timeRanges.length} time ranges`);
        }

      } catch (err) {
        console.error('Error processing cell:', err.message);
      }
    }

    return data;
  });

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

  // Sort ranges by start time
  availableRanges.sort((a, b) => a.start - b.start);

  // Generate hourly slots
  for (let hour = dayStart; hour < dayEnd; hour++) {
    const slotStart = hour;
    const slotEnd = hour + 1;

    // Check if this hour overlaps with any available range
    const isAvailable = availableRanges.some(range => {
      // Check if the hour slot overlaps with this availability range
      return (slotStart >= range.start && slotStart < range.end) ||
             (slotEnd > range.start && slotEnd <= range.end) ||
             (slotStart <= range.start && slotEnd >= range.end);
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
if (import.meta.url === `file://${process.argv[1]}`) {
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

export { scrapeOceanParkCourts };
