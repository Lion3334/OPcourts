// Forecast for the courts: fetched from Open-Meteo (free, no key) and split into three time blocks per day.

// Ocean Park courts, Santa Monica (zip 90405), the exact point from the user's Google Maps pin.
const LAT = 34.00195345429915, LON = -118.48986676222847;

export const BLOCKS = [
  { key: 'morn', label: 'Morn.', from: 7, to: 11 },
  { key: 'noon', label: 'Noon', from: 11, to: 15 },
  { key: 'aft', label: 'Afternoon', from: 15, to: 19 },
];

// Flag thresholds. Rain needs both a likely chance and a real amount; cold is the 9am temperature.
const RAIN_PROB = 50, RAIN_INCHES = 0.1, GUST_MPH = 25, COLD_F = 50, COLD_HOUR = 9;

const URL = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: LAT,
  longitude: LON,
  hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_gusts_10m',
  temperature_unit: 'fahrenheit',
  wind_speed_unit: 'mph',
  precipitation_unit: 'inch',
  timezone: 'America/Los_Angeles',
  forecast_days: 16,
});

// { 'YYYY-MM-DD': { 7: { temp, prob, rain, code, gust }, 8: {...}, ... } } in Pacific time.
export async function fetchWeather() {
  const r = await fetch(URL);
  if (!r.ok) throw new Error('Could not load the forecast.');
  const { hourly: h } = await r.json();
  const days = {};
  h.time.forEach((t, i) => {
    (days[t.slice(0, 10)] ??= {})[Number(t.slice(11, 13))] = {
      temp: h.temperature_2m[i],
      prob: h.precipitation_probability[i],
      rain: h.precipitation[i],
      code: h.weather_code[i],
      gust: h.wind_gusts_10m[i],
    };
  });
  return days;
}

// Weather code (WMO) to a simple sky type, plus how bad each type is so a block shows its worst hour.
export const skyOf = c => (c >= 95 ? 'storm' : c >= 51 ? 'rain' : c === 3 || c >= 45 ? 'cloud' : c >= 1 ? 'partly' : 'sun');
export const SKY_LABEL = { sun: 'Clear', partly: 'Partly cloudy', cloud: 'Cloudy', rain: 'Rain', storm: 'Thunderstorms' };
const SKY_RANK = { sun: 0, partly: 1, cloud: 2, rain: 3, storm: 4 };

const nums = (rows, k) => rows.map(r => r[k]).filter(v => typeof v === 'number');

// One day's three blocks: high/low temp, worst sky, chance of rain, gusts, and any flags.
// Returns null when the forecast has no hours for that day.
export function summarizeDay(hours) {
  if (!hours) return null;
  const blocks = BLOCKS.map(({ key, label, from, to }) => {
    const rows = [];
    for (let h = from; h < to; h++) if (hours[h]) rows.push(hours[h]);
    const temps = nums(rows, 'temp');
    if (!temps.length) return null;

    const prob = Math.max(0, ...nums(rows, 'prob'));
    const rain = nums(rows, 'rain').reduce((a, b) => a + b, 0);
    const gust = Math.max(0, ...nums(rows, 'gust'));
    const sky = nums(rows, 'code').map(skyOf).reduce((a, b) => (SKY_RANK[b] > SKY_RANK[a] ? b : a), 'sun');

    const flags = [];
    if (prob >= RAIN_PROB && rain >= RAIN_INCHES) flags.push('Rain');
    if (gust >= GUST_MPH) flags.push('Windy');
    if (key === 'morn' && hours[COLD_HOUR]?.temp <= COLD_F) flags.push('Cold');

    return { key, label, hi: Math.round(Math.max(...temps)), lo: Math.round(Math.min(...temps)), sky, prob: Math.round(prob), gust: Math.round(gust), flags };
  });
  return blocks.some(Boolean) ? blocks : null;
}
