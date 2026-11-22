import { useState, useEffect, useRef } from 'react';
import DatePicker from './components/DatePicker';
import CourtCard from './components/CourtCard';
import Share from './components/Share';
import WeatherStatus from './components/WeatherStatus';
import { sideHours, reserved, longDate, shiftDate, ago } from './availability';
import { fetchWeather } from './weather';
import { startScene } from './scene';

const PORTAL = 'https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing';

// Courts listed north to south; rows of two are centered.
const LAYOUT = {
  North: [['16', '15'], ['14', '13', '12'], ['11', '10', '9'], ['8', '7', '6'], ['5', '4', '3'], ['2', '1']],
  South: [['H', 'G'], ['F', 'E', 'D'], ['C', 'B', 'A']],
};

const todayLA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

// A shared link carries the day being viewed (?date=2026-11-23). Past or bad dates are ignored, which leaves the base page.
function dateFromUrl() {
  const d = new URLSearchParams(location.search).get('date');
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d > todayLA() && shiftDate(d, 0) === d ? d : null;
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(dateFromUrl);
  const [weather, setWeather] = useState(null);
  const [now, setNow] = useState(Date.now);
  const sceneRef = useRef(null), canvasRef = useRef(null), wrapRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/courts.json`, { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error('Could not load court data. Try refreshing the page.');
        return r.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  // The forecast is a bonus: if it fails the page just goes without the weather box.
  useEffect(() => { fetchWeather().then(setWeather).catch(() => setWeather('error')); }, []);

  // Keeps "Last updated" right while the page stays open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Keep the address on the day being viewed so the phone's share button sends it. Today is the plain address.
  useEffect(() => {
    const url = new URL(location.href);
    if (selected > todayLA()) url.searchParams.set('date', selected);
    else url.searchParams.delete('date');
    history.replaceState(null, '', url);
  }, [selected]);

  useEffect(() => startScene(canvasRef.current, sceneRef.current, wrapRef.current), []);

  let content, updated = null;
  if (error) {
    content = <p className="later">{error}</p>;
  } else if (!data) {
    content = <p className="day">Loading courts…</p>;
  } else {
    // Data dates still in the future (an old file shouldn't offer past days).
    const today = todayLA();
    const dates = Object.keys(data.courts[0].dates).sort().filter(d => d >= today);
    const first = dates[0] ?? today;
    const last = dates[dates.length - 1] ?? today;
    const day = selected && selected >= first ? selected : first;

    const hours = { North: sideHours(data.courts, 'North', day), South: sideHours(data.courts, 'South', day) };
    const res = {};
    data.courts.forEach(c => { res[c.side + c.label] = reserved(c.dates[day] || [], hours[c.side]); });
    // Every card reserves room for the most time lines any card has that day, so all cards match.
    const lines = Math.max(...data.courts.map(c => {
      const r = res[c.side + c.label], h = hours[c.side];
      return r.length === 1 && r[0][0] === h[0] && r[0][1] === h[1] ? 1 : r.length;
    }));
    updated = ago(now - new Date(data.lastUpdated));

    content = (
      <>
        <DatePicker selected={day} first={first} last={last} onChange={setSelected} />
        <main style={{ display: 'flex', flexDirection: 'column', gap: 22, '--n': lines }}>
          <WeatherStatus weather={weather} day={day} />
          {day > last ? (
            <div className="later">
              <p><strong>This site shows the next two weeks, through {longDate(last, { month: 'long', day: 'numeric' })}.</strong></p>
              <p>For later dates, check the city's reservation site directly.</p>
              <a href={PORTAL} target="_blank" rel="noopener noreferrer">Open the Santa Monica Recreation portal</a>
            </div>
          ) : (
            Object.entries(LAYOUT).map(([side, rows]) => (
              <section key={side}>
                <div className="side">{side} Courts</div>
                <div className="grid">
                  {rows.flatMap(row => row.map((label, i) => (
                    <CourtCard
                      key={label}
                      side={side}
                      label={label}
                      res={res[side + label]}
                      hours={hours[side]}
                      center={row.length === 2 && i === 0}
                    />
                  )))}
                </div>
              </section>
            ))
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="g-ok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: 'var(--ok)', stopOpacity: 0.22 }} /><stop offset="1" style={{ stopColor: 'var(--ok)', stopOpacity: 0 }} /></linearGradient>
          <linearGradient id="g-res" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.25 }} /><stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} /></linearGradient>
        </defs>
      </svg>

      <div className="scene" ref={sceneRef} aria-hidden="true"><canvas ref={canvasRef} /></div>

      <div className="wrap" ref={wrapRef}>
        <header>
          <div>
            <h1>OP Court Availability</h1>
            {updated && <p className="updated">Last updated: {updated}</p>}
          </div>
          <Share />
        </header>
        {content}
        <footer>
          <p>Data comes from the <a href={PORTAL} target="_blank" rel="noopener noreferrer">Santa Monica Recreation portal</a>.</p>
        </footer>
      </div>
    </>
  );
}

export default App;
