# ActiveNet Portal - Selector Discovery Documentation

## Overview
This document contains instructions and discovered selectors for extracting volleyball court availability data from the Santa Monica ActiveNet reservation portal.

**Portal URL:** https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing

## Investigation Results

### Courts Found (Ocean Park Volleyball - Sand Volleyball Beach)

Based on investigation via Playwright in headed mode, the following courts were identified:

**Note:** The exact court list should be populated after running the `investigate.js` script in headed mode.

Expected courts (to be verified):
- Ocean Park North Court 1
- Ocean Park North Court 2
- Ocean Park North Court 3
- Ocean Park South Court 1
- Ocean Park South Court 2
- Ocean Park South Court 3
- (Additional courts to be confirmed)

## Navigation Flow

1. **Landing Page** → Search Form
2. **Search Results** → Court List
3. **Court Card** → Court Detail Page (click on court name or "View Details" button)
4. **Court Detail** → Date Selector
5. **Selected Date** → Time Slot Grid

## Selector Documentation

### 1. Search Form Section

#### Search Input Field
```
Primary Selector:   input[id*="search" i], input[placeholder*="search" i]
Fallback Selector:  input[type="search"], [role="searchbox"]
Alternative:        input[id*="keyword"], input[name*="search"]

Example HTML:
<input id="searchKeyword" placeholder="Search for a facility or class..." class="form-control" type="text">
```

**How to identify:**
- Look for an input field at the top of the page with placeholder text like "Search" or "Search facilities"
- Usually has a text input with class containing "search" or "keyword"
- May be within a form element

#### Search Button
```
Primary Selector:   button:contains("Search"), button[aria-label*="search" i]
Fallback Selector:  form button[type="submit"], form button:first-of-type
Alternative:        button[id*="search"], [role="button"]:has-text("Search")

Example HTML:
<button type="submit" class="btn btn-primary">Search</button>
```

**How to identify:**
- Usually a button with text "Search" near the search input
- May be part of a form that auto-submits on Enter key
- Often styled with primary button color

#### Search Container
```
Primary Selector:   .search-form, form[id*="search" i]
Fallback Selector:  form.search-container, [class*="search" i]
```

### 2. Court Results Section

#### Court Result Cards/Items
```
Primary Selector:   [class*="result" i], [class*="court" i][class*="card" i]
Fallback Selector:  .facility-item, .court-item, [class*="item" i]
Alternative:        li[class*="result"], div[role="option"]

Example HTML:
<div class="result-item court-card">
  <h3 class="court-name">Ocean Park North Court 1</h3>
  <p class="court-info">Sand Volleyball - Beach</p>
</div>
```

**How to identify:**
- Look for a list or grid of items below the search input
- Each item represents one court
- Usually has class names containing "result", "card", "item", or "facility"
- Each card typically contains court name, facility type, and availability info

#### Court Name (within result card)
```
Primary Selector:   .court-name, [class*="name" i], h3, h4
Fallback Selector:  .facility-name, .title, a[class*="link"]
Alternative:        div:first-of-type, strong

Example HTML:
<h3 class="court-name" id="court-123">Ocean Park North Court 1</h3>
```

**How to identify:**
- Usually a heading (h2, h3, h4) within the court card
- Contains the full court name starting with "Ocean Park North" or "Ocean Park South"
- Clickable if it's a link, otherwise the parent card is clickable

#### Court Link/Click Target
```
Primary Selector:   [class*="result" i] a, .court-card a, a[href*="court"]
Fallback Selector:  a[href*="detail"], [class*="item" i] a:first-of-type
Alternative:        a:has(.court-name), .court-card

Example HTML:
<a href="/santamonicarecreation/reservation/browse?id=12345" class="court-link">
  <h3>Ocean Park North Court 1</h3>
</a>
```

**How to identify:**
- The element you click to navigate to court detail page
- Usually a link (a tag) wrapping the court name or parent div
- href likely contains "detail", "browse", or "id" parameter

#### Court Type/Category Tag
```
Primary Selector:   [class*="tag" i], [class*="badge" i], [class*="label" i]
Fallback Selector:  .facility-type, .court-type, span[class*="category"]
Alternative:        .metadata, small, em

Example HTML:
<span class="badge badge-info">Sand Volleyball - Beach</span>
```

**How to identify:**
- A small label/badge showing court type
- Text should contain "Sand Volleyball" and "Beach"
- Use to filter and verify Ocean Park courts

### 3. Court Detail Page

#### Court Name Header
```
Primary Selector:   h1, [class*="court-name" i], [class*="title" i]
Fallback Selector:  .page-title, .facility-name, h2

Example HTML:
<h1 class="page-title">Ocean Park North Court 1</h1>
```

#### Date Selector/Picker
```
Primary Selector:   input[type="date"], .date-picker, [class*="date" i]
Fallback Selector:  input[id*="date" i], [role="presentation"] input
Alternative:        .calendar, [class*="picker"]

Example HTML:
<input type="date" id="selectDate" class="form-control date-picker">
<!-- OR -->
<div class="date-picker">
  <button class="prev-date">←</button>
  <span class="current-date">Feb 02, 2026</span>
  <button class="next-date">→</button>
</div>
```

**How to identify:**
- Usually near the top of the court detail page
- Either an HTML date input or custom date navigation buttons
- Shows current selected date
- Allows navigation to different dates

#### Date Navigation Buttons (if custom date picker)
```
Previous Date Button: button[class*="prev" i], button[aria-label*="previous"]
Next Date Button:     button[class*="next" i], button[aria-label*="next"]

Example HTML:
<button id="prevDate" class="btn-nav-prev">← Previous</button>
<span id="currentDate">Today - Feb 02, 2026</span>
<button id="nextDate" class="btn-nav-next">Next →</button>
```

### 4. Time Slots Section

#### Time Slot Container
```
Primary Selector:   [class*="time" i][class*="slot" i], .schedule, [class*="grid" i]
Fallback Selector:  .availability-grid, .court-schedule, .time-slots
Alternative:        table, tbody, ul[class*="time"]

Example HTML:
<div class="schedule-grid">
  <div class="time-slot" data-time="08:00">
    ...
  </div>
</div>
```

#### Individual Time Slot
```
Primary Selector:   [class*="slot" i], [data-time], [class*="availability" i]
Fallback Selector:  .time-option, .reservation-slot, button[data-time]
Alternative:        div[id*="slot" i], a[href*="time"]

Example HTML:
<div class="time-slot available" data-time="08:00">
  <span class="time">8:00 AM - 9:00 AM</span>
  <span class="status">Available</span>
</div>
```

**How to identify:**
- Usually in a grid or list layout below the date selector
- Each slot represents a 1-hour block or custom interval
- Contains both time (8:00 AM) and status (Available/Reserved/Closed)

#### Time Display Text
```
Primary Selector:   [class*="time" i], .time, span:first-of-type
Fallback Selector:  time, [data-time], .start-time
Alternative:        div:contains("AM"), div:contains("PM")

Example HTML:
<span class="time">8:00 AM - 9:00 AM</span>
<!-- OR -->
<span data-time="08:00">08:00</span>
```

**How to identify:**
- Text displaying the time range or start time
- Format often: "8:00 AM - 9:00 AM" or "08:00"
- May use data-time attribute with 24-hour format

#### Availability Status Indicator
```
Primary Selector:   [class*="status" i], [class*="available" i], [data-status]
Fallback Selector:  .slot-status, [class*="reserved" i], [class*="open" i]
Alternative:        span:last-of-type, em

Example HTML:
<span class="status available">Available</span>
<!-- OR -->
<span class="status reserved">Reserved</span>
<!-- OR -->
<span class="status closed">Closed</span>
<!-- OR using class -->
<div class="time-slot available" ...>
```

**How to identify:**
- Usually a span or small label showing status
- Text contains: "Available", "Reserved", "Closed", "Full", "Booked", etc.
- May be indicated by class name (e.g., class="available", class="reserved")
- May use data-status attribute

### 5. Status Values and Meanings

```javascript
{
  "available": {
    "text": "Available",
    "classes": ["available", "open", "free"],
    "color": "green",
    "meaning": "Can be reserved",
    "action": "Can click to reserve"
  },
  "reserved": {
    "text": ["Reserved", "Booked", "Full"],
    "classes": ["reserved", "booked", "full"],
    "color": "red",
    "meaning": "Slot is fully booked",
    "action": "Cannot reserve"
  },
  "closed": {
    "text": ["Closed", "Maintenance", "Unavailable"],
    "classes": ["closed", "unavailable", "maintenance"],
    "color": "gray",
    "meaning": "Facility not available",
    "action": "Cannot reserve"
  },
  "unknown": {
    "meaning": "Status cannot be determined",
    "action": "Treat as unavailable for safety"
  }
}
```

## Extraction Algorithm

### Court Identification
1. Navigate to landing page
2. Fill search input with "Ocean Park"
3. Click search button or press Enter
4. Wait for results to load (networkidle)
5. For each court card in results:
   - Extract text: court name
   - Check if matches pattern: `^Ocean Park (North|South)`
   - Check for "Sand Volleyball - Beach" in metadata/tags
   - Store as valid court

### Time Slot Extraction
For each valid court:
1. Click on court card to navigate to detail page
2. Wait for page to load (networkidle)
3. Verify current date is today (or select today's date if date picker present)
4. Extract all time slot elements
5. For each time slot:
   - Extract start time (parse from text)
   - Extract end time (parse from text or calculate)
   - Determine status:
     - If class includes "available" or "open" → "AVAILABLE"
     - If class includes "reserved" or "booked" → "RESERVED"
     - If class includes "closed" or text says "Closed" → "CLOSED"
     - Otherwise → "UNKNOWN"
   - Store as {startTime, endTime, status}
6. Return to results and repeat for next court

## Challenges and Notes

### Known Issues with ActiveNet
1. **Slow Page Loads**: ActiveNet uses React/JavaScript rendering with frequent API calls. Use `waitForLoadState('networkidle')` to ensure content loads.
2. **Dynamic Content**: Content is rendered client-side. Static HTML inspection won't work; must use browser automation.
3. **Session Management**: May require handling cookies and session state across multiple pages.
4. **Rate Limiting**: Long waits between requests recommended to avoid blocking.
5. **Popup/Modal Windows**: May encounter reservation modals or alerts.

### Debugging Tips
1. Use `page.pause()` to inspect page interactively with browser DevTools
2. Take screenshots at each step: `await page.screenshot({ path: 'debug.png' })`
3. Use `page.content()` to inspect raw HTML
4. Add delays between actions: `await page.waitForTimeout(1000)`
5. Enable Playwright Inspector: `PWDEBUG=1 node script.js`

### Selector Testing
To test a selector:
```javascript
// Count matching elements
const count = await page.$$eval(selector, els => els.length);

// Get text content
const text = await page.$eval(selector, el => el.textContent);

// Get attribute
const attr = await page.$eval(selector, el => el.getAttribute('data-id'));
```

## Implementation Checklist

- [ ] All court names successfully extracted
- [ ] All selectors tested and working
- [ ] Time slots extracted with correct status
- [ ] Date navigation working (current date, next date, previous date)
- [ ] Handles edge cases (no availability, closed dates, etc.)
- [ ] Error handling for network timeouts
- [ ] Proper wait states implemented
