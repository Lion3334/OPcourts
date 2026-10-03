// Turns the city's open time ranges into reserved times for display.

export const DEFAULT_HOURS = { North: [480, 1260], South: [480, 1140] };

export const toMin = s => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

function fmt(min, withSuffix) {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + (m ? ':' + String(m).padStart(2, '0') : '') + (withSuffix ? (h < 12 ? 'am' : 'pm') : '');
}

// "9–11am", "9am–12:30pm"
export function fmtRange(a, b) {
  const same = (a < 720) === (b < 720);
  return fmt(a, !same) + '–' + fmt(b, true);
}

// A side's hours that day = earliest start and latest end across its courts.
export function sideHours(courts, side, date) {
  let lo = Infinity, hi = -Infinity;
  courts.filter(c => c.side === side).forEach(c => (c.dates[date] || []).forEach(([s, e]) => {
    lo = Math.min(lo, toMin(s));
    hi = Math.max(hi, toMin(e));
  }));
  return lo === Infinity ? DEFAULT_HOURS[side] : [lo, hi];
}

// Reserved = the gaps between open ranges, within the side's hours.
export function reserved(open, [lo, hi]) {
  const out = [];
  let cur = lo;
  open.map(([s, e]) => [toMin(s), toMin(e)]).sort((a, b) => a[0] - b[0]).forEach(([s, e]) => {
    if (s > cur) out.push([cur, Math.min(s, hi)]);
    cur = Math.max(cur, e);
  });
  if (cur < hi) out.push([cur, hi]);
  return out.filter(([a, b]) => b > a);
}

// Date helpers on "YYYY-MM-DD" strings, using noon to stay clear of DST edges.
export const shiftDate = (d, n) => {
  const dt = new Date(d + 'T12:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toLocaleDateString('en-CA');
};

export const longDate = (d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', opts);
