#!/usr/bin/env node

/**
 * Investigation Script for ActiveNet Portal
 *
 * This script launches Playwright in headed mode to investigate the ActiveNet portal
 * and identify selectors for extracting volleyball court availability data.
 *
 * Usage: HEADLESS=false node investigate.js
 */

import { chromium } from 'playwright';

const HEADLESS = process.env.HEADLESS !== 'false';
const BASE_URL = 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing';

async function investigate() {
  console.log('Starting investigation of ActiveNet portal...');
  console.log(`Headless mode: ${HEADLESS}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: HEADLESS,
  });

  try {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    // Set a reasonable timeout
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(30000);

    // Navigate to landing page
    console.log('1. Navigating to ActiveNet landing page...');
    await page.goto(BASE_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✓ Landing page loaded\n');

    // Take a screenshot
    await page.screenshot({ path: 'landing.png' });
    console.log('Screenshot saved: landing.png\n');

    // Pause for manual inspection if in headed mode
    if (!HEADLESS) {
      console.log('Pausing for manual inspection. Use browser developer tools to:');
      console.log('1. Identify search input field');
      console.log('2. Identify search button');
      console.log('3. Understand page structure\n');
      await page.pause();
    }

    // Try to find search input
    console.log('2. Looking for search input field...');
    const searchSelectors = [
      'input[placeholder*="search" i]',
      'input[id*="search" i]',
      'input[id*="keyword"]',
      'input[type="search"]',
      '[role="searchbox"]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      const found = await page.$(selector);
      if (found) {
        console.log(`✓ Found search input: ${selector}`);
        searchInput = selector;
        break;
      }
    }

    if (!searchInput && !HEADLESS) {
      console.log('Could not auto-find search input. Pausing for manual inspection...');
      await page.pause();
    }

    if (searchInput) {
      console.log(`3. Searching for "Ocean Park"...`);
      await page.fill(searchInput, 'Ocean Park');

      // Look for search button
      const searchButtonSelectors = [
        'button:has-text("Search")',
        'button[id*="search" i]',
        'form button',
        'button[aria-label*="search" i]',
      ];

      let searchButton = null;
      for (const selector of searchButtonSelectors) {
        try {
          const found = await page.$(selector);
          if (found) {
            console.log(`✓ Found search button: ${selector}`);
            searchButton = selector;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (searchButton) {
        await page.click(searchButton);
        await page.waitForLoadState('networkidle');
      } else {
        console.log('Could not find search button, trying enter key...');
        await page.press(searchInput, 'Enter');
        await page.waitForLoadState('networkidle');
      }

      console.log('✓ Search completed\n');

      // Take screenshot of results
      await page.screenshot({ path: 'search_results.png' });
      console.log('Screenshot saved: search_results.png\n');

      // Look for court result cards
      console.log('4. Searching for court result cards...');

      const courtCardSelectors = [
        '[class*="court" i]',
        '[class*="result" i]',
        '[class*="item" i]',
        '.card',
        '.result-item',
        '[role="link"]',
        'a[href*="court"]',
      ];

      for (const selector of courtCardSelectors) {
        try {
          const count = await page.$$eval(selector, els => els.length);
          if (count > 0) {
            console.log(`✓ Found ${count} elements matching: ${selector}`);
          }
        } catch (e) {
          // Continue
        }
      }

      // Extract court names
      console.log('\n5. Extracting court names...');
      const courtNames = await page.$$eval('body', ([el]) => {
        const courts = [];
        const textContent = el.innerText;
        const lines = textContent.split('\n');
        for (const line of lines) {
          if (line.includes('Ocean Park North') || line.includes('Ocean Park South')) {
            if (!courts.includes(line.trim())) {
              courts.push(line.trim());
            }
          }
        }
        return courts;
      });

      if (courtNames.length > 0) {
        console.log('✓ Found the following courts:');
        courtNames.forEach((name, i) => {
          console.log(`  ${i + 1}. ${name}`);
        });
      } else {
        console.log('No Ocean Park courts found in text content');
      }

      console.log('\n6. Investigation paused for manual inspection...');
      if (!HEADLESS) {
        console.log('Use browser to:');
        console.log('1. Click on a court to see detail page');
        console.log('2. Identify date picker selectors');
        console.log('3. Identify time slot selectors');
        console.log('4. Note availability status indicators\n');
        await page.pause();
      }
    }

    console.log('\nInvestigation complete. Check screenshots and notes above.');

    await context.close();
  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    await browser.close();
  }
}

investigate().catch(console.error);
