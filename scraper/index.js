// Fetches open time ranges for the 24 Ocean Park volleyball courts from the
// City of Santa Monica's reservation site and writes them for the website.
// See docs/AVAILABILITY_API.md for how the endpoint works.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../frontend/public/data/courts.json');
const API = 'https://anc.apm.activecommunities.com/santamonicarecreation/rest/reservation/resource/availability/daily';
const DAYS = 14;

// [side, label, city facility id]
const COURTS = [
  ['North', '1', 168], ['North', '2', 169], ['North', '3', 170], ['North', '4', 171],
  ['North', '5', 172], ['North', '6', 173], ['North', '7', 174], ['North', '8', 175],
  ['North', '9', 182], ['North', '10', 176], ['North', '11', 177], ['North', '12', 463],
  ['North', '13', 673], ['North', '14', 674], ['North', '15', 675], ['North', '16', 676],
  ['South', 'A', 179], ['South', 'B', 180], ['South', 'C', 181], ['South', 'D', 666],
  ['South', 'E', 667], ['South', 'F', 668], ['South', 'G', 709], ['South', 'H', 710],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Dates are Santa Monica dates, whatever time zone this runs in.
function pacificDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

async function fetchCourt(id, start, end) {
  const url = `${API}/${id}?start_date=${start}&end_date=${end}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.headers?.response_code !== '0000') throw new Error(json.headers?.response_message || 'bad response');
      const dates = {};
      for (const day of json.body.details.daily_details) {
        dates[day.date] = day.status === 0
          ? day.times.map(t => [t.start_time.slice(0, 5), t.end_time.slice(0, 5)])
          : [];
      }
      return dates;
    } catch (err) {
      if (attempt >= 3) throw new Error(`court ${id}: ${err.message}`);
      await sleep(2000 * attempt);
    }
  }
}

async function main() {
  const start = pacificDate(0);
  const end = pacificDate(DAYS - 1);
  console.log(`Fetching ${COURTS.length} courts, ${start} to ${end}`);

  const courts = [];
  for (const [side, label, id] of COURTS) {
    courts.push({ side, label, dates: await fetchCourt(id, start, end) });
    await sleep(500);
  }

  const data = { lastUpdated: new Date().toISOString(), courts };
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data) + '\n');
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Failed, existing data left unchanged:', err.message);
  process.exit(1);
});
