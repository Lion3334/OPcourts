// Configuration for Ocean Park volleyball court scraper

module.exports = {
  // ActiveNet portal settings
  ACTIVE_NET_BASE_URL: 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing',
  SEARCH_URL: 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing/search',

  // Search parameters
  SEARCH_KEYWORD: 'ocean park',
  COURT_NAME_PATTERNS: [/^Ocean Park North/i, /^Ocean Park South/i],
  METADATA_TAG: 'Sand Volleyball - Beach',

  // Scraping settings
  DAYS_AHEAD: 28,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  WAIT_FOR_NETWORK_IDLE: true,

  // Output settings
  OUTPUT_PATH: '../frontend/public/data/courts.json',

  // Browser settings
  HEADLESS: process.env.HEADLESS !== 'false',

  // Selectors (based on screenshots and investigation)
  SELECTORS: {
    // Search results page
    courtCard: '.facility-card, [class*="facility"], [class*="resource-card"]',
    courtName: 'h2, h3, .facility-name, [class*="name"]',
    courtLink: 'a[href*="/detail/"]',
    availableBadge: '.badge, [class*="available"]',
    courtType: '.facility-type, [class*="type"], p',

    // Court detail page
    courtTitle: 'h1, .page-title, [class*="title"]',
    courtMetadata: '.facility-type, [class*="metadata"], [class*="category"]',
    calendar: '.calendar, [class*="calendar"]',
    calendarDay: 'td, [class*="day"], [class*="date"]',
    timeRange: '[class*="time"], .time-range',
    moreLink: '[class*="more"], a[class*="link"]',
    tooltip: '.an-portal, [class*="tooltip"], [class*="popover"]'
  }
};
